from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase

from konnaxion.worlds.models import (
    Universe,
    UniverseMembership,
    World,
    WorldPublication,
    WorldRelation,
    WorldRelease,
    WorldSubscription,
)
from konnaxion.worlds.resolver import can_access_world, resolve_world_runtime

User = get_user_model()


class UniverseInvariantTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username="universe-owner")
        self.outsider = User.objects.create_user(username="universe-outsider")
        self.alpha = Universe.objects.create(
            key="alpha-universe", title="Alpha Universe", visibility=Universe.VISIBILITY_PUBLIC,
            created_by=self.owner,
        )
        self.beta = Universe.objects.create(
            key="beta-universe", title="Beta Universe", visibility=Universe.VISIBILITY_PRIVATE,
            created_by=self.owner,
        )
        UniverseMembership.objects.create(
            universe=self.alpha, user=self.owner, role=UniverseMembership.ROLE_OWNER
        )
        self.engineering = World.objects.create(
            universe=self.alpha, key="engineering", title="Engineering",
            visibility=World.VISIBILITY_PUBLIC, created_by=self.owner,
        )
        self.finance = World.objects.create(
            universe=self.alpha, key="finance", title="Finance",
            visibility=World.VISIBILITY_PUBLIC, created_by=self.owner,
        )
        self.private_world = World.objects.create(
            universe=self.beta, key="private-world", title="Private World",
            visibility=World.VISIBILITY_PUBLIC, created_by=self.owner,
        )
        self.release = WorldRelease.objects.create(
            world=self.engineering,
            release_number=1,
            status=WorldRelease.STATUS_CURRENT,
            domain_schema="kx_w_engineering_r1",
            ekoh_schema="kx_e_engineering_r1",
        )
        self.engineering.current_release = self.release
        self.engineering.save(update_fields=["current_release", "updated_at"])

    def test_runtime_resolves_universe_world_release_tuple(self):
        runtime = resolve_world_runtime(
            universe_key=self.alpha.key,
            world_key=self.engineering.key,
            user=self.outsider,
        )
        self.assertEqual(runtime.universe_id, self.alpha.id)
        self.assertEqual(runtime.universe_key, self.alpha.key)
        self.assertEqual(runtime.world_id, self.engineering.id)
        self.assertEqual(runtime.release_id, self.release.id)

    def test_private_universe_blocks_public_world(self):
        self.assertFalse(can_access_world(self.outsider, self.private_world))

    def test_relation_cannot_cross_universes(self):
        relation = WorldRelation(
            universe=self.alpha,
            source_world=self.engineering,
            target_world=self.private_world,
            relation_type=WorldRelation.TYPE_DEPENDS_ON,
        )
        with self.assertRaises(ValidationError):
            relation.full_clean()

    def test_subscription_cannot_cross_universes(self):
        subscription = WorldSubscription(
            consumer_world=self.finance,
            source_world=self.private_world,
            publication_type="forecast",
        )
        with self.assertRaises(ValidationError):
            subscription.full_clean()

    def test_publication_release_must_belong_to_source_world(self):
        publication = WorldPublication(
            source_world=self.finance,
            source_release=self.release,
            publication_type="forecast",
            key="production-forecast",
            version=1,
            title="Production forecast",
        )
        with self.assertRaises(ValidationError):
            publication.full_clean()

    def test_default_world_must_belong_to_universe(self):
        self.beta.default_world = self.engineering
        with self.assertRaises(ValidationError):
            self.beta.full_clean()
