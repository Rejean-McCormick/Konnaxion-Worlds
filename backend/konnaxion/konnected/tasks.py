# konnaxion/konnected/tasks.py
from __future__ import annotations

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Union

from celery import shared_task
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Optional imports – keep this module importable even before all models exist.
# ---------------------------------------------------------------------------

try:
    from .models import KnowledgeResource  # type: ignore[attr-defined]
except Exception:  # pragma: no cover - defensive import for early migrations
    KnowledgeResource = None  # type: ignore[assignment]

try:
    from .models import OfflinePackage  # type: ignore[attr-defined]
except Exception:  # pragma: no cover - model may not exist yet
    OfflinePackage = None  # type: ignore[assignment]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _offline_root() -> Path:
    """
    Resolve the directory where offline exports/manifests are written.

    By default this is <MEDIA_ROOT>/offline_packages.
    """
    media_root = Path(getattr(settings, "MEDIA_ROOT", "."))
    base = media_root / "offline_packages"
    base.mkdir(parents=True, exist_ok=True)
    return base


def _normalize_manifest_type(raw_type: Any) -> Optional[str]:
    """
    Map internal KnowledgeResource.type values to the v14 CONTENT_TYPES_ALLOWED enum.

    Frontend expects one of: "article", "video", "lesson", "quiz", "dataset".
    Current backend choices are: "video", "doc", "course", "other".
    """
    if raw_type is None:
        return None

    value = str(raw_type).lower()

    # Direct mapping
    if value == "video":
        return "video"

    # Our "doc" is treated as a textual/article-like resource.
    if value in ("doc", "document", "file"):
        return "article"

    # Courses/modules are treated as lessons in the offline UI.
    if value in ("course", "module"):
        return "lesson"

    # Fallback: treat unknown/other as a generic article.
    return "article"


def _serialize_resource(resource: Any) -> Dict[str, Any]:
    """
    Minimal serialisation of a KnowledgeResource for inclusion in offline bundles.

    The shape is intentionally simple and stable; the frontend's offline viewer
    can evolve independently as long as these core keys remain available.
    """
    created_at = getattr(resource, "created_at", None)
    updated_at = getattr(resource, "updated_at", None)

    raw_type = getattr(resource, "type", None)
    manifest_type = _normalize_manifest_type(raw_type)

    return {
        "id": getattr(resource, "pk", None),
        "title": getattr(resource, "title", None),
        # Normalised to the v14 enum expected by the offline-facing UIs.
        "type": manifest_type,
        "url": getattr(resource, "url", None),
        "author_id": getattr(resource, "author_id", None),
        "created_at": created_at.isoformat() if hasattr(created_at, "isoformat") else None,
        "updated_at": updated_at.isoformat() if hasattr(updated_at, "isoformat") else None,
    }


def _estimate_resource_size_mb(resource: Any) -> float:
    """
    Best-effort size estimation for a resource, in megabytes.

    We look for a few commonly-used attributes; if none is present,
    we fall back to 0.0 to avoid over-counting.
    """
    candidates = (
        getattr(resource, "size_mb", None),
        getattr(resource, "sizeMb", None),
        getattr(resource, "bundle_size_mb", None),
        getattr(resource, "bundleSizeMb", None),
    )
    for value in candidates:
        if value is None:
            continue
        try:
            return float(value)
        except (TypeError, ValueError):
            continue
    return 0.0


def _safe_slug(value: Optional[str], fallback: str) -> str:
    """
    Very small, dependency-free slugifier for filenames.
    """
    base = (value or "").strip() or fallback
    slug_chars: List[str] = []
    for ch in base:
        slug_chars.append(ch.lower() if ch.isalnum() else "-")
    slug = "".join(slug_chars).strip("-")
    return slug or fallback


def _ensure_offline_package_model() -> Any:
    """
    Return the OfflinePackage model or raise a clear error if it is missing.
    """
    if OfflinePackage is None:
        msg = (
            "OfflinePackage model is not available. "
            "Define the model in konnaxion.konnected.models and run migrations "
            "before using offline package tasks."
        )
        raise RuntimeError(msg)
    return OfflinePackage


def _get_include_types(package: Any) -> List[str]:
    """
    Normalise the include_types/includeTypes field on a package into a list of strings.

    Supports:
    - None / empty -> []
    - comma-separated string -> ["type1", "type2"]
    - any iterable -> list(iterable)
    """
    raw = getattr(package, "include_types", None) or getattr(
        package,
        "includeTypes",
        None,
    )
    if not raw:
        return []

    if isinstance(raw, str):
        return [t.strip() for t in raw.split(",") if t.strip()]

    try:
        return list(raw)
    except TypeError:
        # Fallback: treat as a single value.
        return [str(raw)]


def _map_frontend_types_to_backend(include_types_list: List[str]) -> Optional[List[str]]:
    """
    Map frontend offline types (article, video, lesson, quiz, dataset)
    to backend KnowledgeResource.ResourceType values (video, doc, course, other).

    Returns a list of backend type strings suitable for a type__in filter,
    or None if mapping cannot be determined (in which case we skip type filtering).
    """
    if KnowledgeResource is None or not include_types_list:
        return None

    backend_types: List[str] = []

    # Try to use the defined TextChoices enum if present.
    resource_type_enum = getattr(KnowledgeResource, "ResourceType", None)

    def _enum_value(name: str, default: str) -> str:
        if resource_type_enum is not None and hasattr(resource_type_enum, name):
            return getattr(resource_type_enum, name)
        return default

    for raw in include_types_list:
        t = str(raw).lower()

        if t == "video":
            backend_types.append(_enum_value("VIDEO", "video"))
        elif t in ("article", "dataset"):
            # Text/content-like resources → DOC
            backend_types.append(_enum_value("DOC", "doc"))
        elif t in ("lesson", "course", "module"):
            backend_types.append(_enum_value("COURSE", "course"))
        elif t == "quiz":
            # No dedicated quiz type yet – treat as OTHER.
            backend_types.append(_enum_value("OTHER", "other"))
        else:
            # Unknown type – ignore rather than fail hard.
            logger.debug("Unknown includeTypes value for offline package: %r", t)

    # De-duplicate while preserving order.
    seen = set()
    deduped: List[str] = []
    for t in backend_types:
        if t in seen:
            continue
        seen.add(t)
        deduped.append(t)

    return deduped or None


def _select_resources_for_package(package: Any) -> Iterable[Any]:
    """
    Return an iterable of KnowledgeResource objects to include in a package.

    Selection is intentionally conservative so it remains safe while the schema
    evolves:

    - If KnowledgeResource is not available, returns an empty list.
    - Otherwise, starts from all resources ordered by id.
    - Optionally applies filters based on fields present on the OfflinePackage:
        * include_types / includeTypes  -> mapped onto KnowledgeResource.type
          according to v14 content type mapping.
        * subject_filter                -> KnowledgeResource.subject (if present)
        * level_filter                  -> KnowledgeResource.level (if present)
        * language_filter               -> KnowledgeResource.language (if present)

    Any filter whose corresponding field does not yet exist on the model is
    silently ignored.
    """
    if KnowledgeResource is None:
        return []

    qs = KnowledgeResource.objects.all().order_by("id")  # type: ignore[union-attr]

    # ---- Type filter -------------------------------------------------------
    include_types_list = _get_include_types(package)
    backend_types = _map_frontend_types_to_backend(include_types_list)
    if backend_types:
        try:
            qs = qs.filter(type__in=backend_types)
        except Exception:
            # If the filter fails for any reason, fall back to the unfiltered qs.
            logger.exception(
                "Failed to apply type filter for OfflinePackage #%s",
                getattr(package, "pk", "?"),
            )

    # ---- Subject / level / language filters (optional) --------------------
    # Only apply where both the package and model expose matching attributes.
    filters: Dict[str, str] = {}
    for field, pkg_attr in (
        ("subject", "subject_filter"),
        ("level", "level_filter"),
        ("language", "language_filter"),
    ):
        value = getattr(package, pkg_attr, None)
        if value in (None, ""):
            continue
        if KnowledgeResource is not None and hasattr(KnowledgeResource, field):
            filters[field] = value  # type: ignore[assignment]

    if filters:
        try:
            qs = qs.filter(**filters)
        except Exception:
            # Ignore filter errors and return the broader queryset.
            logger.exception(
                "Failed to apply subject/level/language filters for OfflinePackage #%s",
                getattr(package, "pk", "?"),
            )

    return qs


def _enforce_size_limit(
    resources: Sequence[Any],
    max_size_mb: Optional[float],
) -> List[Any]:
    """
    Apply an approximate max-size constraint to the given resources.

    If max_size_mb is None or <= 0, the input sequence is returned as a list.
    Otherwise, resources are accumulated until the size limit would be exceeded.
    """
    if max_size_mb is None or max_size_mb <= 0:
        return list(resources)

    selected: List[Any] = []
    total = 0.0

    for res in resources:
        size = _estimate_resource_size_mb(res)
        # Always include at least the first resource, even if it exceeds the limit.
        if selected and total + size > max_size_mb:
            break
        selected.append(res)
        total += size

    return selected


def _write_package_manifest(package: Any, resources: Sequence[Any]) -> Path:
    """
    Write a JSON manifest for an OfflinePackage and return the file path.

    The manifest currently includes:
    - package metadata (id, name, filters)
    - generation timestamp
    - a list of serialised KnowledgeResource items
    """
    base_dir = _offline_root()
    package_id = getattr(package, "pk", "unknown")
    name = getattr(package, "name", None) or f"package-{package_id}"
    slug = _safe_slug(name, f"package-{package_id}")
    timestamp = timezone.now().strftime("%Y%m%d-%H%M%S")
    filename = f"offline_pkg_{slug}_{timestamp}.json"
    path = base_dir / filename

    package_meta = {
        "id": package_id,
        "name": getattr(package, "name", None),
        "description": getattr(package, "description", None),
        "target_device_type": getattr(package, "target_device_type", None)
        or getattr(package, "targetDeviceType", None),
        "max_size_mb": getattr(package, "max_size_mb", None)
        or getattr(package, "maxSizeMb", None),
        "include_types": _get_include_types(package),
        "subject_filter": getattr(package, "subject_filter", None),
        "level_filter": getattr(package, "level_filter", None),
        "language_filter": getattr(package, "language_filter", None),
    }

    manifest = {
        "package": package_meta,
        "generated_at": timezone.now().isoformat(),
        "items": [_serialize_resource(res) for res in resources],
    }

    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    return path


def _update_package_resources(package: Any, resources: Sequence[Any]) -> None:
    """
    Attach the selected resources to the package via a ManyToMany relation, if present.

    Expected schema: OfflinePackage.resources -> KnowledgeResource.m2m.
    If the relation does not exist yet, this is a no-op.
    """
    rel = getattr(package, "resources", None)
    if rel is None:
        # M2M relation not defined yet – nothing to do.
        return

    try:
        rel.set(resources)
    except Exception:
        logger.exception(
            "Failed to update resources for OfflinePackage #%s",
            getattr(package, "pk", "?"),
        )


def _set_package_status(
    package: Any,
    *,
    status: Optional[str] = None,
    progress: Optional[float] = None,
    error: Optional[str] = None,
    item_count: Optional[int] = None,
    total_size_mb: Optional[float] = None,
    last_built_at: Optional[datetime] = None,
    bundle_path: Optional[Union[Path, str]] = None,
) -> None:
    """
    Update common OfflinePackage fields in a defensive way.

    This helper deliberately avoids `update_fields` so it stays safe even if the
    exact field set changes; unknown attributes simply become transient and are
    ignored by the ORM.
    """
    if status is not None:
        setattr(package, "status", status)

    if progress is not None:
        setattr(package, "build_progress_percent", float(progress))

    if error is not None:
        setattr(package, "last_error_message", error)
    elif error is None and getattr(package, "last_error_message", None):
        # Clear stale errors on success.
        setattr(package, "last_error_message", None)

    if item_count is not None:
        setattr(package, "item_count", int(item_count))

    if total_size_mb is not None:
        setattr(package, "total_size_mb", float(total_size_mb))

    if last_built_at is not None:
        setattr(package, "last_built_at", last_built_at)

    if bundle_path is not None:
        setattr(package, "bundle_path", str(bundle_path))

    try:
        package.save()  # type: ignore[call-attr]
    except Exception:
        logger.exception(
            "Failed to save OfflinePackage #%s",
            getattr(package, "pk", "?"),
        )


# ---------------------------------------------------------------------------
# Celery tasks
# ---------------------------------------------------------------------------


@shared_task()
def export_knowledge_resources_for_offline() -> str:
    """
    Generate a JSON dump of all KnowledgeResource rows for offline use.

    The resulting file is written into <MEDIA_ROOT>/offline_packages and the
    absolute filesystem path is returned as the task result.
    """
    if KnowledgeResource is None:
        msg = "KnowledgeResource model not available; cannot export offline data."
        logger.warning(msg)
        return ""

    base_dir = _offline_root()
    timestamp = timezone.now().strftime("%Y%m%d-%H%M%S")
    out_path = base_dir / f"knowledge_resources_{timestamp}.json"

    items: List[Dict[str, Any]] = []
    # Use iterator() to avoid loading everything into memory at once.
    qs = KnowledgeResource.objects.all().order_by("id")  # type: ignore[union-attr]
    for res in qs.iterator():
        items.append(_serialize_resource(res))

    payload = {
        "generated_at": timezone.now().isoformat(),
        "count": len(items),
        "items": items,
    }

    with out_path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    logger.info("Exported %s knowledge resources to %s", len(items), out_path)
    return str(out_path)


@shared_task()
def build_offline_package(package_id: Union[int, str]) -> Dict[str, Any]:
    """
    Build or rebuild a single OfflinePackage.

    This task:
    - Resolves candidate KnowledgeResource rows according to the package filters.
    - Applies an optional maxSizeMb constraint.
    - Writes a JSON manifest for the bundle under <MEDIA_ROOT>/offline_packages.
    - Updates the package's status / counts / size metrics.

    The return value is a small summary dict suitable for logging or debugging.
    """
    model = _ensure_offline_package_model()

    try:
        package = model.objects.get(pk=package_id)  # type: ignore[attr-defined]
    except model.DoesNotExist:  # type: ignore[attr-defined]
        logger.error("OfflinePackage #%s does not exist; skipping build.", package_id)
        return {"id": package_id, "status": "missing"}

    logger.info(
        "Starting build for OfflinePackage #%s (%s)",
        getattr(package, "pk", None),
        getattr(package, "name", ""),
    )

    # Mark as building before doing any heavy work.
    _set_package_status(package, status="building", progress=0.0, error=None)

    if KnowledgeResource is None:
        error = "KnowledgeResource model not available; cannot build offline package."
        logger.error(error)
        _set_package_status(package, status="failed", progress=0.0, error=error)
        return {
            "id": getattr(package, "pk", package_id),
            "status": "failed",
            "error": error,
        }

    try:
        # Resolve candidate resources and optional max size.
        qs = _select_resources_for_package(package)
        max_size_raw = getattr(package, "max_size_mb", None) or getattr(
            package,
            "maxSizeMb",
            None,
        )
        try:
            max_size_value: Optional[float]
            max_size_value = float(max_size_raw) if max_size_raw is not None else None
        except (TypeError, ValueError):
            max_size_value = None

        # Evaluate queryset (or iterable) and enforce size constraint (if any).
        resources = list(qs)
        resources = _enforce_size_limit(resources, max_size_value)

        total_size_mb = sum(_estimate_resource_size_mb(r) for r in resources)
        manifest_path = _write_package_manifest(package, resources)
        _update_package_resources(package, resources)

        now = timezone.now()
        _set_package_status(
            package,
            status="ready",
            progress=100.0,
            error=None,
            item_count=len(resources),
            total_size_mb=total_size_mb,
            last_built_at=now,
            bundle_path=manifest_path,
        )

        logger.info(
            "OfflinePackage #%s built successfully: %s items, %.2f MB (manifest: %s)",
            getattr(package, "pk", None),
            len(resources),
            total_size_mb,
            manifest_path,
        )

        return {
            "id": getattr(package, "pk", package_id),
            "status": getattr(package, "status", None),
            "item_count": len(resources),
            "total_size_mb": total_size_mb,
            "manifest_path": str(manifest_path),
        }

    except Exception as exc:  # pragma: no cover - defensive logging
        error = f"{exc.__class__.__name__}: {exc}"
        logger.exception(
            "Failed to build OfflinePackage #%s",
            getattr(package, "pk", package_id),
        )
        _set_package_status(
            package,
            status="failed",
            progress=0.0,
            error=error,
        )
        return {
            "id": getattr(package, "pk", package_id),
            "status": "failed",
            "error": error,
        }


@shared_task()
def build_offline_packages_for_auto_sync() -> int:
    """
    Enqueue builds for all OfflinePackage objects enrolled in automatic sync.

    This task is intended to be scheduled by Celery beat according to the
    OFFLINE_PACKAGE_CRON setting (see Global Parameter Reference).
    """
    model = OfflinePackage
    if model is None:
        logger.warning(
            "OfflinePackage model not available; auto-sync task has nothing to do.",
        )
        return 0

    qs = model.objects.all()  # type: ignore[union-attr]

    # Prefer packages explicitly opted into automatic sync.
    try:
        qs = qs.filter(auto_sync=True)
    except Exception:
        # If the field does not exist yet, fall back to all packages.
        pass

    # Avoid scheduling duplicate work for packages already building.
    try:
        qs = qs.exclude(status="building")
    except Exception:
        # If there is no status field, just proceed with the base queryset.
        pass

    count = 0
    for pkg in qs.iterator():
        build_offline_package.delay(pkg.pk)
        count += 1

    logger.info("Scheduled builds for %s auto-sync offline packages.", count)
    return count
