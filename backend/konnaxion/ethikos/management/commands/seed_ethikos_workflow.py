from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

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


DEFAULT_USERNAME = "ethikos_seed_user"
DEFAULT_EMAIL = "ethikos-seed-user@example.com"
DEFAULT_PASSWORD = "test-password"

WORKFLOW_TOPIC_TITLE = "Should public datasets require consent receipts?"
RESULT_TOPIC_TITLE = "Should consent receipts become a published civic standard?"


def user_defaults(email: str) -> dict[str, object]:
    """
    Build user defaults defensively.

    Some Konnaxion user models include name / is_ethikos_elite. Keeping this
    dynamic prevents this seed command from breaking if the user model changes.
    """
    User = get_user_model()
    field_names = {field.name for field in User._meta.fields}

    defaults: dict[str, object] = {
        "email": email,
        "is_staff": True,
        "is_superuser": True,
    }

    if "name" in field_names:
        defaults["name"] = "Ethikos Seed User"

    if "is_ethikos_elite" in field_names:
        defaults["is_ethikos_elite"] = True

    return defaults


class Command(BaseCommand):
    help = "Seed real Ethikos workflow data for local Playwright smoke tests."

    def add_arguments(self, parser):
        parser.add_argument(
            "--username",
            default=DEFAULT_USERNAME,
            help=f"Seed user username. Default: {DEFAULT_USERNAME}",
        )
        parser.add_argument(
            "--email",
            default=DEFAULT_EMAIL,
            help=f"Seed user email. Default: {DEFAULT_EMAIL}",
        )
        parser.add_argument(
            "--password",
            default=DEFAULT_PASSWORD,
            help="Seed user password. Default: test-password",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        username = options["username"]
        email = options["email"]
        password = options["password"]

        User = get_user_model()

        user, _ = User.objects.update_or_create(
            username=username,
            defaults=user_defaults(email),
        )

        user.set_password(password)
        user.save()

        category, _ = EthikosCategory.objects.update_or_create(
            name="Public ethics",
            defaults={
                "description": "Seed category for local Ethikos workflow testing.",
            },
        )

        workflow_topic, _ = EthikosTopic.objects.update_or_create(
            title=WORKFLOW_TOPIC_TITLE,
            defaults={
                "description": (
                    "A local Ethikos/Korum deliberation topic used to test the "
                    "full Wave 1 workflow circuit, public voting, Korum panels, "
                    "and authenticated write paths."
                ),
                "category": category,
                "created_by": user,
                "status": EthikosTopic.OPEN,
            },
        )

        pro_argument, _ = EthikosArgument.objects.update_or_create(
            topic=workflow_topic,
            user=user,
            content="Consent receipts improve public accountability.",
            defaults={
                "side": EthikosArgument.PRO,
                "is_hidden": False,
            },
        )

        con_argument, _ = EthikosArgument.objects.update_or_create(
            topic=workflow_topic,
            user=user,
            parent=pro_argument,
            content="The receipt burden should stay proportional to risk.",
            defaults={
                "side": EthikosArgument.CON,
                "is_hidden": False,
            },
        )

        neutral_argument, _ = EthikosArgument.objects.update_or_create(
            topic=workflow_topic,
            user=user,
            content=(
                "A practical policy could require receipts only for datasets "
                "above a clear public-risk threshold."
            ),
            defaults={
                "side": None,
                "is_hidden": False,
            },
        )

        EthikosStance.objects.update_or_create(
            topic=workflow_topic,
            user=user,
            defaults={
                "value": 2,
            },
        )

        ArgumentSource.objects.update_or_create(
            argument=pro_argument,
            title="Consent receipt reference",
            defaults={
                "url": "https://example.com/ethikos-consent-receipts",
                "excerpt": "Consent receipts can help explain how public data is used.",
                "source_type": "reference",
                "citation_text": "Local seed reference for Ethikos smoke testing.",
                "quote": "Consent records support accountability.",
                "note": "Seed source for the Wave 1 workflow circuit.",
                "created_by": user,
                "is_removed": False,
            },
        )

        ArgumentSource.objects.update_or_create(
            argument=neutral_argument,
            title="Risk threshold reference",
            defaults={
                "url": "https://example.com/ethikos-risk-thresholds",
                "excerpt": "Risk thresholds can keep governance requirements practical.",
                "source_type": "reference",
                "citation_text": "Local seed reference for proportional public-data rules.",
                "quote": "Risk-based rules reduce unnecessary burden.",
                "note": "Seed source for authenticated workflow tests.",
                "created_by": user,
                "is_removed": False,
            },
        )

        ArgumentImpactVote.objects.update_or_create(
            argument=pro_argument,
            user=user,
            defaults={
                "value": 3,
            },
        )

        ArgumentImpactVote.objects.update_or_create(
            argument=neutral_argument,
            user=user,
            defaults={
                "value": 2,
            },
        )

        ArgumentSuggestion.objects.update_or_create(
            topic=workflow_topic,
            created_by=user,
            content="Add a proportionality rule for low-risk public datasets.",
            defaults={
                "parent": con_argument,
                "side": EthikosArgument.NEUTRAL,
                "status": ArgumentSuggestion.PENDING,
            },
        )

        DiscussionParticipantRole.objects.update_or_create(
            topic=workflow_topic,
            user=user,
            defaults={
                "role": DiscussionParticipantRole.OWNER,
                "assigned_by": user,
            },
        )

        DiscussionVisibilitySetting.objects.update_or_create(
            topic=workflow_topic,
            defaults={
                "participation_type": DiscussionVisibilitySetting.PARTICIPATION_STANDARD,
                "author_visibility": DiscussionVisibilitySetting.AUTHOR_VISIBILITY_ALL,
                "vote_visibility": DiscussionVisibilitySetting.VOTE_VISIBILITY_ALL,
                "changed_by": user,
            },
        )

        workflow_topic.total_votes = workflow_topic.stances.count()
        workflow_topic.save(update_fields=["total_votes", "last_activity"])

        result_topic, _ = EthikosTopic.objects.update_or_create(
            title=RESULT_TOPIC_TITLE,
            defaults={
                "description": (
                    "Closed seeded topic used by Decide results and route-sweep "
                    "tests to verify non-empty archived decision surfaces."
                ),
                "category": category,
                "created_by": user,
                "status": EthikosTopic.CLOSED,
            },
        )

        EthikosStance.objects.update_or_create(
            topic=result_topic,
            user=user,
            defaults={
                "value": 3,
            },
        )

        result_topic.total_votes = result_topic.stances.count()
        result_topic.save(update_fields=["total_votes", "last_activity"])

        self.stdout.write(self.style.SUCCESS("Seeded Ethikos workflow data."))
        self.stdout.write(f"User: {user.username}")
        self.stdout.write(f"Email: {email}")
        self.stdout.write(f"Password: {password}")
        self.stdout.write(f"Workflow topic ID: {workflow_topic.id}")
        self.stdout.write(f"Workflow topic title: {workflow_topic.title}")
        self.stdout.write(
            f"Workflow route: /ethikos/deliberate/{workflow_topic.id}?sidebar=ethikos"
        )
        self.stdout.write(f"Closed result topic ID: {result_topic.id}")
        self.stdout.write("")
        self.stdout.write("PowerShell test env:")
        self.stdout.write(f'$env:ETHIKOS_TEST_USERNAME="{user.username}"')
        self.stdout.write(f'$env:ETHIKOS_TEST_EMAIL="{email}"')
        self.stdout.write(f'$env:ETHIKOS_TEST_PASSWORD="{password}"')
        self.stdout.write(f'$env:WAVE1_TOPIC_ID="{workflow_topic.id}"')