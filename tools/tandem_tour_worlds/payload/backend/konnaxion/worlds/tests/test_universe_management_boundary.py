from __future__ import annotations

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from konnaxion.worlds.api_views import WorldDetailView, WorldMembershipCollectionView
from konnaxion.worlds.models import Universe, UniverseMembership, World, WorldMembership
from konnaxion.worlds.resolver import can_access_world, can_manage_world


class UniverseWorldManagementBoundaryTests(TestCase):
    """The outer Universe permission must govern World control routes."""

    def setUp(self):
        User = get_user_model()
        self.owner = User.objects.create_user(username="tour-kw-universe-owner")
        self.manager = User.objects.create_user(username="tour-kw-world-manager")
        self.target = User.objects.create_user(username="tour-kw-target")
        self.universe = Universe.objects.create(
            key="tour-kw-private", title="Private Universe",
            visibility=Universe.VISIBILITY_PRIVATE, created_by=self.owner,
        )
        self.world = World.objects.create(
            universe=self.universe, key="tour-kw-world", title="World",
            visibility=World.VISIBILITY_PRIVATE, created_by=self.owner,
        )
        self.outer = UniverseMembership.objects.create(
            universe=self.universe, user=self.manager,
            role=UniverseMembership.ROLE_MEMBER, is_active=True,
        )
        self.inner = WorldMembership.objects.create(
            world=self.world, user=self.manager,
            role=WorldMembership.ROLE_MAINTAINER, is_active=True,
        )

    def test_world_maintainer_can_manage_while_universe_membership_active(self):
        self.assertTrue(can_manage_world(self.manager, self.world))

    def test_universe_membership_revocation_blocks_world_management(self):
        self.outer.is_active = False
        self.outer.save(update_fields=["is_active"])
        self.assertFalse(can_access_world(self.manager, self.world))
        self.assertFalse(can_manage_world(self.manager, self.world))

    def test_world_direct_creator_does_not_override_private_universe_boundary(self):
        self.world.created_by = self.manager
        self.world.save(update_fields=["created_by", "updated_at"])
        self.outer.is_active = False
        self.outer.save(update_fields=["is_active"])
        self.assertFalse(can_manage_world(self.manager, self.world))

    def test_revoke_universe_access_blocks_world_patch_api(self):
        self.outer.is_active = False
        self.outer.save(update_fields=["is_active"])
        request = APIRequestFactory().patch("/api/control/worlds/tour-kw-world/", {"title": "Changed"}, format="json")
        force_authenticate(request, user=self.manager)
        response = WorldDetailView.as_view()(request, world_key=self.world.key)
        self.assertEqual(response.status_code, 403)
        self.world.refresh_from_db()
        self.assertEqual(self.world.title, "World")

    def test_revoke_universe_access_blocks_membership_mutation(self):
        self.outer.is_active = False
        self.outer.save(update_fields=["is_active"])
        request = APIRequestFactory().post(
            "/api/control/worlds/tour-kw-world/memberships/",
            {"user_id": self.target.pk, "role": WorldMembership.ROLE_VIEWER}, format="json",
        )
        force_authenticate(request, user=self.manager)
        response = WorldMembershipCollectionView.as_view()(request, world_key=self.world.key)
        self.assertEqual(response.status_code, 403)
        self.assertFalse(WorldMembership.objects.filter(world=self.world, user=self.target).exists())

    def test_universe_creator_can_still_manage_own_world(self):
        self.assertTrue(can_manage_world(self.owner, self.world))
