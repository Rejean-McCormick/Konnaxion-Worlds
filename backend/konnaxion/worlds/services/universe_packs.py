from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml
from django.conf import settings
from django.db import transaction

from ..models import (
    Universe,
    World,
    WorldBuildJob,
    WorldRelation,
    WorldRelease,
    WorldSubscription,
)
from .build_queue import enqueue_world_build_job
from .builder import build_world_release, promote_release
from .seed_packs import (
    WORLD_PACK_CONTRACT,
    SeedPackCatalog,
    discover_seed_pack_catalog,
    get_seed_pack,
)

UNIVERSE_PACK_CONTRACT = "kx-universe-pack/v1"
_WORLD_KEY_RE = re.compile(r"^[a-z0-9](?:[a-z0-9-]{0,118}[a-z0-9])?$")
_SEMVER_RE = re.compile(
    r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)"
    r"(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?"
    r"(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$"
)


class UniversePackError(ValueError):
    pass


@dataclass(frozen=True, slots=True)
class UniversePack:
    root: Path
    manifest_path: Path
    universe_key: str
    title: str
    description: str
    version: str
    visibility: str
    default_world: str | None
    worlds: tuple[dict[str, Any], ...]
    relations: tuple[dict[str, Any], ...]
    subscriptions: tuple[dict[str, Any], ...]
    requires: dict[str, Any]
    metadata: dict[str, Any]
    checksum: str


def universe_seed_root() -> Path:
    configured = getattr(settings, "KONNAXION_UNIVERSE_SEED_ROOT", None)
    if configured:
        return Path(configured).resolve()

    # Konnaxion already exposes the canonical World seed root. Universe Packs
    # live beside World Packs under the same seed-data tree, so derive the
    # Universe root from that host contract instead of assuming repository
    # layout from the installed Konnaxion_Worlds package.
    configured_world_root = getattr(settings, "KONNAXION_WORLD_SEED_ROOT", None)
    if configured_world_root:
        return (Path(configured_world_root).resolve().parent / "universes").resolve()

    # Standalone Worlds keeps BASE_DIR at backend/.
    return (Path(settings.BASE_DIR) / "seed-data" / "universes").resolve()


def _inside(root: Path, candidate: Path) -> Path:
    root = root.resolve()
    resolved = candidate.resolve()
    try:
        resolved.relative_to(root)
    except ValueError as exc:
        raise UniversePackError(f"Universe Pack path escapes configured root: {candidate}") from exc
    return resolved


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _semver_key(value: str) -> tuple:
    match = _SEMVER_RE.fullmatch(value)
    if not match:
        raise UniversePackError(
            f"pack_version must be semantic versioning (MAJOR.MINOR.PATCH[-PRERELEASE]): {value!r}"
        )
    major, minor, patch = (int(match.group(i)) for i in (1, 2, 3))
    prerelease = match.group(4)
    if prerelease is None:
        pre_key = (1,)
    else:
        identifiers = []
        for token in prerelease.split("."):
            identifiers.append((0, int(token)) if token.isdigit() else (1, token.lower()))
        pre_key = (0, tuple(identifiers))
    return (major, minor, patch, pre_key)


def _validate_semver(value: str) -> None:
    _semver_key(value)


def _slug(value: Any, *, field: str) -> str:
    normalized = str(value or "").strip().lower()
    if not normalized or not _WORLD_KEY_RE.fullmatch(normalized):
        raise UniversePackError(f"Invalid {field}: {normalized!r}")
    return normalized


def load_universe_pack(manifest_path: str | Path, *, configured_root: Path | None = None) -> UniversePack:
    configured_root = (configured_root or universe_seed_root()).resolve()
    manifest_path = _inside(configured_root, Path(manifest_path))
    if manifest_path.name not in {"universe.yaml", "universe.yml"}:
        raise UniversePackError("Universe Pack manifest must be universe.yaml or universe.yml")
    with manifest_path.open("r", encoding="utf-8") as fh:
        data = yaml.safe_load(fh) or {}
    if not isinstance(data, dict):
        raise UniversePackError("Universe Pack manifest must be a YAML object.")
    if data.get("universe_contract") != UNIVERSE_PACK_CONTRACT:
        raise UniversePackError(f"universe_contract must be {UNIVERSE_PACK_CONTRACT}")

    universe_key = _slug(data.get("universe_key"), field="universe_key")
    title = str(data.get("title") or "").strip()
    description = str(data.get("description") or "")
    version = str(data.get("pack_version") or "").strip()
    visibility = str(data.get("visibility") or Universe.VISIBILITY_PRIVATE).strip().lower()
    default_world = str(data.get("default_world") or "").strip().lower() or None
    if not title or not version:
        raise UniversePackError("title and pack_version are required.")
    if len(title) > 255:
        raise UniversePackError("Universe Pack title exceeds 255 characters.")
    _validate_semver(version)
    if visibility not in {Universe.VISIBILITY_PUBLIC, Universe.VISIBILITY_PRIVATE}:
        raise UniversePackError(f"Invalid Universe visibility: {visibility!r}")

    requires = data.get("requires") or {}
    if not isinstance(requires, dict):
        raise UniversePackError("requires must be a YAML object.")
    required_world_contract = str(requires.get("world_contract") or WORLD_PACK_CONTRACT)
    if required_world_contract != WORLD_PACK_CONTRACT:
        raise UniversePackError(
            f"requires.world_contract must be {WORLD_PACK_CONTRACT}, got {required_world_contract!r}."
        )
    host_contracts = requires.get("host_contracts") or []
    if not isinstance(host_contracts, list) or any(not isinstance(v, str) for v in host_contracts):
        raise UniversePackError("requires.host_contracts must be a list of strings.")

    raw_worlds = data.get("worlds") or []
    if not isinstance(raw_worlds, list) or not raw_worlds:
        raise UniversePackError("Universe Pack must declare at least one World.")
    worlds: list[dict[str, Any]] = []
    seen_worlds: set[str] = set()
    for idx, raw in enumerate(raw_worlds):
        if not isinstance(raw, dict):
            raise UniversePackError(f"worlds[{idx}] must be an object.")
        world_key = _slug(raw.get("world_key"), field=f"worlds[{idx}].world_key")
        if world_key in seen_worlds:
            raise UniversePackError(f"Duplicate world_key in Universe Pack: {world_key!r}")
        seen_worlds.add(world_key)
        seed_pack_key = _slug(raw.get("seed_pack_key") or world_key, field=f"worlds[{idx}].seed_pack_key")
        seed_version = str(raw.get("seed_version") or "").strip()
        if not seed_version:
            raise UniversePackError(f"worlds[{idx}].seed_version is required for reproducibility.")
        _validate_semver(seed_version)
        world_visibility = str(raw.get("visibility") or World.VISIBILITY_PRIVATE).strip().lower()
        if world_visibility not in {World.VISIBILITY_PUBLIC, World.VISIBILITY_PRIVATE}:
            raise UniversePackError(f"Invalid visibility for World {world_key!r}.")
        worlds.append({
            "world_key": world_key,
            "seed_pack_key": seed_pack_key,
            "seed_version": seed_version,
            "title": str(raw.get("title") or "").strip(),
            "description": str(raw.get("description") or ""),
            "visibility": world_visibility,
            "metadata": dict(raw.get("metadata") or {}),
        })
    if default_world is not None and default_world not in seen_worlds:
        raise UniversePackError("default_world must reference a declared World.")

    allowed_relation_types = {value for value, _label in WorldRelation.TYPE_CHOICES}
    relations: list[dict[str, Any]] = []
    relation_ids: set[tuple[str, str, str]] = set()
    for idx, raw in enumerate(data.get("relations") or []):
        if not isinstance(raw, dict):
            raise UniversePackError(f"relations[{idx}] must be an object.")
        source = _slug(raw.get("source"), field=f"relations[{idx}].source")
        target = _slug(raw.get("target"), field=f"relations[{idx}].target")
        kind = str(raw.get("type") or "").strip()
        if source not in seen_worlds or target not in seen_worlds or source == target:
            raise UniversePackError(f"Invalid relation endpoints at relations[{idx}].")
        if kind not in allowed_relation_types:
            raise UniversePackError(f"Invalid relation type {kind!r}.")
        identity = (source, target, kind)
        if identity in relation_ids:
            raise UniversePackError(f"Duplicate relation {identity!r}.")
        relation_ids.add(identity)
        relations.append({
            "source": source,
            "target": target,
            "type": kind,
            "title": str(raw.get("title") or ""),
            "description": str(raw.get("description") or ""),
            "metadata": dict(raw.get("metadata") or {}),
        })

    subscriptions: list[dict[str, Any]] = []
    subscription_ids: set[tuple[str, str, str]] = set()
    allowed_subscription_statuses = {value for value, _label in WorldSubscription.STATUS_CHOICES}
    for idx, raw in enumerate(data.get("subscriptions") or []):
        if not isinstance(raw, dict):
            raise UniversePackError(f"subscriptions[{idx}] must be an object.")
        consumer = _slug(raw.get("consumer"), field=f"subscriptions[{idx}].consumer")
        source = _slug(raw.get("source"), field=f"subscriptions[{idx}].source")
        publication_type = str(raw.get("publication_type") or "").strip()
        status = str(raw.get("status") or WorldSubscription.STATUS_ACTIVE).strip().lower()
        if consumer not in seen_worlds or source not in seen_worlds or consumer == source:
            raise UniversePackError(f"Invalid subscription endpoints at subscriptions[{idx}].")
        if not publication_type:
            raise UniversePackError(f"subscriptions[{idx}].publication_type is required.")
        if status not in allowed_subscription_statuses:
            raise UniversePackError(f"Invalid subscription status {status!r}.")
        identity = (consumer, source, publication_type)
        if identity in subscription_ids:
            raise UniversePackError(f"Duplicate subscription {identity!r}.")
        subscription_ids.add(identity)
        subscriptions.append({
            "consumer": consumer,
            "source": source,
            "publication_type": publication_type,
            "status": status,
            "metadata": dict(raw.get("metadata") or {}),
        })

    metadata = dict(data.get("metadata") or {})
    return UniversePack(
        root=manifest_path.parent,
        manifest_path=manifest_path,
        universe_key=universe_key,
        title=title,
        description=description,
        version=version,
        visibility=visibility,
        default_world=default_world,
        worlds=tuple(worlds),
        relations=tuple(relations),
        subscriptions=tuple(subscriptions),
        requires=requires,
        metadata=metadata,
        checksum=_sha256(manifest_path),
    )


def discover_universe_packs() -> list[UniversePack]:
    root = universe_seed_root()
    if not root.exists():
        return []
    packs = []
    identities: set[tuple[str, str]] = set()
    for candidate in sorted((*root.glob("*/universe.yaml"), *root.glob("*/universe.yml"))):
        pack = load_universe_pack(candidate, configured_root=root)
        identity = (pack.universe_key, pack.version)
        if identity in identities:
            raise UniversePackError(f"Duplicate Universe Pack identity: {identity!r}")
        identities.add(identity)
        packs.append(pack)
    return packs


def get_universe_pack(key: str, version: str | None = None) -> UniversePack:
    normalized = str(key or "").strip().lower()
    matches = [p for p in discover_universe_packs() if p.universe_key == normalized]
    if version is not None:
        matches = [p for p in matches if p.version == version]
    if not matches:
        raise UniversePackError(f"Universe Pack not found: {normalized}@{version or 'latest'}")
    # Universe packs require exact versions on referenced World packs; latest here
    # is only a convenience for choosing the composition manifest itself.
    return max(matches, key=lambda p: _semver_key(p.version))


def _managed_metadata(pack: UniversePack, metadata: dict[str, Any]) -> dict[str, Any]:
    return {
        **metadata,
        "_kx_universe_pack": {
            "contract": UNIVERSE_PACK_CONTRACT,
            "universe_key": pack.universe_key,
            "pack_version": pack.version,
            "checksum": pack.checksum,
        },
    }


def _emit(progress_callback, event: str, **payload) -> None:
    if progress_callback is not None:
        progress_callback({"event": event, **payload})


def _resolve_world_packs(
    pack: UniversePack,
    *,
    catalog: SeedPackCatalog | None = None,
) -> tuple[SeedPackCatalog, dict[str, tuple[Any, Any]]]:
    """Resolve every exact World Pack with one discovery/hash pass."""

    catalog = catalog or discover_seed_pack_catalog(persist=True)
    resolved: dict[str, tuple[Any, Any]] = {}
    for row in pack.worlds:
        seed_pack, record = get_seed_pack(
            row["seed_pack_key"],
            row["seed_version"],
            catalog=catalog,
        )
        resolved[row["world_key"]] = (seed_pack, record)
    return catalog, resolved


def _ensure_universe_worlds(
    *,
    pack: UniversePack,
    resolved: dict[str, tuple[Any, Any]],
    actor=None,
) -> tuple[Universe, dict[str, World]]:
    """Create/update the control-plane registry without exposing new content."""

    with transaction.atomic():
        universe, _created = Universe.objects.get_or_create(
            key=pack.universe_key,
            defaults={
                "title": pack.title,
                "description": pack.description,
                "visibility": Universe.VISIBILITY_PRIVATE,
                "created_by": actor,
            },
        )
        if universe.status == Universe.STATUS_ARCHIVED:
            raise UniversePackError("Archived Universes cannot be applied without explicit restoration.")
        universe.title = pack.title
        universe.description = pack.description
        # Fresh installs stay private until the complete composition is promoted.
        if not universe.worlds.filter(current_release__isnull=False).exists():
            universe.visibility = Universe.VISIBILITY_PRIVATE
        universe.status = Universe.STATUS_ACTIVE
        universe.metadata_json = _managed_metadata(pack, dict(pack.metadata))
        universe.full_clean()
        universe.save()

        worlds: dict[str, World] = {}
        for row in pack.worlds:
            seed_pack, _record = resolved[row["world_key"]]
            world, _ = World.objects.get_or_create(
                key=row["world_key"],
                defaults={
                    "universe": universe,
                    "title": row["title"] or seed_pack.title,
                    "description": row["description"],
                    "visibility": World.VISIBILITY_PRIVATE,
                    "created_by": actor,
                },
            )
            if world.universe_id != universe.id:
                raise UniversePackError(
                    f"World {world.key!r} belongs to Universe {world.universe.key!r}, "
                    f"not {universe.key!r}."
                )
            world.title = row["title"] or seed_pack.title
            world.description = row["description"] or str(seed_pack.metadata.get("description") or "")
            world.status = World.STATUS_ACTIVE
            # Preserve live visibility during upgrades; new Worlds remain private until promotion.
            if not world.current_release_id:
                world.visibility = World.VISIBILITY_PRIVATE
            world.full_clean()
            world.save()
            worlds[world.key] = world
    return universe, worlds


def _reconcile_topology_rows(*, pack: UniversePack, universe: Universe, worlds: dict[str, World]) -> None:
    """Idempotently reconcile pack-managed relations and subscriptions.

    Validation happens *after* the upsert so Django's uniqueness validation sees
    the persisted row's primary key and does not reject an existing relation as
    a duplicate of itself.  The surrounding Universe transaction rolls back the
    upsert if validation finds another invariant violation.
    """

    desired_relations = set()
    for row in pack.relations:
        relation, _created = WorldRelation.objects.update_or_create(
            source_world=worlds[row["source"]],
            target_world=worlds[row["target"]],
            relation_type=row["type"],
            defaults={
                "universe": universe,
                "title": row["title"],
                "description": row["description"],
                "metadata_json": _managed_metadata(pack, row["metadata"]),
            },
        )
        relation.full_clean()
        desired_relations.add((relation.source_world_id, relation.target_world_id, relation.relation_type))

    for relation in WorldRelation.objects.filter(universe=universe):
        marker = (relation.metadata_json or {}).get("_kx_universe_pack") or {}
        if marker.get("universe_key") != pack.universe_key:
            continue
        identity = (relation.source_world_id, relation.target_world_id, relation.relation_type)
        if identity not in desired_relations:
            relation.delete()

    desired_subscriptions = set()
    for row in pack.subscriptions:
        subscription, _created = WorldSubscription.objects.update_or_create(
            consumer_world=worlds[row["consumer"]],
            source_world=worlds[row["source"]],
            publication_type=row["publication_type"],
            defaults={
                "status": row["status"],
                "metadata_json": _managed_metadata(pack, row["metadata"]),
            },
        )
        subscription.full_clean()
        desired_subscriptions.add(
            (subscription.consumer_world_id, subscription.source_world_id, subscription.publication_type)
        )

    for subscription in WorldSubscription.objects.filter(consumer_world__universe=universe):
        marker = (subscription.metadata_json or {}).get("_kx_universe_pack") or {}
        if marker.get("universe_key") != pack.universe_key:
            continue
        identity = (subscription.consumer_world_id, subscription.source_world_id, subscription.publication_type)
        if identity not in desired_subscriptions:
            subscription.delete()


def _reconcile_topology(*, pack: UniversePack, universe: Universe, worlds: dict[str, World]) -> None:
    # Keep the upsert-before-full_clean sequence transactional even when this
    # helper is called directly by maintenance/tests rather than from the final
    # Universe promotion transaction.
    with transaction.atomic():
        _reconcile_topology_rows(pack=pack, universe=universe, worlds=worlds)


def _matching_ready_release(world: World, seed_pack) -> WorldRelease | None:
    return (
        world.releases.filter(
            seed_checksum=seed_pack.checksum,
            seed_version=seed_pack.version,
            status=WorldRelease.STATUS_READY,
        )
        .order_by("-release_number")
        .first()
    )


def _current_matches(world: World, seed_pack) -> bool:
    current = world.current_release
    return bool(
        current
        and current.seed_checksum == seed_pack.checksum
        and current.seed_version == seed_pack.version
    )


def _apply_promotions_and_topology(
    *,
    pack: UniversePack,
    universe: Universe,
    worlds: dict[str, World],
    promotion_targets: list[tuple[World, WorldRelease]],
    actor=None,
) -> list[dict[str, Any]]:
    promoted = []
    with transaction.atomic():
        for world, release in promotion_targets:
            target = promote_release(world=world, release=release, actor=actor)
            promoted.append({"world": world.key, "release": target.release_number})

        # Normalize declared World visibility only after every target Release is promotable.
        for row in pack.worlds:
            world = World.objects.select_for_update().get(pk=worlds[row["world_key"]].pk)
            if world.visibility != row["visibility"]:
                world.visibility = row["visibility"]
                world.save(update_fields=["visibility", "updated_at"])
            worlds[world.key] = world

        universe = Universe.objects.select_for_update().get(pk=universe.pk)
        _reconcile_topology(pack=pack, universe=universe, worlds=worlds)
        universe.default_world = worlds.get(pack.default_world) if pack.default_world else None
        universe.visibility = pack.visibility
        universe.metadata_json = _managed_metadata(pack, dict(pack.metadata))
        universe.full_clean()
        universe.save(update_fields=["default_world", "visibility", "metadata_json", "updated_at"])
    return promoted


def _apply_topology_without_promotion(
    *,
    pack: UniversePack,
    universe: Universe,
    worlds: dict[str, World],
) -> None:
    with transaction.atomic():
        universe = Universe.objects.select_for_update().get(pk=universe.pk)
        _reconcile_topology(pack=pack, universe=universe, worlds=worlds)
        # default_world is safe as a navigation preference even before promotion.
        universe.default_world = worlds.get(pack.default_world) if pack.default_world else None
        universe.metadata_json = _managed_metadata(pack, dict(pack.metadata))
        universe.full_clean()
        universe.save(update_fields=["default_world", "metadata_json", "updated_at"])


def apply_universe_pack(
    *,
    pack: UniversePack,
    actor=None,
    promote: bool = False,
    progress_callback=None,
    catalog: SeedPackCatalog | None = None,
) -> dict[str, Any]:
    """Synchronously apply one Universe Pack using a single Seed Pack catalog scan.

    This path remains useful for maintenance/debugging.  For multi-World normal
    operation, ``queue_universe_pack`` + ``finalize_universe_pack`` lets the
    existing WorldBuildJob/Celery concurrency controls perform the expensive
    builds in parallel while preserving atomic final promotion.
    """

    _emit(progress_callback, "catalog", message="Discovering and hashing Seed Packs once")
    catalog, resolved = _resolve_world_packs(pack, catalog=catalog)
    _emit(progress_callback, "catalog_ready", pack_count=len(catalog.packs))
    universe, worlds = _ensure_universe_worlds(pack=pack, resolved=resolved, actor=actor)

    builds = []
    promotion_targets: list[tuple[World, WorldRelease]] = []
    total = len(pack.worlds)
    for index, row in enumerate(pack.worlds, start=1):
        world = worlds[row["world_key"]]
        seed_pack, seed_record = resolved[world.key]
        if _current_matches(world, seed_pack):
            current = world.current_release
            builds.append({"world": world.key, "action": "already_current", "release": current.release_number})
            _emit(
                progress_callback,
                "world_done",
                world=world.key,
                index=index,
                total=total,
                action="already_current",
                release=current.release_number,
            )
            continue

        ready = _matching_ready_release(world, seed_pack)
        if ready is None:
            _emit(
                progress_callback,
                "world_start",
                world=world.key,
                index=index,
                total=total,
                seed=f"{seed_pack.world_key}@{seed_pack.version}",
            )

            def on_release_progress(release, *, _world=world, _index=index):
                progress = dict((release.build_metadata_json or {}).get("progress") or {})
                _emit(
                    progress_callback,
                    "world_progress",
                    world=_world.key,
                    index=_index,
                    total=total,
                    release=release.release_number,
                    status=release.status,
                    progress=progress,
                )

            ready = build_world_release(
                world=world,
                seed_pack_key=seed_pack.world_key,
                seed_version=seed_pack.version,
                actor=actor,
                promote=False,
                progress_callback=on_release_progress,
                resolved_pack=seed_pack,
                seed_record=seed_record,
            )
            builds.append({"world": world.key, "action": "built", "release": ready.release_number})
        else:
            builds.append({"world": world.key, "action": "reuse_ready", "release": ready.release_number})
        promotion_targets.append((world, ready))
        _emit(
            progress_callback,
            "world_done",
            world=world.key,
            index=index,
            total=total,
            action=builds[-1]["action"],
            release=ready.release_number,
        )

    promoted = []
    if promote:
        _emit(progress_callback, "promoting", count=len(promotion_targets))
        promoted = _apply_promotions_and_topology(
            pack=pack,
            universe=universe,
            worlds=worlds,
            promotion_targets=promotion_targets,
            actor=actor,
        )
        _emit(progress_callback, "promoted", count=len(promoted))
    else:
        _apply_topology_without_promotion(pack=pack, universe=universe, worlds=worlds)

    return {
        "ok": True,
        "contract": UNIVERSE_PACK_CONTRACT,
        "universe": pack.universe_key,
        "pack_version": pack.version,
        "checksum": pack.checksum,
        "required_host_contracts": list(pack.requires.get("host_contracts") or []),
        "builds": builds,
        "promoted": promoted,
    }


def queue_universe_pack(
    *,
    pack: UniversePack,
    actor=None,
    progress_callback=None,
    catalog: SeedPackCatalog | None = None,
    dispatch: bool = True,
) -> dict[str, Any]:
    """Queue only missing World builds; never promote Worlds individually.

    Final Universe promotion is intentionally separate so a composition becomes
    visible atomically only after all exact target releases are READY/CURRENT.
    Re-running this function is idempotent: CURRENT, READY and active exact jobs
    are reused.
    """

    _emit(progress_callback, "catalog", message="Discovering and hashing Seed Packs once")
    catalog, resolved = _resolve_world_packs(pack, catalog=catalog)
    _emit(progress_callback, "catalog_ready", pack_count=len(catalog.packs))
    universe, worlds = _ensure_universe_worlds(pack=pack, resolved=resolved, actor=actor)

    builds: list[dict[str, Any]] = []
    job_ids: list[int] = []
    total = len(pack.worlds)
    for index, row in enumerate(pack.worlds, start=1):
        world = worlds[row["world_key"]]
        seed_pack, _seed_record = resolved[world.key]
        if _current_matches(world, seed_pack):
            current = world.current_release
            builds.append({"world": world.key, "action": "already_current", "release": current.release_number})
            continue

        ready = _matching_ready_release(world, seed_pack)
        if ready is not None:
            builds.append({"world": world.key, "action": "reuse_ready", "release": ready.release_number})
            continue

        active = None
        for candidate in world.build_jobs.filter(
            status__in=(
                WorldBuildJob.STATUS_QUEUED,
                WorldBuildJob.STATUS_BUILDING,
                WorldBuildJob.STATUS_VALIDATING,
            ),
            seed_pack_key=seed_pack.world_key,
            seed_version=seed_pack.version,
        ).order_by("-created_at"):
            checksum = str((candidate.metadata_json or {}).get("seed_checksum") or "")
            if not checksum or checksum == seed_pack.checksum:
                active = candidate
                break

        if active is not None:
            job_ids.append(active.id)
            builds.append({"world": world.key, "action": "reuse_job", "job": active.id})
            continue

        job = WorldBuildJob.objects.create(
            world=world,
            requested_by=actor,
            seed_pack_key=seed_pack.world_key,
            seed_version=seed_pack.version,
            # Universe promotion is atomic; never promote per-World here.
            promote_after_build=False,
            metadata_json={
                "architecture_lock": "KX-UNIVERSES-1",
                "source": "worlds_apply_universe",
                "universe_key": pack.universe_key,
                "universe_pack_version": pack.version,
                "universe_pack_checksum": pack.checksum,
                "seed_checksum": seed_pack.checksum,
                "scenario_count": len(seed_pack.scenario_paths),
                "progress": {
                    "stage": "queued",
                    "step": 0,
                    "steps_total": 5,
                    "percent": 0,
                    "message": "Queued for World build worker",
                },
            },
        )
        if dispatch:
            try:
                enqueue_world_build_job(job)
            except Exception as exc:
                job.status = WorldBuildJob.STATUS_FAILED
                job.error_text = str(exc)
                job.save(update_fields=["status", "error_text", "updated_at"])
                raise UniversePackError(f"Could not enqueue World {world.key}: {exc}") from exc
            action = "queued"
        else:
            job.queue_name = "local-world-build"
            job.save(update_fields=["queue_name", "updated_at"])
            action = "queued_local"
        job_ids.append(job.id)
        builds.append({"world": world.key, "action": action, "job": job.id})
        _emit(
            progress_callback,
            "world_queued",
            world=world.key,
            index=index,
            total=total,
            job=job.id,
        )

    return {
        "ok": True,
        "contract": UNIVERSE_PACK_CONTRACT,
        "universe": pack.universe_key,
        "pack_version": pack.version,
        "checksum": pack.checksum,
        "required_host_contracts": list(pack.requires.get("host_contracts") or []),
        "builds": builds,
        "job_ids": job_ids,
    }


def universe_pack_status(*, pack: UniversePack, catalog: SeedPackCatalog | None = None) -> dict[str, Any]:
    """Return exact-target status for every World in one Universe Pack."""

    _catalog, resolved = _resolve_world_packs(pack, catalog=catalog)
    rows = []
    ready_count = current_count = failed_count = active_count = 0
    for row in pack.worlds:
        try:
            world = World.objects.select_related("current_release").get(key=row["world_key"])
        except World.DoesNotExist:
            rows.append({"world": row["world_key"], "state": "missing"})
            continue
        seed_pack, _record = resolved[world.key]
        if _current_matches(world, seed_pack):
            current_count += 1
            rows.append(
                {
                    "world": world.key,
                    "state": "current",
                    "release": world.current_release.release_number,
                    "progress": {"stage": "current", "percent": 100},
                }
            )
            continue
        ready = _matching_ready_release(world, seed_pack)
        if ready is not None:
            ready_count += 1
            rows.append(
                {
                    "world": world.key,
                    "state": "ready",
                    "release": ready.release_number,
                    "progress": dict((ready.build_metadata_json or {}).get("progress") or {}),
                }
            )
            continue
        job = world.build_jobs.filter(
            seed_pack_key=seed_pack.world_key,
            seed_version=seed_pack.version,
        ).order_by("-created_at").first()
        if job is None:
            rows.append({"world": world.key, "state": "pending"})
            continue
        if job.status == WorldBuildJob.STATUS_FAILED:
            failed_count += 1
        elif job.status not in WorldBuildJob.TERMINAL_STATUSES:
            active_count += 1
        rows.append(
            {
                "world": world.key,
                "state": job.status,
                "job": job.id,
                "release": job.release.release_number if job.release_id else None,
                "progress": dict((job.metadata_json or {}).get("progress") or {}),
                "error": job.error_text,
                "updated_at": job.updated_at,
            }
        )
    return {
        "ok": failed_count == 0,
        "universe": pack.universe_key,
        "pack_version": pack.version,
        "total": len(pack.worlds),
        "current": current_count,
        "ready": ready_count,
        "active": active_count,
        "failed": failed_count,
        "worlds": rows,
    }


def finalize_universe_pack(
    *,
    pack: UniversePack,
    actor=None,
    promote: bool = True,
    progress_callback=None,
    catalog: SeedPackCatalog | None = None,
) -> dict[str, Any]:
    """Finalize topology and optionally atomically promote exact READY targets."""

    _catalog, resolved = _resolve_world_packs(pack, catalog=catalog)
    universe, worlds = _ensure_universe_worlds(pack=pack, resolved=resolved, actor=actor)
    promotion_targets: list[tuple[World, WorldRelease]] = []
    builds: list[dict[str, Any]] = []
    not_ready: list[str] = []

    for row in pack.worlds:
        world = worlds[row["world_key"]]
        seed_pack, _record = resolved[world.key]
        if _current_matches(world, seed_pack):
            builds.append(
                {
                    "world": world.key,
                    "action": "already_current",
                    "release": world.current_release.release_number,
                }
            )
            continue
        ready = _matching_ready_release(world, seed_pack)
        if ready is None:
            not_ready.append(world.key)
            continue
        promotion_targets.append((world, ready))
        builds.append({"world": world.key, "action": "reuse_ready", "release": ready.release_number})

    if not_ready:
        raise UniversePackError(
            "Universe Pack cannot be finalized; exact target Releases are not ready for: "
            + ", ".join(sorted(not_ready))
        )

    promoted = []
    if promote:
        _emit(progress_callback, "promoting", count=len(promotion_targets))
        promoted = _apply_promotions_and_topology(
            pack=pack,
            universe=universe,
            worlds=worlds,
            promotion_targets=promotion_targets,
            actor=actor,
        )
        _emit(progress_callback, "promoted", count=len(promoted))
    else:
        _apply_topology_without_promotion(pack=pack, universe=universe, worlds=worlds)

    return {
        "ok": True,
        "contract": UNIVERSE_PACK_CONTRACT,
        "universe": pack.universe_key,
        "pack_version": pack.version,
        "checksum": pack.checksum,
        "builds": builds,
        "promoted": promoted,
    }
