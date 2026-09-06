from __future__ import annotations

from django.conf import settings
from django.db import connection

from ..models import World, WorldRelease
from .schema import validate_release_schemas


def world_system_health() -> dict:
    result = {
        "architecture_lock": "KX-WORLDS-1",
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
        result["worlds"].append(row)
    return result
