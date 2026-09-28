from __future__ import annotations

from ..models import Universe

LEGACY_UNIVERSE_KEY = "legacy"


def get_or_create_legacy_universe() -> Universe:
    """Temporary U1 adapter for old tooling that creates Worlds without a Universe.

    Runtime resolution never calls this helper. New APIs and product surfaces must
    name an Universe explicitly. Remove this adapter after legacy /w/<world> and
    unscoped seed/build tooling have been retired.
    """
    universe, _ = Universe.objects.get_or_create(
        key=LEGACY_UNIVERSE_KEY,
        defaults={
            "title": "Legacy Worlds",
            "description": "Compatibility container for pre-Universe tooling.",
            "visibility": Universe.VISIBILITY_PRIVATE,
            "metadata_json": {
                "architecture_lock": "KX-UNIVERSES-1",
                "migration_adapter": True,
                "remove_after": "legacy-world-route-retirement",
            },
        },
    )
    return universe


def get_or_create_universe_for_tooling(key: str | None) -> Universe:
    normalized = str(key or "").strip().lower()
    if not normalized:
        return get_or_create_legacy_universe()
    universe, _ = Universe.objects.get_or_create(
        key=normalized,
        defaults={"title": normalized.replace("-", " ").title()},
    )
    return universe
