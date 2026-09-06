# FILE: backend/konnaxion/ethikos/tests/test_kintsugi_korum_api.py
from __future__ import annotations

from http import HTTPStatus
from typing import Any

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from konnaxion.ethikos.constants import (
    ARGUMENT_IMPACT_VOTE_MAX,
    ARGUMENT_IMPACT_VOTE_MIN,
    ARGUMENT_SIDE_CON,
    ARGUMENT_SIDE_PRO,
    ARGUMENT_SUGGESTION_ACCEPTED,
    ARGUMENT_SUGGESTION_PENDING,
    ARGUMENT_SUGGESTION_REJECTED,
    ARGUMENT_SUGGESTION_REVISION_REQUESTED,
    AUTHOR_VISIBILITY_ADMINS_ONLY,
    AUTHOR_VISIBILITY_ALL,
    DISCUSSION_PARTICIPATION_ANONYMOUS,
    DISCUSSION_PARTICIPATION_STANDARD,
    DISCUSSION_ROLE_ADMIN,
    DISCUSSION_ROLE_VIEWER,
    VOTE_VISIBILITY_ADMINS_ONLY,
    VOTE_VISIBILITY_ALL,
)
from konnaxion.ethikos.models import (
    ArgumentImpactVote,
    ArgumentSource,
    ArgumentSuggestion,
    DiscussionParticipantRole,
    DiscussionVisibilitySetting,
    EthikosArgument,
    EthikosCategory,
    EthikosStance,
    EthikosTopic,
)


User = get_user_model()


class EthikosKintsugiKorumAPITests(APITestCase):
    """
    API tests for Kintsugi Wave 1 / Korum.

    Korum first-pass scope:
    - source links/citations on arguments;
    - claim-level impact votes separated from topic-level stances;
    - role-aware suggested claims;
    - discussion participant roles;
    - author/vote visibility settings.

    These endpoints must stay under /api/ethikos/*.
    They must not create /api/kialo/*, /api/kintsugi/*, or /api/korum/*.
    """

    maxDiff = None

    def setUp(self) -> None:
        self.user = User.objects.create_user(
            username="korum-user",
            email="korum-user@example.com",
            password="testpass123",
        )
        self.other_user = User.objects.create_user(
            username="korum-other",
            email="korum-other@example.com",
            password="testpass123",
        )
        self.staff_user = User.objects.create_user(
            username="korum-staff",
            email="korum-staff@example.com",
            password="testpass123",
            is_staff=True,
        )

        self.category = EthikosCategory.objects.create(
            name="Public ethics",
            description="Ethical public decision-making.",
        )
        self.topic = EthikosTopic.objects.create(
            title="Should public datasets require consent receipts?",
            description="A Korum deliberation topic for API tests.",
            category=self.category,
            created_by=self.user,
        )
        self.argument = EthikosArgument.objects.create(
            topic=self.topic,
            user=self.user,
            content="Consent receipts improve public accountability.",
            side=ARGUMENT_SIDE_PRO,
        )
        self.reply = EthikosArgument.objects.create(
            topic=self.topic,
            user=self.other_user,
            content="They may also increase administrative burden.",
            parent=self.argument,
            side=ARGUMENT_SIDE_CON,
        )

        self.argument_sources_url = "/api/ethikos/argument-sources/"
        self.argument_impact_votes_url = "/api/ethikos/argument-impact-votes/"
        self.argument_suggestions_url = "/api/ethikos/argument-suggestions/"
        self.participant_roles_url = "/api/ethikos/discussion-participant-roles/"
        self.visibility_settings_url = "/api/ethikos/discussion-visibility-settings/"

    # ------------------------------------------------------------------ #
    # Helpers
    # ------------------------------------------------------------------ #

    def _as_user(self) -> None:
        self.client.force_authenticate(self.user)

    def _as_other_user(self) -> None:
        self.client.force_authenticate(self.other_user)

    def _as_staff(self) -> None:
        self.client.force_authenticate(self.staff_user)

    def _results(self, payload: Any) -> list[dict[str, Any]]:
        if isinstance(payload, list):
            return payload

        if isinstance(payload, dict):
            results = payload.get("results")
            if isinstance(results, list):
                return results

        self.fail(f"Expected list or paginated response, got: {payload!r}")

    def _detail_url(self, list_url: str, pk: int | str) -> str:
        return f"{list_url}{pk}/"

    # ------------------------------------------------------------------ #
    # Route availability
    # ------------------------------------------------------------------ #

    def test_korum_routes_are_registered_under_ethikos(self) -> None:
        self._as_user()

        endpoints = [
            self.argument_sources_url,
            self.argument_impact_votes_url,
            self.argument_suggestions_url,
            self.participant_roles_url,
            self.visibility_settings_url,
        ]

        for endpoint in endpoints:
            with self.subTest(endpoint=endpoint):
                response = self.client.get(endpoint)
                self.assertNotEqual(response.status_code, HTTPStatus.NOT_FOUND)
                self.assertNotEqual(response.status_code, HTTPStatus.METHOD_NOT_ALLOWED)

    def test_forbidden_korum_parallel_routes_are_not_available(self) -> None:
        self._as_user()

        forbidden_endpoints = [
            "/api/kialo/argument-sources/",
            "/api/kintsugi/argument-sources/",
            "/api/korum/argument-sources/",
            "/api/deliberation/argument-sources/",
            "/api/ethikos/kialo/argument-sources/",
            "/api/ethikos/kintsugi/argument-sources/",
            "/api/ethikos/korum/argument-sources/",
            "/api/ethikos/deliberation/argument-sources/",
        ]

        for endpoint in forbidden_endpoints:
            with self.subTest(endpoint=endpoint):
                response = self.client.get(endpoint)
                self.assertEqual(response.status_code, HTTPStatus.NOT_FOUND)

    # ------------------------------------------------------------------ #
    # Argument sources
    # ------------------------------------------------------------------ #

    def test_create_argument_source(self) -> None:
        self._as_user()

        payload = {
            "argument": self.argument.id,
            "url": "https://example.org/consent-receipts",
            "title": "Consent receipts reference",
            "excerpt": "Consent receipts can support auditability.",
            "source_type": "article",
        }

        response = self.client.post(
            self.argument_sources_url,
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, HTTPStatus.CREATED)
        self.assertEqual(response.data["argument"], self.argument.id)
        self.assertEqual(response.data["url"], payload["url"])
        self.assertEqual(response.data["title"], payload["title"])

        source = ArgumentSource.objects.get(pk=response.data["id"])
        self.assertEqual(source.argument, self.argument)
        self.assertEqual(source.created_by, self.user)

    def test_create_argument_source_can_use_citation_without_url(self) -> None:
        self._as_user()

        response = self.client.post(
            self.argument_sources_url,
            {
                "argument": self.argument.id,
                "citation_text": "Public-sector consent receipt guidance.",
                "note": "Used as a non-URL citation.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, HTTPStatus.CREATED)
        self.assertEqual(response.data["argument"], self.argument.id)
        self.assertEqual(
            response.data["citation_text"],
            "Public-sector consent receipt guidance.",
        )

    def test_list_argument_sources_can_filter_by_argument(self) -> None:
        self._as_user()

        source = ArgumentSource.objects.create(
            argument=self.argument,
            url="https://example.org/source-a",
            title="Source A",
            excerpt="A useful source.",
            source_type="article",
            created_by=self.user,
        )
        ArgumentSource.objects.create(
            argument=self.reply,
            url="https://example.org/source-b",
            title="Source B",
            excerpt="Another source.",
            source_type="article",
            created_by=self.other_user,
        )

        response = self.client.get(
            self.argument_sources_url,
            {"argument": self.argument.id},
        )

        self.assertEqual(response.status_code, HTTPStatus.OK)
        ids = {row["id"] for row in self._results(response.data)}
        self.assertEqual(ids, {source.id})

    def test_argument_source_requires_source_material(self) -> None:
        self._as_user()

        response = self.client.post(
            self.argument_sources_url,
            {
                "argument": self.argument.id,
                "url": "",
                "title": "Missing source material",
            },
            format="json",
        )

        self.assertEqual(response.status_code, HTTPStatus.BAD_REQUEST)
        self.assertIn("non_field_errors", response.data)

    # ------------------------------------------------------------------ #
    # Argument impact votes
    # ------------------------------------------------------------------ #

    def test_create_argument_impact_vote(self) -> None:
        self._as_user()

        response = self.client.post(
            self.argument_impact_votes_url,
            {
                "argument": self.argument.id,
                "value": ARGUMENT_IMPACT_VOTE_MAX,
            },
            format="json",
        )

        self.assertEqual(response.status_code, HTTPStatus.CREATED)
        self.assertEqual(response.data["argument"], self.argument.id)
        self.assertEqual(response.data["value"], ARGUMENT_IMPACT_VOTE_MAX)

        vote = ArgumentImpactVote.objects.get(pk=response.data["id"])
        self.assertEqual(vote.argument, self.argument)
        self.assertEqual(vote.user, self.user)
        self.assertEqual(vote.value, ARGUMENT_IMPACT_VOTE_MAX)

    def test_argument_impact_vote_upserts_for_same_user_and_argument(self) -> None:
        self._as_user()

        first = self.client.post(
            self.argument_impact_votes_url,
            {
                "argument": self.argument.id,
                "value": 1,
            },
            format="json",
        )
        second = self.client.post(
            self.argument_impact_votes_url,
            {
                "argument": self.argument.id,
                "value": 4,
            },
            format="json",
        )

        self.assertEqual(first.status_code, HTTPStatus.CREATED)
        self.assertEqual(second.status_code, HTTPStatus.OK)
        self.assertEqual(ArgumentImpactVote.objects.count(), 1)

        vote = ArgumentImpactVote.objects.get(argument=self.argument, user=self.user)
        self.assertEqual(vote.value, 4)

    def test_argument_impact_vote_allows_minimum_and_maximum_values(self) -> None:
        self._as_user()

        for value in (ARGUMENT_IMPACT_VOTE_MIN, ARGUMENT_IMPACT_VOTE_MAX):
            with self.subTest(value=value):
                argument = EthikosArgument.objects.create(
                    topic=self.topic,
                    user=self.user,
                    content=f"Argument for impact value {value}.",
                    side=ARGUMENT_SIDE_PRO,
                )

                response = self.client.post(
                    self.argument_impact_votes_url,
                    {
                        "argument": argument.id,
                        "value": value,
                    },
                    format="json",
                )

                self.assertEqual(response.status_code, HTTPStatus.CREATED)
                self.assertEqual(response.data["value"], value)

    def test_argument_impact_vote_rejects_out_of_range_values(self) -> None:
        self._as_user()

        for value in (ARGUMENT_IMPACT_VOTE_MIN - 1, ARGUMENT_IMPACT_VOTE_MAX + 1):
            with self.subTest(value=value):
                response = self.client.post(
                    self.argument_impact_votes_url,
                    {
                        "argument": self.argument.id,
                        "value": value,
                    },
                    format="json",
                )

                self.assertEqual(response.status_code, HTTPStatus.BAD_REQUEST)
                self.assertIn("value", response.data)

    def test_argument_impact_vote_does_not_create_topic_stance(self) -> None:
        self._as_user()

        before = EthikosStance.objects.count()

        response = self.client.post(
            self.argument_impact_votes_url,
            {
                "argument": self.argument.id,
                "value": 4,
            },
            format="json",
        )

        self.assertEqual(response.status_code, HTTPStatus.CREATED)
        self.assertEqual(ArgumentImpactVote.objects.count(), 1)
        self.assertEqual(EthikosStance.objects.count(), before)

    def test_list_argument_impact_votes_can_filter_by_argument(self) -> None:
        self._as_user()

        vote = ArgumentImpactVote.objects.create(
            argument=self.argument,
            user=self.user,
            value=3,
        )
        ArgumentImpactVote.objects.create(
            argument=self.reply,
            user=self.other_user,
            value=2,
        )

        response = self.client.get(
            self.argument_impact_votes_url,
            {"argument": self.argument.id},
        )

        self.assertEqual(response.status_code, HTTPStatus.OK)
        ids = {row["id"] for row in self._results(response.data)}
        self.assertEqual(ids, {vote.id})

    # ------------------------------------------------------------------ #
    # Argument suggestions
    # ------------------------------------------------------------------ #

    def test_create_argument_suggestion_defaults_to_pending(self) -> None:
        self._as_user()

        payload = {
            "topic": self.topic.id,
            "parent": self.argument.id,
            "side": ARGUMENT_SIDE_CON,
            "content": "A clearer counter-claim should mention administrative cost.",
        }

        response = self.client.post(
            self.argument_suggestions_url,
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, HTTPStatus.CREATED)
        self.assertEqual(response.data["topic"], self.topic.id)
        self.assertEqual(response.data["parent"], self.argument.id)
        self.assertEqual(response.data["side"], ARGUMENT_SIDE_CON)
        self.assertEqual(response.data["status"], ARGUMENT_SUGGESTION_PENDING)

        suggestion = ArgumentSuggestion.objects.get(pk=response.data["id"])
        self.assertEqual(suggestion.created_by, self.user)
        self.assertEqual(suggestion.status, ARGUMENT_SUGGESTION_PENDING)

    def test_staff_can_accept_argument_suggestion_action(self) -> None:
        suggestion = ArgumentSuggestion.objects.create(
            topic=self.topic,
            parent=self.argument,
            side=ARGUMENT_SIDE_CON,
            content="Suggested counter-claim.",
            status=ARGUMENT_SUGGESTION_PENDING,
            created_by=self.user,
        )

        self._as_staff()

        response = self.client.post(
            f"{self._detail_url(self.argument_suggestions_url, suggestion.id)}accept/",
            {},
            format="json",
        )

        self.assertEqual(response.status_code, HTTPStatus.OK)
        self.assertEqual(response.data["status"], ARGUMENT_SUGGESTION_ACCEPTED)
        self.assertIsNotNone(response.data["accepted_argument"])

        suggestion.refresh_from_db()
        self.assertEqual(suggestion.status, ARGUMENT_SUGGESTION_ACCEPTED)
        self.assertEqual(suggestion.reviewed_by, self.staff_user)
        self.assertIsNotNone(suggestion.reviewed_at)
        self.assertIsNotNone(suggestion.accepted_argument)

        accepted = suggestion.accepted_argument
        self.assertEqual(accepted.topic, self.topic)
        self.assertEqual(accepted.content, suggestion.content)
        self.assertEqual(accepted.parent, self.argument)
        self.assertEqual(accepted.side, ARGUMENT_SIDE_CON)

    def test_staff_can_reject_argument_suggestion_action(self) -> None:
        suggestion = ArgumentSuggestion.objects.create(
            topic=self.topic,
            parent=self.argument,
            side=ARGUMENT_SIDE_CON,
            content="Suggested counter-claim.",
            status=ARGUMENT_SUGGESTION_PENDING,
            created_by=self.user,
        )

        self._as_staff()

        response = self.client.post(
            f"{self._detail_url(self.argument_suggestions_url, suggestion.id)}reject/",
            {},
            format="json",
        )

        self.assertEqual(response.status_code, HTTPStatus.OK)
        self.assertEqual(response.data["status"], ARGUMENT_SUGGESTION_REJECTED)

        suggestion.refresh_from_db()
        self.assertEqual(suggestion.status, ARGUMENT_SUGGESTION_REJECTED)
        self.assertEqual(suggestion.reviewed_by, self.staff_user)
        self.assertIsNotNone(suggestion.reviewed_at)

    def test_staff_can_request_revision_for_argument_suggestion_action(self) -> None:
        suggestion = ArgumentSuggestion.objects.create(
            topic=self.topic,
            parent=self.argument,
            side=ARGUMENT_SIDE_CON,
            content="Suggested counter-claim.",
            status=ARGUMENT_SUGGESTION_PENDING,
            created_by=self.user,
        )

        self._as_staff()

        response = self.client.post(
            (
                f"{self._detail_url(self.argument_suggestions_url, suggestion.id)}"
                "request-revision/"
            ),
            {},
            format="json",
        )

        self.assertEqual(response.status_code, HTTPStatus.OK)
        self.assertEqual(
            response.data["status"],
            ARGUMENT_SUGGESTION_REVISION_REQUESTED,
        )

        suggestion.refresh_from_db()
        self.assertEqual(suggestion.status, ARGUMENT_SUGGESTION_REVISION_REQUESTED)
        self.assertEqual(suggestion.reviewed_by, self.staff_user)
        self.assertIsNotNone(suggestion.reviewed_at)

    def test_argument_suggestion_rejects_empty_content(self) -> None:
        self._as_user()

        response = self.client.post(
            self.argument_suggestions_url,
            {
                "topic": self.topic.id,
                "content": "",
                "side": ARGUMENT_SIDE_PRO,
            },
            format="json",
        )

        self.assertEqual(response.status_code, HTTPStatus.BAD_REQUEST)
        self.assertIn("content", response.data)

    def test_argument_suggestion_rejects_cross_topic_parent(self) -> None:
        other_topic = EthikosTopic.objects.create(
            title="Cross-topic parent topic",
            description="Used to verify parent/topic validation.",
            category=self.category,
            created_by=self.other_user,
        )
        other_argument = EthikosArgument.objects.create(
            topic=other_topic,
            user=self.other_user,
            content="Argument from another topic.",
            side=ARGUMENT_SIDE_PRO,
        )

        self._as_user()

        response = self.client.post(
            self.argument_suggestions_url,
            {
                "topic": self.topic.id,
                "parent": other_argument.id,
                "content": "This should fail because parent is in another topic.",
                "side": ARGUMENT_SIDE_CON,
            },
            format="json",
        )

        self.assertEqual(response.status_code, HTTPStatus.BAD_REQUEST)
        self.assertIn("parent_id", response.data)

    def test_list_argument_suggestions_can_filter_by_topic(self) -> None:
        self._as_user()

        suggestion = ArgumentSuggestion.objects.create(
            topic=self.topic,
            parent=self.argument,
            side=ARGUMENT_SIDE_CON,
            content="Suggestion for this topic.",
            status=ARGUMENT_SUGGESTION_PENDING,
            created_by=self.user,
        )

        other_topic = EthikosTopic.objects.create(
            title="Another topic",
            description="Not part of this filtered list.",
            category=self.category,
            created_by=self.other_user,
        )
        ArgumentSuggestion.objects.create(
            topic=other_topic,
            side=ARGUMENT_SIDE_PRO,
            content="Suggestion for another topic.",
            status=ARGUMENT_SUGGESTION_PENDING,
            created_by=self.other_user,
        )

        response = self.client.get(
            self.argument_suggestions_url,
            {"topic": self.topic.id},
        )

        self.assertEqual(response.status_code, HTTPStatus.OK)
        ids = {row["id"] for row in self._results(response.data)}
        self.assertEqual(ids, {suggestion.id})

    # ------------------------------------------------------------------ #
    # Discussion participant roles
    # ------------------------------------------------------------------ #

    def test_staff_can_assign_discussion_participant_role(self) -> None:
        self._as_staff()

        response = self.client.post(
            self.participant_roles_url,
            {
                "topic": self.topic.id,
                "target_user_id": self.other_user.id,
                "role": DISCUSSION_ROLE_VIEWER,
            },
            format="json",
        )

        self.assertEqual(response.status_code, HTTPStatus.CREATED)
        self.assertEqual(response.data["topic"], self.topic.id)
        self.assertEqual(response.data["user_id"], self.other_user.id)
        self.assertEqual(response.data["role"], DISCUSSION_ROLE_VIEWER)

        role = DiscussionParticipantRole.objects.get(pk=response.data["id"])
        self.assertEqual(role.topic, self.topic)
        self.assertEqual(role.user, self.other_user)
        self.assertEqual(role.role, DISCUSSION_ROLE_VIEWER)
        self.assertEqual(role.assigned_by, self.staff_user)

    def test_discussion_participant_role_upserts_for_same_topic_and_user(self) -> None:
        self._as_staff()

        first = self.client.post(
            self.participant_roles_url,
            {
                "topic": self.topic.id,
                "target_user_id": self.other_user.id,
                "role": DISCUSSION_ROLE_VIEWER,
            },
            format="json",
        )
        second = self.client.post(
            self.participant_roles_url,
            {
                "topic": self.topic.id,
                "target_user_id": self.other_user.id,
                "role": DISCUSSION_ROLE_ADMIN,
            },
            format="json",
        )

        self.assertEqual(first.status_code, HTTPStatus.CREATED)
        self.assertEqual(second.status_code, HTTPStatus.OK)
        self.assertEqual(DiscussionParticipantRole.objects.count(), 1)

        role = DiscussionParticipantRole.objects.get(
            topic=self.topic,
            user=self.other_user,
        )
        self.assertEqual(role.role, DISCUSSION_ROLE_ADMIN)
        self.assertEqual(role.assigned_by, self.staff_user)

    def test_discussion_participant_role_rejects_unknown_role(self) -> None:
        self._as_staff()

        response = self.client.post(
            self.participant_roles_url,
            {
                "topic": self.topic.id,
                "target_user_id": self.other_user.id,
                "role": "moderator",
            },
            format="json",
        )

        self.assertEqual(response.status_code, HTTPStatus.BAD_REQUEST)
        self.assertIn("role", response.data)

    def test_list_discussion_participant_roles_can_filter_by_topic(self) -> None:
        self._as_staff()

        role = DiscussionParticipantRole.objects.create(
            topic=self.topic,
            user=self.other_user,
            role=DISCUSSION_ROLE_VIEWER,
        )

        other_topic = EthikosTopic.objects.create(
            title="Separate participant role topic",
            description="Used to verify topic filtering.",
            category=self.category,
            created_by=self.staff_user,
        )
        DiscussionParticipantRole.objects.create(
            topic=other_topic,
            user=self.user,
            role=DISCUSSION_ROLE_ADMIN,
        )

        response = self.client.get(
            self.participant_roles_url,
            {"topic": self.topic.id},
        )

        self.assertEqual(response.status_code, HTTPStatus.OK)
        ids = {row["id"] for row in self._results(response.data)}
        self.assertEqual(ids, {role.id})

    # ------------------------------------------------------------------ #
    # Discussion visibility settings
    # ------------------------------------------------------------------ #

    def test_staff_can_create_discussion_visibility_setting(self) -> None:
        self._as_staff()

        response = self.client.post(
            self.visibility_settings_url,
            {
                "topic": self.topic.id,
                "participation_type": DISCUSSION_PARTICIPATION_STANDARD,
                "author_visibility": AUTHOR_VISIBILITY_ALL,
                "vote_visibility": VOTE_VISIBILITY_ALL,
            },
            format="json",
        )

        self.assertEqual(response.status_code, HTTPStatus.CREATED)
        self.assertEqual(response.data["topic"], self.topic.id)
        self.assertEqual(
            response.data["participation_type"],
            DISCUSSION_PARTICIPATION_STANDARD,
        )
        self.assertEqual(response.data["author_visibility"], AUTHOR_VISIBILITY_ALL)
        self.assertEqual(response.data["vote_visibility"], VOTE_VISIBILITY_ALL)

        setting = DiscussionVisibilitySetting.objects.get(pk=response.data["id"])
        self.assertEqual(setting.topic, self.topic)
        self.assertEqual(setting.changed_by, self.staff_user)
        self.assertEqual(
            setting.participation_type,
            DISCUSSION_PARTICIPATION_STANDARD,
        )

    def test_staff_can_update_discussion_visibility_setting(self) -> None:
        setting = DiscussionVisibilitySetting.objects.create(
            topic=self.topic,
            participation_type=DISCUSSION_PARTICIPATION_STANDARD,
            author_visibility=AUTHOR_VISIBILITY_ALL,
            vote_visibility=VOTE_VISIBILITY_ALL,
        )

        self._as_staff()

        response = self.client.patch(
            self._detail_url(self.visibility_settings_url, setting.id),
            {
                "participation_type": DISCUSSION_PARTICIPATION_ANONYMOUS,
                "author_visibility": AUTHOR_VISIBILITY_ADMINS_ONLY,
                "vote_visibility": VOTE_VISIBILITY_ADMINS_ONLY,
            },
            format="json",
        )

        self.assertEqual(response.status_code, HTTPStatus.OK)
        self.assertEqual(
            response.data["participation_type"],
            DISCUSSION_PARTICIPATION_ANONYMOUS,
        )
        self.assertEqual(
            response.data["author_visibility"],
            AUTHOR_VISIBILITY_ADMINS_ONLY,
        )
        self.assertEqual(
            response.data["vote_visibility"],
            VOTE_VISIBILITY_ADMINS_ONLY,
        )

        setting.refresh_from_db()
        self.assertEqual(
            setting.participation_type,
            DISCUSSION_PARTICIPATION_ANONYMOUS,
        )
        self.assertEqual(setting.author_visibility, AUTHOR_VISIBILITY_ADMINS_ONLY)
        self.assertEqual(setting.vote_visibility, VOTE_VISIBILITY_ADMINS_ONLY)
        self.assertEqual(setting.changed_by, self.staff_user)

    def test_discussion_visibility_setting_upserts_for_same_topic(self) -> None:
        self._as_staff()

        first = self.client.post(
            self.visibility_settings_url,
            {
                "topic": self.topic.id,
                "participation_type": DISCUSSION_PARTICIPATION_STANDARD,
                "author_visibility": AUTHOR_VISIBILITY_ALL,
                "vote_visibility": VOTE_VISIBILITY_ALL,
            },
            format="json",
        )
        second = self.client.post(
            self.visibility_settings_url,
            {
                "topic": self.topic.id,
                "participation_type": DISCUSSION_PARTICIPATION_ANONYMOUS,
                "author_visibility": AUTHOR_VISIBILITY_ADMINS_ONLY,
                "vote_visibility": VOTE_VISIBILITY_ADMINS_ONLY,
            },
            format="json",
        )

        self.assertEqual(first.status_code, HTTPStatus.CREATED)
        self.assertEqual(second.status_code, HTTPStatus.OK)
        self.assertEqual(DiscussionVisibilitySetting.objects.count(), 1)

        setting = DiscussionVisibilitySetting.objects.get(topic=self.topic)
        self.assertEqual(setting.participation_type, DISCUSSION_PARTICIPATION_ANONYMOUS)
        self.assertEqual(setting.author_visibility, AUTHOR_VISIBILITY_ADMINS_ONLY)
        self.assertEqual(setting.vote_visibility, VOTE_VISIBILITY_ADMINS_ONLY)
        self.assertEqual(setting.changed_by, self.staff_user)

    def test_discussion_visibility_setting_rejects_unknown_values(self) -> None:
        self._as_staff()

        response = self.client.post(
            self.visibility_settings_url,
            {
                "topic": self.topic.id,
                "participation_type": "private",
                "author_visibility": "everyone_except_author",
                "vote_visibility": "public_after_close",
            },
            format="json",
        )

        self.assertEqual(response.status_code, HTTPStatus.BAD_REQUEST)
        self.assertIn("participation_type", response.data)
        self.assertIn("author_visibility", response.data)
        self.assertIn("vote_visibility", response.data)

    def test_list_discussion_visibility_settings_can_filter_by_topic(self) -> None:
        self._as_staff()

        setting = DiscussionVisibilitySetting.objects.create(
            topic=self.topic,
            participation_type=DISCUSSION_PARTICIPATION_STANDARD,
            author_visibility=AUTHOR_VISIBILITY_ALL,
            vote_visibility=VOTE_VISIBILITY_ALL,
        )

        other_topic = EthikosTopic.objects.create(
            title="Separate visibility topic",
            description="Used to verify topic filtering.",
            category=self.category,
            created_by=self.staff_user,
        )
        DiscussionVisibilitySetting.objects.create(
            topic=other_topic,
            participation_type=DISCUSSION_PARTICIPATION_ANONYMOUS,
            author_visibility=AUTHOR_VISIBILITY_ADMINS_ONLY,
            vote_visibility=VOTE_VISIBILITY_ADMINS_ONLY,
        )

        response = self.client.get(
            self.visibility_settings_url,
            {"topic": self.topic.id},
        )

        self.assertEqual(response.status_code, HTTPStatus.OK)
        ids = {row["id"] for row in self._results(response.data)}
        self.assertEqual(ids, {setting.id})