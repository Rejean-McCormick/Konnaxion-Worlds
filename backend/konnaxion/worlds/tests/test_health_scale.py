from __future__ import annotations

import pytest
from django.db import connection

from konnaxion.worlds.models import World
from konnaxion.worlds.services.health import world_liveness, world_readiness, world_registry_health

pytestmark = pytest.mark.django_db


def test_liveness_is_constant_cost_with_large_catalog(monkeypatch):
    World.objects.bulk_create(
        [World(key=f"live-{index:03d}", title=f"Live {index:03d}") for index in range(120)]
    )

    def explode(*args, **kwargs):
        raise AssertionError("liveness must not touch the World registry")

    monkeypatch.setattr(World.objects, "all", explode, raising=False)
    report = world_liveness()
    assert report == {"architecture_lock": "KX-WORLDS-1", "kind": "liveness", "ok": True}


def test_readiness_does_not_require_deep_world_validation():
    report = world_readiness()
    if connection.vendor == "postgresql":
        assert report["ok"] is True
    else:
        assert report["ok"] is False
        assert "PostgreSQL" in " ".join(report["errors"])


def test_registry_health_reports_catalog_counts_without_schema_validation():
    if connection.vendor != "postgresql":
        pytest.skip("World registry production health requires PostgreSQL.")
    World.objects.bulk_create(
        [World(key=f"registry-{index:03d}", title=f"Registry {index:03d}") for index in range(120)]
    )
    report = world_registry_health()
    assert report["counts"]["worlds"]["total"] >= 120
