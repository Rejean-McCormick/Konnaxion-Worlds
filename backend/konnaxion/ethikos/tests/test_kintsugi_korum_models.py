# FILE: backend/konnaxion/ethikos/tests/test_kintsugi_korum_models.py
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.utils import timezone

from konnaxion.ethikos.constants import (
    ARGUMENT_SIDE_CON,
    ARGUMENT_SIDE_NEUTRAL,
    ARGUMENT_SIDE_PRO,
    ARGUMENT_SUGGESTION_ACCEPTED,
    ARGUMENT_SUGGESTION_PENDING,
    AUTHOR_VISIBILITY_ALL,
    DISCUSSION_PARTICIPATION_STANDARD,
    DISCUSSION_ROLE_ADMIN,
    DISCUSSION_ROLE_VIEWER,
    STANCE_MAX,
    STANCE_MIN,
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


UserModel = get_user_model()


def make_user(username: str):
    """
    Create a test user while tolerating either username-based or email-based
    custom user models.
    """
    username_field = UserModel.USERNAME_FIELD

    payload: dict[str, str] = {
        username_field: (
            f"{username}@example.com" if username_field == "email" else username
        )
    }

    for field_name in getattr(UserModel, "REQUIRED_FIELDS", []):
        if field_name in payload:
            continue

        if field_name == "email":
            payload[field_name] = f"{username}@example.com"
        else:
            payload[field_name] = f"{username}_{field_name}"

    if hasattr(UserModel, "email") and "email" not in payload:
        payload["email"] = f"{username}@example.com"

    return UserModel.objects.create_user(password="test-pass-123", **payload)


class KintsugiKorumModelTests(TestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        cls.user = make_user("korum_user")
        cls.other_user = make_user("korum_other")
        cls.reviewer = make_user("korum_reviewer")

        cls.category = EthikosCategory.objects.create(
            name="Governance",
            description="Governance and deliberation topics.",
        )
        cls.topic = EthikosTopic.objects.create(
            title="Should the cooperative adopt a rotating facilitation model?",
            description="A Korum deliberation topic for testing.",
            category=cls.category,
            created_by=cls.user,
        )
        cls.other_topic = EthikosTopic.objects.create(
            title="Should the cooperative publish quarterly impact reports?",
            description="A second topic for topic-scope tests.",
            category=cls.category,
            created_by=cls.user,
        )
        cls.argument = EthikosArgument.objects.create(
            topic=cls.topic,
            user=cls.user,
            content="Rotating facilitation reduces concentration of power.",
            side=ARGUMENT_SIDE_PRO,
        )
        cls.reply = EthikosArgument.objects.create(
            topic=cls.topic,
            user=cls.other_user,
            content="Continuity also matters for complex topics.",
            parent=cls.argument,
            side=ARGUMENT_SIDE_CON,
        )

    def test_existing_ethikos_core_models_still_work(self) -> None:
        stance = EthikosStance.objects.create(
            user=self.user,
            topic=self.topic,
            value=STANCE_MAX,
        )

        self.assertEqual(str(self.category), "Governance")
        self.assertEqual(str(self.topic), self.topic.title)
        self.assertEqual(stance.value, STANCE_MAX)
        self.assertEqual(self.topic.arguments.count(), 2)
        self.assertEqual(self.argument.replies.count(), 1)

    def test_ethikos_stance_range_remains_topic_level(self) -> None:
        low = EthikosStance(user=self.other_user, topic=self.topic, value=STANCE_MIN)
        high = EthikosStance(user=self.other_user, topic=self.topic, value=STANCE_MAX)

        low.full_clean()
        high.full_clean()

        invalid_low = EthikosStance(
            user=self.other_user,
            topic=self.topic,
            value=STANCE_MIN - 1,
        )
        invalid_high = EthikosStance(
            user=self.other_user,
            topic=self.topic,
            value=STANCE_MAX + 1,
        )

        with self.assertRaises(ValidationError):
            invalid_low.full_clean()

        with self.assertRaises(ValidationError):
            invalid_high.full_clean()

    def test_argument_source_supports_url_source_and_related_names(self) -> None:
        source = ArgumentSource.objects.create(
            argument=self.argument,
            url="https://example.com/source",
            title="Example source",
            excerpt="A concise supporting excerpt.",
            source_type="article",
            citation_text="Example citation text.",
            quote="Relevant quoted evidence.",
            note="Internal reviewer note.",
            created_by=self.user,
        )

        self.assertEqual(source.argument, self.argument)
        self.assertEqual(source.created_by, self.user)
        self.assertFalse(source.is_removed)
        self.assertEqual(self.argument.sources.count(), 1)
        self.assertEqual(self.user.ethikos_argument_sources_created.count(), 1)
        self.assertIn("Example source", str(source))

    def test_argument_source_supports_note_only_source(self) -> None:
        source = ArgumentSource.objects.create(
            argument=self.argument,
            note="A source placeholder without a URL yet.",
            created_by=self.user,
        )

        source.full_clean()

        self.assertIsNone(source.url)
        self.assertEqual(source.note, "A source placeholder without a URL yet.")
        self.assertEqual(str(source), f"Source for argument {self.argument.id}")

    def test_argument_impact_vote_is_separate_from_topic_stance(self) -> None:
        stance = EthikosStance.objects.create(
            user=self.user,
            topic=self.topic,
            value=2,
        )
        vote = ArgumentImpactVote.objects.create(
            user=self.user,
            argument=self.argument,
            value=4,
        )

        self.assertEqual(stance.topic, self.topic)
        self.assertEqual(vote.argument, self.argument)
        self.assertEqual(vote.argument.topic, self.topic)

        self.assertEqual(self.topic.stances.count(), 1)
        self.assertEqual(self.argument.impact_votes.count(), 1)

        self.assertNotEqual(stance._meta.model_name, vote._meta.model_name)
        self.assertEqual(str(vote), f"{self.user} → {self.argument.id} = 4")

    def test_argument_impact_vote_rejects_out_of_range_values(self) -> None:
        invalid_low = ArgumentImpactVote(
            user=self.user,
            argument=self.argument,
            value=-1,
        )
        invalid_high = ArgumentImpactVote(
            user=self.user,
            argument=self.argument,
            value=5,
        )

        with self.assertRaises(ValidationError):
            invalid_low.full_clean()

        with self.assertRaises(ValidationError):
            invalid_high.full_clean()

    def test_argument_impact_vote_is_unique_per_user_and_argument(self) -> None:
        ArgumentImpactVote.objects.create(
            user=self.user,
            argument=self.argument,
            value=3,
        )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                ArgumentImpactVote.objects.create(
                    user=self.user,
                    argument=self.argument,
                    value=4,
                )

        # Same user may vote on a different argument.
        second_vote = ArgumentImpactVote.objects.create(
            user=self.user,
            argument=self.reply,
            value=4,
        )

        # Different user may vote on the same argument.
        third_vote = ArgumentImpactVote.objects.create(
            user=self.other_user,
            argument=self.argument,
            value=2,
        )

        self.assertEqual(second_vote.value, 4)
        self.assertEqual(third_vote.value, 2)

    def test_argument_suggestion_defaults_and_neutral_side(self) -> None:
        suggestion = ArgumentSuggestion.objects.create(
            topic=self.topic,
            parent=self.argument,
            created_by=self.other_user,
            side=ARGUMENT_SIDE_NEUTRAL,
            content="Consider adding a neutral framing claim.",
        )

        self.assertEqual(suggestion.status, ARGUMENT_SUGGESTION_PENDING)
        self.assertEqual(suggestion.side, ARGUMENT_SIDE_NEUTRAL)
        self.assertEqual(suggestion.topic, self.topic)
        self.assertEqual(suggestion.parent, self.argument)

        self.assertEqual(self.topic.argument_suggestions.count(), 1)
        self.assertEqual(self.argument.suggested_replies.count(), 1)
        self.assertEqual(
            self.other_user.ethikos_argument_suggestions_created.count(),
            1,
        )

    def test_argument_suggestion_review_links_to_accepted_argument(self) -> None:
        suggestion = ArgumentSuggestion.objects.create(
            topic=self.topic,
            parent=self.argument,
            created_by=self.other_user,
            side=ARGUMENT_SIDE_PRO,
            content="Accepted suggestion content.",
        )
        accepted_argument = EthikosArgument.objects.create(
            topic=self.topic,
            user=self.reviewer,
            parent=self.argument,
            side=ARGUMENT_SIDE_PRO,
            content=suggestion.content,
        )

        suggestion.accepted_argument = accepted_argument
        suggestion.status = ARGUMENT_SUGGESTION_ACCEPTED
        suggestion.reviewed_by = self.reviewer
        suggestion.reviewed_at = timezone.now()
        suggestion.save()

        suggestion.refresh_from_db()

        self.assertEqual(suggestion.accepted_argument, accepted_argument)
        self.assertEqual(suggestion.status, ARGUMENT_SUGGESTION_ACCEPTED)
        self.assertEqual(suggestion.reviewed_by, self.reviewer)
        self.assertIsNotNone(suggestion.reviewed_at)

        self.assertEqual(accepted_argument.accepted_suggestions.count(), 1)
        self.assertEqual(
            self.reviewer.ethikos_argument_suggestions_reviewed.count(),
            1,
        )

    def test_discussion_participant_role_defaults_and_related_names(self) -> None:
        role = DiscussionParticipantRole.objects.create(
            topic=self.topic,
            user=self.other_user,
            assigned_by=self.user,
        )

        self.assertEqual(role.role, DISCUSSION_ROLE_VIEWER)
        self.assertEqual(role.topic, self.topic)
        self.assertEqual(role.user, self.other_user)
        self.assertEqual(role.assigned_by, self.user)

        self.assertEqual(self.topic.participant_roles.count(), 1)
        self.assertEqual(self.other_user.ethikos_discussion_roles.count(), 1)
        self.assertEqual(self.user.ethikos_discussion_roles_assigned.count(), 1)

    def test_discussion_participant_role_is_unique_per_topic_user(self) -> None:
        DiscussionParticipantRole.objects.create(
            topic=self.topic,
            user=self.other_user,
            role=DISCUSSION_ROLE_VIEWER,
            assigned_by=self.user,
        )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                DiscussionParticipantRole.objects.create(
                    topic=self.topic,
                    user=self.other_user,
                    role=DISCUSSION_ROLE_ADMIN,
                    assigned_by=self.reviewer,
                )

        same_user_other_topic = DiscussionParticipantRole.objects.create(
            topic=self.other_topic,
            user=self.other_user,
            role=DISCUSSION_ROLE_ADMIN,
            assigned_by=self.reviewer,
        )

        self.assertEqual(same_user_other_topic.role, DISCUSSION_ROLE_ADMIN)

    def test_discussion_visibility_setting_defaults_and_related_names(self) -> None:
        setting = DiscussionVisibilitySetting.objects.create(
            topic=self.topic,
            changed_by=self.user,
        )

        self.assertEqual(setting.participation_type, DISCUSSION_PARTICIPATION_STANDARD)
        self.assertEqual(setting.author_visibility, AUTHOR_VISIBILITY_ALL)
        self.assertEqual(setting.vote_visibility, VOTE_VISIBILITY_ALL)
        self.assertEqual(setting.topic, self.topic)
        self.assertEqual(setting.changed_by, self.user)

        self.assertEqual(self.topic.visibility_setting, setting)
        self.assertEqual(self.user.ethikos_visibility_settings_changed.count(), 1)

    def test_discussion_visibility_setting_is_one_to_one_per_topic(self) -> None:
        DiscussionVisibilitySetting.objects.create(
            topic=self.topic,
            changed_by=self.user,
        )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                DiscussionVisibilitySetting.objects.create(
                    topic=self.topic,
                    changed_by=self.reviewer,
                )

        other_setting = DiscussionVisibilitySetting.objects.create(
            topic=self.other_topic,
            changed_by=self.reviewer,
        )

        self.assertEqual(other_setting.topic, self.other_topic)