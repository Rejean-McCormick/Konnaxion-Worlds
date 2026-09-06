# FILE: backend/konnaxion/ethikos/tests.py
from __future__ import annotations

from http import HTTPStatus

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.test import APITestCase

from config.api_router import router
from konnaxion.ethikos.constants import (
    ARGUMENT_SIDE_CON,
    ARGUMENT_SIDE_PRO,
    CURRENT_ETHIKOS_CORE_MODELS,
    ETHIKOS_ARGUMENTS_PATH,
    ETHIKOS_CATEGORIES_PATH,
    ETHIKOS_STANCES_PATH,
    ETHIKOS_TOPICS_PATH,
    FORBIDDEN_KINTSUGI_API_SEGMENTS,
    STANCE_MAX,
    STANCE_MIN,
)
from konnaxion.ethikos.models import (
    EthikosArgument,
    EthikosCategory,
    EthikosStance,
    EthikosTopic,
)


class EthikosKintsugiFoundationTests(APITestCase):
    """
    Foundation tests for ethiKos Kintsugi Wave 1.

    These tests protect the common baseline before vertical slices add
    Kintsugi behavior.

    Guarded baseline:
    - existing model names remain stable;
    - canonical /api/ethikos/* endpoints remain registered;
    - forbidden Kintsugi drift prefixes are not registered;
    - stance values remain topic-level -3..+3 values;
    - arguments remain threaded EthikosArgument records;
    - topic preview returns real topic metadata instead of an empty shell.
    """

    @classmethod
    def setUpTestData(cls):
        User = get_user_model()

        cls.user = User.objects.create_user(
            username="ethikos-wave1-user",
            email="ethikos-wave1-user@example.com",
            password="test-password",
        )

        cls.other_user = User.objects.create_user(
            username="ethikos-wave1-other",
            email="ethikos-wave1-other@example.com",
            password="test-password",
        )

        cls.category = EthikosCategory.objects.create(
            name="Kintsugi Foundation",
            description="Baseline category for ethiKos Kintsugi foundation tests.",
        )

        cls.topic = EthikosTopic.objects.create(
            title="Should ethiKos preserve its canonical model names?",
            description=(
                "A foundation topic used to verify Kintsugi Wave 1 no-drift "
                "behavior."
            ),
            category=cls.category,
            created_by=cls.user,
        )

    @staticmethod
    def _registered_prefixes() -> set[str]:
        return {prefix.strip("/") for prefix, _viewset, _basename in router.registry}

    def test_current_core_models_remain_stable(self):
        actual = {
            EthikosCategory.__name__,
            EthikosTopic.__name__,
            EthikosStance.__name__,
            EthikosArgument.__name__,
        }

        self.assertEqual(actual, set(CURRENT_ETHIKOS_CORE_MODELS))

    def test_canonical_ethikos_routes_are_registered(self):
        prefixes = self._registered_prefixes()

        self.assertIn(ETHIKOS_TOPICS_PATH.strip("/"), prefixes)
        self.assertIn(ETHIKOS_STANCES_PATH.strip("/"), prefixes)
        self.assertIn(ETHIKOS_ARGUMENTS_PATH.strip("/"), prefixes)
        self.assertIn(ETHIKOS_CATEGORIES_PATH.strip("/"), prefixes)

    def test_forbidden_kintsugi_route_segments_are_not_registered(self):
        """
        Forbid both top-level drift and nested drift.

        Invalid examples:
        - kintsugi
        - kialo
        - korum
        - deliberation
        - home
        - ethikos/kintsugi
        - ethikos/kialo
        - ethikos/korum
        - ethikos/deliberation
        """

        for prefix in self._registered_prefixes():
            segments = {segment for segment in prefix.split("/") if segment}

            for forbidden_segment in FORBIDDEN_KINTSUGI_API_SEGMENTS:
                self.assertNotIn(
                    forbidden_segment,
                    segments,
                    msg=(
                        f"Forbidden Kintsugi API segment {forbidden_segment!r} "
                        f"found in registered router prefix {prefix!r}."
                    ),
                )

    def test_stance_value_accepts_boundary_values(self):
        low = EthikosStance(
            user=self.user,
            topic=self.topic,
            value=STANCE_MIN,
        )
        high = EthikosStance(
            user=self.other_user,
            topic=self.topic,
            value=STANCE_MAX,
        )

        low.full_clean()
        high.full_clean()

    def test_stance_value_rejects_values_outside_topic_level_range(self):
        below = EthikosStance(
            user=self.user,
            topic=self.topic,
            value=STANCE_MIN - 1,
        )
        above = EthikosStance(
            user=self.other_user,
            topic=self.topic,
            value=STANCE_MAX + 1,
        )

        with self.assertRaises(DjangoValidationError):
            below.full_clean()

        with self.assertRaises(DjangoValidationError):
            above.full_clean()

    def test_stance_is_unique_per_user_and_topic(self):
        EthikosStance.objects.create(
            user=self.user,
            topic=self.topic,
            value=0,
        )

        duplicate = EthikosStance(
            user=self.user,
            topic=self.topic,
            value=1,
        )

        with self.assertRaises(DjangoValidationError):
            duplicate.full_clean()

    def test_argument_remains_threaded_ethikos_argument(self):
        parent = EthikosArgument.objects.create(
            topic=self.topic,
            user=self.user,
            content="Parent argument",
            side=ARGUMENT_SIDE_PRO,
        )

        child = EthikosArgument.objects.create(
            topic=self.topic,
            user=self.other_user,
            content="Child argument",
            parent=parent,
            side=ARGUMENT_SIDE_CON,
        )

        self.assertEqual(parent.__class__.__name__, "EthikosArgument")
        self.assertEqual(child.parent_id, parent.id)
        self.assertEqual(parent.replies.count(), 1)

    def test_authenticated_user_can_create_argument(self):
        self.client.force_authenticate(self.user)

        response = self.client.post(
            "/api/ethikos/arguments/",
            {
                "topic": self.topic.id,
                "content": "A foundation argument should stay under ethiKos.",
                "side": ARGUMENT_SIDE_PRO,
            },
            format="json",
        )

        self.assertEqual(response.status_code, HTTPStatus.CREATED)

        argument = EthikosArgument.objects.get(id=response.data["id"])
        self.assertEqual(argument.user_id, self.user.id)
        self.assertEqual(argument.topic_id, self.topic.id)
        self.assertEqual(argument.side, ARGUMENT_SIDE_PRO)
        self.assertIsNone(argument.parent_id)

    def test_argument_reply_must_share_parent_topic(self):
        self.client.force_authenticate(self.user)

        parent = EthikosArgument.objects.create(
            topic=self.topic,
            user=self.user,
            content="Parent argument",
            side=ARGUMENT_SIDE_PRO,
        )

        same_topic_response = self.client.post(
            "/api/ethikos/arguments/",
            {
                "topic": self.topic.id,
                "content": "Reply in the same topic",
                "parent_id": parent.id,
                "side": ARGUMENT_SIDE_CON,
            },
            format="json",
        )

        self.assertEqual(same_topic_response.status_code, HTTPStatus.CREATED)

        other_topic = EthikosTopic.objects.create(
            title="Different topic",
            description="Used to test cross-topic parent rejection.",
            category=self.category,
            created_by=self.other_user,
        )

        cross_topic_response = self.client.post(
            "/api/ethikos/arguments/",
            {
                "topic": other_topic.id,
                "content": "Invalid reply across topic boundaries",
                "parent_id": parent.id,
                "side": ARGUMENT_SIDE_CON,
            },
            format="json",
        )

        self.assertEqual(cross_topic_response.status_code, HTTPStatus.BAD_REQUEST)
        self.assertIn("parent_id", cross_topic_response.data)

    def test_topic_preview_returns_topic_metadata_not_empty_shell(self):
        EthikosArgument.objects.create(
            topic=self.topic,
            user=self.user,
            content="Preview should have at least one latest statement.",
            side=ARGUMENT_SIDE_PRO,
        )

        response = self.client.get(f"/api/ethikos/topics/{self.topic.id}/preview/")

        self.assertEqual(response.status_code, HTTPStatus.OK)
        self.assertEqual(str(response.data.get("id")), str(self.topic.id))
        self.assertEqual(response.data.get("title"), self.topic.title)
        self.assertTrue(response.data.get("description"))

    def test_topic_preview_is_public_readable(self):
        response = self.client.get(f"/api/ethikos/topics/{self.topic.id}/preview/")

        self.assertEqual(response.status_code, HTTPStatus.OK)
        self.assertEqual(str(response.data.get("id")), str(self.topic.id))

    def test_unauthenticated_user_cannot_create_argument(self):
        response = self.client.post(
            "/api/ethikos/arguments/",
            {
                "topic": self.topic.id,
                "content": "Unauthenticated write should fail.",
                "side": ARGUMENT_SIDE_PRO,
            },
            format="json",
        )

        self.assertIn(
            response.status_code,
            {
                HTTPStatus.UNAUTHORIZED,
                HTTPStatus.FORBIDDEN,
            },
        )