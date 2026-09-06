# FILE: backend/konnaxion/teambuilder/factories.py
from __future__ import annotations

from collections.abc import Sequence
from typing import Any

from django.contrib.auth import get_user_model
from factory import Faker, LazyAttribute, SubFactory, post_generation
from factory.django import DjangoModelFactory

from konnaxion.teambuilder.models import (
    Problem,
    ProblemChangeEvent,
    BuilderSession,
    Team,
    TeamMember,
)

User = get_user_model()


# ---------------------------------------------------------------------------
# Generic user factory (local, so teambuilder tests don't depend on users/tests)
# ---------------------------------------------------------------------------


class UserFactory(DjangoModelFactory[User]):
    username = Faker("user_name")
    email = Faker("email")
    first_name = Faker("first_name")
    last_name = Faker("last_name")

    @post_generation
    def password(self, create: bool, extracted: Sequence[Any], **kwargs):  # noqa: FBT001
        password = (
            extracted
            if extracted
            else Faker(
                "password",
                length=24,
                special_chars=True,
                digits=True,
                upper_case=True,
                lower_case=True,
            ).evaluate(None, None, extra={"locale": None})
        )
        self.set_password(password)

    @classmethod
    def _after_postgeneration(cls, instance, create, results=None):
        """Save again the instance if creating and at least one hook ran."""
        if create and results and not cls._meta.skip_postgeneration_save:
            instance.save()

    class Meta:
        model = User
        django_get_or_create = ["username"]


# ---------------------------------------------------------------------------
# Problem domain factories
# ---------------------------------------------------------------------------


class ProblemFactory(DjangoModelFactory[Problem]):
    name = Faker("sentence", nb_words=4)
    description = Faker("paragraph", nb_sentences=3)

    status = Problem.Status.ACTIVE
    risk_level = Problem.RiskLevel.MEDIUM

    min_team_size = 3
    max_team_size = 5

    unesco_codes = LazyAttribute(lambda _: ["13.01"])
    categories = LazyAttribute(lambda _: ["Education"])
    recommended_modes = LazyAttribute(lambda _: ["Elite", "Learning"])

    facilitator_notes = Faker("sentence")

    created_by = SubFactory(UserFactory)

    class Meta:
        model = Problem


class ProblemChangeEventFactory(DjangoModelFactory[ProblemChangeEvent]):
    problem = SubFactory(ProblemFactory)
    type = ProblemChangeEvent.EventType.EDIT
    title = Faker("sentence", nb_words=6)
    description = Faker("paragraph", nb_sentences=2)
    changed_by = SubFactory(UserFactory)

    class Meta:
        model = ProblemChangeEvent


# ---------------------------------------------------------------------------
# BuilderSession / Team / TeamMember factories
# ---------------------------------------------------------------------------


class BuilderSessionFactory(DjangoModelFactory[BuilderSession]):
    name = Faker("sentence", nb_words=4)
    description = Faker("paragraph", nb_sentences=2)

    status = BuilderSession.Status.DRAFT

    algorithm_config = LazyAttribute(
        lambda _: {
            "target_team_size": 4,
            "strategy": "BALANCED",
        }
    )

    created_by = SubFactory(UserFactory)

    # Link to a problem (optional but present by default in tests)
    problem = SubFactory(ProblemFactory)

    @post_generation
    def candidates(self, create: bool, extracted: Sequence[Any], **kwargs):  # noqa: FBT001
        """
        Optionally attach candidates:
        - If `extracted` is provided, it should be an iterable of User instances.
        - If not provided, we add a few generated users by default.
        """
        if not create:
            return

        if extracted:
            for user in extracted:
                self.candidates.add(user)
        else:
            # Default: attach 3 users so tests have some data
            for _ in range(3):
                self.candidates.add(UserFactory())

    class Meta:
        model = BuilderSession


class TeamFactory(DjangoModelFactory[Team]):
    session = SubFactory(BuilderSessionFactory)
    name = LazyAttribute(lambda o: f"Team for {o.session.name}")

    metrics = LazyAttribute(
        lambda _:
        {
            "avg_skill": 0.8,
            "diversity_score": 0.9,
        }
    )

    class Meta:
        model = Team


class TeamMemberFactory(DjangoModelFactory[TeamMember]):
    team = SubFactory(TeamFactory)
    user = SubFactory(UserFactory)

    suggested_role = Faker("job")
    match_reason = Faker("sentence")

    class Meta:
        model = TeamMember
        django_get_or_create = ["team", "user"]
