from __future__ import annotations

from django.conf import settings
from django.core.cache import cache
from django.db import connection
from django.db.models import Count, Q

from ..models import World, WorldBuildJob, WorldRelease
from .schema import validate_release_schemas


def world_liveness() -> dict:
    """Constant-cost process liveness; deliberately does not touch the catalog."""
    return {
        "architecture_lock": "KX-WORLDS-1",
        "kind": "liveness",
        "ok": True,
    }


def world_readiness() -> dict:
    """Bounded readiness check for the control plane and PostgreSQL dependency."""
    result = {
        "architecture_lock": "KX-WORLDS-1",
        "kind": "readiness",
        "database_vendor": connection.vendor,
        "strict_routing": bool(getattr(settings, "KONNAXION_WORLDS_STRICT_ROUTING", False)),
        "ok": True,
        "errors": [],
    }
    if connection.vendor != "postgresql":
        result["ok"] = False
        result["errors"].append(
            "Konnaxion Worlds requires PostgreSQL schema/search_path support."
        )
        return result

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            row = cursor.fetchone()
        if not row or row[0] != 1:
            raise RuntimeError("PostgreSQL readiness probe returned an unexpected result.")
    except Exception as exc:
        result["ok"] = False
        result["errors"].append(f"database: {exc}")

    # Probe whichever cache backend this standalone deployment configured.
    # Local development defaults to LocMem; production may opt into Redis.
    try:
        probe_key = "konnaxion:worlds:readiness"
        cache.set(probe_key, "ok", timeout=5)
        if cache.get(probe_key) != "ok":
            raise RuntimeError("cache probe did not round-trip")
    except Exception as exc:
        result["ok"] = False
        result["errors"].append(f"cache: {exc}")
    return result


def world_registry_health() -> dict:
    """Cheap catalog/control-plane health without opening or validating schemas."""
    result = {
        "architecture_lock": "KX-WORLDS-1",
        "kind": "registry",
        "ok": True,
        "errors": [],
        "counts": {},
    }
    if connection.vendor != "postgresql":
        result["ok"] = False
        result["errors"].append(
            "Konnaxion Worlds requires PostgreSQL schema/search_path support."
        )
        return result

    world_counts = World.objects.aggregate(
        total=Count("id"),
        active=Count("id", filter=Q(status=World.STATUS_ACTIVE)),
        maintenance=Count("id", filter=Q(status=World.STATUS_MAINTENANCE)),
        archived=Count("id", filter=Q(status=World.STATUS_ARCHIVED)),
        without_current=Count("id", filter=Q(current_release__isnull=True)),
    )
    job_counts = WorldBuildJob.objects.aggregate(
        queued=Count("id", filter=Q(status=WorldBuildJob.STATUS_QUEUED)),
        building=Count("id", filter=Q(status=WorldBuildJob.STATUS_BUILDING)),
        validating=Count("id", filter=Q(status=WorldBuildJob.STATUS_VALIDATING)),
        failed=Count("id", filter=Q(status=WorldBuildJob.STATUS_FAILED)),
    )
    result["counts"] = {"worlds": world_counts, "build_jobs": job_counts}

    broken = []
    for world in World.objects.select_related("current_release").only(
        "id", "key", "status", "current_release_id", "current_release__id",
        "current_release__world_id", "current_release__status",
    ):
        release = world.current_release
        if release is None:
            if world.status == World.STATUS_ACTIVE:
                broken.append({"world_key": world.key, "reason": "active_without_current_release"})
            continue
        if release.world_id != world.id:
            broken.append({"world_key": world.key, "release_id": release.id, "reason": "cross_world_pointer"})
        elif release.status != WorldRelease.STATUS_CURRENT:
            broken.append({
                "world_key": world.key,
                "release_id": release.id,
                "reason": f"current_pointer_status_{release.status}",
            })

    if broken:
        result["ok"] = False
        result["errors"].extend(broken)
    return result


def world_system_health() -> dict:
    """Deep on-demand validation of every current WorldRelease.

    This is intentionally separate from liveness/readiness because schema
    canaries and migration fingerprint validation scale with the World catalog.
    """
    result = {
        "architecture_lock": "KX-WORLDS-1",
        "kind": "deep",
        "database_vendor": connection.vendor,
        "strict_routing": bool(getattr(settings, "KONNAXION_WORLDS_STRICT_ROUTING", False)),
        "worlds": [],
        "ok": True,
    }
    if connection.vendor != "postgresql":
        result["ok"] = False
        result["errors"] = ["Konnaxion Worlds requires PostgreSQL schema/search_path support."]
        return result

    for world in World.objects.select_related("current_release").order_by("key"):
        row = {
            "key": world.key,
            "status": world.status,
            "current_release_id": world.current_release_id,
        }
        if world.current_release_id:
            row["release"] = validate_release_schemas(world.current_release)
            if not row["release"].get("ok"):
                result["ok"] = False
        elif world.status == World.STATUS_ACTIVE:
            row["release"] = {"ok": False, "reason": "active_without_current_release"}
            result["ok"] = False
        result["worlds"].append(row)
    return result
