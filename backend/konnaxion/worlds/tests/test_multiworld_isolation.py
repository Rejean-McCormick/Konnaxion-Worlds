from __future__ import annotations

from uuid import uuid4

import pytest
from django.contrib.auth import get_user_model
from django.db import connection

from konnaxion.worlds.models import World
from konnaxion.worlds.services.builder import build_world_release, promote_release, purge_release
from konnaxion.worlds.services.schema import read_canary

pytestmark = pytest.mark.django_db(transaction=True)


def _require_postgres():
    if connection.vendor != "postgresql":
        pytest.skip("Konnaxion Worlds isolation requires PostgreSQL schemas.")


def test_alpha_beta_release_isolation_end_to_end():
    _require_postgres()
    User = get_user_model()
    suffix = uuid4().hex[:8]
    owner = User.objects.create_user(username=f"world-owner-{suffix}")
    alpha = World.objects.create(key=f"alpha-{suffix}", title="Alpha", created_by=owner)
    beta = World.objects.create(key=f"beta-{suffix}", title="Beta", created_by=owner)
    releases = []
    try:
        alpha_release = build_world_release(world=alpha, seed_pack_key="demo-alpha", actor=owner)
        beta_release = build_world_release(world=beta, seed_pack_key="demo-beta", actor=owner)
        releases.extend([alpha_release, beta_release])

        promote_release(world=alpha, release=alpha_release, actor=owner)
        promote_release(world=beta, release=beta_release, actor=owner)

        alpha.refresh_from_db()
        beta.refresh_from_db()
        assert alpha.current_release_id == alpha_release.id
        assert beta.current_release_id == beta_release.id
        assert alpha_release.domain_schema != beta_release.domain_schema
        assert alpha_release.ekoh_schema != beta_release.ekoh_schema

        alpha_domain = read_canary(alpha_release.domain_schema)
        beta_domain = read_canary(beta_release.domain_schema)
        assert alpha_domain and alpha_domain["world_id"] == alpha.id
        assert beta_domain and beta_domain["world_id"] == beta.id
        assert alpha_domain["release_id"] != beta_domain["release_id"]
    finally:
        for release in reversed(releases):
            try:
                world = World.objects.get(pk=release.world_id)
                if world.current_release_id == release.id:
                    world.current_release = None
                    world.save(update_fields=["current_release", "updated_at"])
                    release.status = release.STATUS_FROZEN
                    release.save(update_fields=["status"])
                purge_release(release=release)
            except Exception:
                pass
