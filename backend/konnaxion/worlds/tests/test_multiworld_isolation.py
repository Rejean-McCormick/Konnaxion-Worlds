from __future__ import annotations

from decimal import Decimal
from uuid import uuid4

import pytest
from django.contrib.auth import get_user_model
from django.db import connection

from konnaxion.ekoh.models.scores import UserEthicsScore, UserExpertiseScore
from konnaxion.ethikos.models import EthikosArgument, EthikosStance, EthikosTopic
from konnaxion.worlds.db import world_db_scope
from konnaxion.worlds.models import World, WorldPersonaBridge
from konnaxion.worlds.resolver import runtime_from_release
from konnaxion.worlds.services.builder import (
    build_world_release,
    promote_release,
    purge_release,
)
from konnaxion.worlds.services.schema import drop_schema

pytestmark = pytest.mark.django_db(transaction=True)


def _require_postgres():
    if connection.vendor != "postgresql":
        pytest.skip("Konnaxion Worlds isolation requires PostgreSQL schemas/search_path.")


def _read_state(release):
    runtime = runtime_from_release(release)
    with world_db_scope(runtime):
        topic = EthikosTopic.objects.get(title="[DEMO] Shared Topic")
        argument = EthikosArgument.objects.get(topic=topic)
        stance = EthikosStance.objects.get(topic=topic)
        expertise = UserExpertiseScore.objects.get(user_id=stance.user_id, category__code="0312")
        ethics = UserEthicsScore.objects.get(user_id=stance.user_id)
        return {
            "topic_id": topic.pk,
            "topic_description": topic.description,
            "argument_id": argument.pk,
            "argument": argument.content,
            "side": argument.side,
            "stance": stance.value,
            "bridge_user_id": stance.user_id,
            "expertise": expertise.weighted_score,
            "ethics": ethics.ethical_score,
        }


def _cleanup_release(release):
    # Test cleanup must work even if a failure prevented normal control-plane purge.
    try:
        world = World.objects.get(pk=release.world_id)
        if world.current_release_id == release.id:
            world.current_release = None
            world.save(update_fields=["current_release", "updated_at"])
            release.status = release.STATUS_FROZEN
            release.save(update_fields=["status"])
        purge_release(release=release)
    except Exception:
        drop_schema(release.ekoh_schema)
        drop_schema(release.domain_schema)


def test_alpha_beta_alpha_collision_isolation_end_to_end():
    _require_postgres()
    User = get_user_model()
    suffix = uuid4().hex[:8]
    owner = User.objects.create_user(username=f"world-owner-{suffix}")
    alpha = World.objects.create(key=f"alpha-{suffix}", title="Alpha", created_by=owner)
    beta = World.objects.create(key=f"beta-{suffix}", title="Beta", created_by=owner)
    releases = []
    try:
        alpha_release = build_world_release(
            world=alpha, seed_pack_key="demo-alpha", actor=owner
        )
        promote_release(world=alpha, release=alpha_release, actor=owner)
        releases.append(alpha_release)

        beta_release = build_world_release(
            world=beta, seed_pack_key="demo-beta", actor=owner
        )
        promote_release(world=beta, release=beta_release, actor=owner)
        releases.append(beta_release)

        state_a1 = _read_state(alpha_release)
        state_b = _read_state(beta_release)
        state_a2 = _read_state(alpha_release)

        # Same natural/display identities can coexist with different state.
        assert state_a1["topic_description"] == "Alpha World topic"
        assert state_b["topic_description"] == "Beta World topic"
        assert state_a1["argument"] == "Alpha-specific argument."
        assert state_b["argument"] == "Beta-specific argument."
        assert state_a1["side"] == "pro"
        assert state_b["side"] == "con"
        assert state_a1["stance"] == 3
        assert state_b["stance"] == -2
        assert state_a1["expertise"] == Decimal("0.9100")
        assert state_b["expertise"] == Decimal("0.3700")
        assert state_a1["ethics"] == Decimal("1.400")
        assert state_b["ethics"] == Decimal("0.800")

        # Release bridge auth identities are physically different even though the
        # source actor username is deliberately identical in both Seed Packs.
        assert state_a1["bridge_user_id"] != state_b["bridge_user_id"]
        alpha_bridge = WorldPersonaBridge.objects.get(release=alpha_release)
        beta_bridge = WorldPersonaBridge.objects.get(release=beta_release)
        assert alpha_bridge.metadata_json["requested_username"] == "demo_shared"
        assert beta_bridge.metadata_json["requested_username"] == "demo_shared"
        assert alpha_bridge.bridge_user.username != beta_bridge.bridge_user.username

        # Returning A -> B -> A must be a pure context switch: no mutation/drift.
        assert state_a2 == state_a1
    finally:
        for release in reversed(releases):
            _cleanup_release(release)
