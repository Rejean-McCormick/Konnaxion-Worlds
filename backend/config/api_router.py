# FILE: backend/config/api_router.py
# config/api_router.py
"""
Central DRF router for every Konnaxion v14 API endpoint.

`config/urls.py` only needs:

    path("api/", include("config.api_router"))

Kintsugi Wave 1 foundation rules:
- Preserve the current `/api/ethikos/*` and `/api/kollective/*` center of gravity.
- Do not introduce `/api/kialo/*`, `/api/kintsugi/*`, `/api/home/*`,
  `/api/korum/*`, `/api/consultations/*`, `/api/konsultations/*`,
  or `/api/deliberation/*`.
- Register Wave 1 additions as optional until their ViewSets exist.
- Keep required baseline endpoints hard-required so drift is caught early.
"""

from __future__ import annotations

from typing import Any, Optional, Type

from django.conf import settings
from rest_framework.routers import DefaultRouter, SimpleRouter

from konnaxion.ethikos.constants import (
    ETHIKOS_ARGUMENTS_PREFIX,
    ETHIKOS_CATEGORIES_PREFIX,
    ETHIKOS_STANCES_PREFIX,
    ETHIKOS_TOPICS_PREFIX,
    FORBIDDEN_KINTSUGI_API_SEGMENTS,
)

ViewSetType = Type[Any]
OptionalViewSet = Optional[ViewSetType]


# ---------------------------------------------------------------------------
# Router safety helpers
# ---------------------------------------------------------------------------

# Temporary compatibility until constants.py includes these two route-drift
# segments directly. They are included here because this router docstring and
# Wave 1 route rules explicitly forbid standalone consultation API trees.
_ADDITIONAL_FORBIDDEN_API_SEGMENTS = (
    "consultations",
    "konsultations",
)

FORBIDDEN_API_SEGMENTS = tuple(
    dict.fromkeys(
        (
            *FORBIDDEN_KINTSUGI_API_SEGMENTS,
            *_ADDITIONAL_FORBIDDEN_API_SEGMENTS,
        ),
    ),
)


def assert_allowed_api_prefix(prefix: str) -> None:
    """
    Prevent accidental Kintsugi route drift.

    Wave 1 must extend existing Konnaxion API surfaces, especially
    `/api/ethikos/*` and `/api/kollective/*`, rather than creating parallel
    Kialo/Kintsugi/Home/Korum/Consultation/Deliberation API trees.

    This guard checks every path segment, so both of these are rejected:

        /api/kialo/*
        /api/ethikos/kialo/*
    """
    normalized = prefix.strip().strip("/")

    if not normalized:
        raise ValueError("API prefix cannot be empty.")

    segments = tuple(segment for segment in normalized.split("/") if segment)

    for forbidden_segment in FORBIDDEN_API_SEGMENTS:
        if forbidden_segment in segments:
            raise ValueError(
                f"Forbidden API prefix for Kintsugi Wave 1: {prefix!r}. "
                "Use canonical `/api/ethikos/*` or `/api/kollective/*` routes.",
            )


def optional_viewset(module: Any, *candidate_names: str) -> OptionalViewSet:
    """
    Return the first ViewSet found on a module.

    This supports gradual Kintsugi implementation where a ViewSet may be named
    either with a concise name, e.g. `ArgumentSourceViewSet`, or with an
    explicit ethiKos-prefixed name, e.g. `EthikosArgumentSourceViewSet`.
    """
    for candidate_name in candidate_names:
        viewset = getattr(module, candidate_name, None)
        if viewset is not None:
            return viewset

    return None


# ---------------------------------------------------------------------------
# Imports
# ---------------------------------------------------------------------------

# ── Core / Users ──────────────────────────────────────────
from konnaxion.users.api.views import UserViewSet  # /api/users/...


# ── Team Builder ──────────────────────────────────────────
from konnaxion.teambuilder.views import (
    BuilderSessionViewSet,
    ProblemViewSet,
    TeamViewSet,
)


# ── ethiKos ───────────────────────────────────────────────
from konnaxion.ethikos import api_views as ethikos_api

# Required baseline ethiKos ViewSets.
# Keep these hard-required so baseline API drift is caught immediately.
TopicViewSet = ethikos_api.TopicViewSet
StanceViewSet = ethikos_api.StanceViewSet
ArgumentViewSet = ethikos_api.ArgumentViewSet

# Optional category ViewSet.
# Name may be CategoryViewSet or EthikosCategoryViewSet depending on snapshot.
EthikosCategoryViewSet: OptionalViewSet = optional_viewset(
    ethikos_api,
    "CategoryViewSet",
    "EthikosCategoryViewSet",
)

# Optional Kintsugi Wave 1 / Korum ViewSets.
# These are intentionally optional in the foundation pass. They become live
# routes only when the corresponding ViewSets are implemented in
# `konnaxion.ethikos.api_views`.
ArgumentSourceViewSet: OptionalViewSet = optional_viewset(
    ethikos_api,
    "ArgumentSourceViewSet",
    "EthikosArgumentSourceViewSet",
)

ArgumentImpactVoteViewSet: OptionalViewSet = optional_viewset(
    ethikos_api,
    "ArgumentImpactVoteViewSet",
    "EthikosArgumentImpactVoteViewSet",
)

ArgumentSuggestionViewSet: OptionalViewSet = optional_viewset(
    ethikos_api,
    "ArgumentSuggestionViewSet",
    "EthikosArgumentSuggestionViewSet",
)

DiscussionParticipantRoleViewSet: OptionalViewSet = optional_viewset(
    ethikos_api,
    "DiscussionParticipantRoleViewSet",
    "EthikosDiscussionParticipantRoleViewSet",
)

DiscussionVisibilitySettingViewSet: OptionalViewSet = optional_viewset(
    ethikos_api,
    "DiscussionVisibilitySettingViewSet",
    "EthikosDiscussionVisibilitySettingViewSet",
)


# ── keenKonnect ───────────────────────────────────────────
from konnaxion.keenkonnect.api_views import (
    ProjectMessageViewSet,
    ProjectRatingViewSet,
    ProjectResourceViewSet,
    ProjectTaskViewSet,
    ProjectTeamViewSet,
    ProjectViewSet,
    TagViewSet as KeenKonnectTagViewSet,
)


# ── Kollective Intelligence ───────────────────────────────
# Vote-related ViewSets are optional for now; the app's api_views module may be
# incomplete in the local snapshot.
VoteViewSet: OptionalViewSet
VoteResultViewSet: OptionalViewSet

try:
    from konnaxion.kollective_intelligence import api_views as kollective_api

    VoteViewSet = optional_viewset(kollective_api, "VoteViewSet")
    VoteResultViewSet = optional_viewset(kollective_api, "VoteResultViewSet")
except (ImportError, AttributeError):
    VoteViewSet = None
    VoteResultViewSet = None


# ── KonnectED Knowledge + CertifiKation ───────────────────
from konnaxion.konnected.api_views import (
    CertificationPathViewSet,
    CoCreationContributionViewSet,
    CoCreationProjectViewSet,
    EvaluationViewSet,
    ExamAttemptViewSet,
    ForumPostViewSet,
    ForumTopicViewSet,
    KnowledgeRecommendationViewSet,
    KnowledgeResourceViewSet,
    LearningProgressViewSet,
    MentorProfileViewSet,
    MentorshipRequestViewSet,
    PeerValidationViewSet,
    PortfolioViewSet,
)

# OfflinePackageViewSet is optional; it will be present once the offline-packages
# feature is implemented in konnected.api_views.
OfflinePackageViewSet: OptionalViewSet

try:
    from konnaxion.konnected.api_views import (
        OfflinePackageViewSet as _OfflinePackageViewSet,
    )

    OfflinePackageViewSet = _OfflinePackageViewSet
except (ImportError, AttributeError):
    OfflinePackageViewSet = None


# ── Kreative ──────────────────────────────────────────────
from konnaxion.kreative.api_views import (
    CollabSessionViewSet,
    GalleryViewSet,
    KreativeArtworkViewSet,
    TagViewSet as KreativeTagViewSet,
    TraditionEntryViewSet,
)


# ── Kontrol Admin & Moderation ────────────────────────────
# Optional so the central router does not crash if the kontrol app is partially
# migrated in a local/dev snapshot.
AuditLogViewSet: OptionalViewSet
ModerationTicketViewSet: OptionalViewSet
UserAdminViewSet: OptionalViewSet
KonsensusConfigViewSet: OptionalViewSet

try:
    from konnaxion.kontrol.views import (
        AuditLogViewSet as _AuditLogViewSet,
        KonsensusConfigViewSet as _KonsensusConfigViewSet,
        ModerationTicketViewSet as _ModerationTicketViewSet,
        UserAdminViewSet as _UserAdminViewSet,
    )

    AuditLogViewSet = _AuditLogViewSet
    ModerationTicketViewSet = _ModerationTicketViewSet
    UserAdminViewSet = _UserAdminViewSet
    KonsensusConfigViewSet = _KonsensusConfigViewSet
except (ImportError, AttributeError):
    AuditLogViewSet = None
    ModerationTicketViewSet = None
    UserAdminViewSet = None
    KonsensusConfigViewSet = None


# ---------------------------------------------------------------------------
# Router registration helpers
# ---------------------------------------------------------------------------

router = DefaultRouter() if settings.DEBUG else SimpleRouter()


def register_required(
    prefix: str,
    viewset: ViewSetType,
    basename: str,
) -> None:
    """
    Register a required ViewSet after checking no-drift routing rules.
    """
    assert_allowed_api_prefix(prefix)
    router.register(prefix, viewset, basename=basename)


def register_optional(
    prefix: str,
    viewset: OptionalViewSet,
    basename: str,
) -> None:
    """
    Register an optional ViewSet after checking no-drift routing rules.

    Optional ViewSets are ignored until their implementation lands. This lets
    shared/common files be updated before every slice-specific ViewSet exists.
    """
    assert_allowed_api_prefix(prefix)

    if viewset is not None:
        router.register(prefix, viewset, basename=basename)


# ---------------------------------------------------------------------------
# Route registrations
# ---------------------------------------------------------------------------

# Core / Users
register_required("users", UserViewSet, basename="user")


# Team Builder
register_required(
    "teambuilder/sessions",
    BuilderSessionViewSet,
    basename="teambuilder-session",
)
register_required(
    "teambuilder/teams",
    TeamViewSet,
    basename="teambuilder-team",
)
register_required(
    "teambuilder/problems",
    ProblemViewSet,
    basename="teambuilder-problem",
)


# ethiKos — required baseline
register_required(ETHIKOS_TOPICS_PREFIX, TopicViewSet, basename="ethikos-topic")
register_required(ETHIKOS_STANCES_PREFIX, StanceViewSet, basename="ethikos-stance")
register_required(
    ETHIKOS_ARGUMENTS_PREFIX,
    ArgumentViewSet,
    basename="ethikos-argument",
)


# ethiKos — optional baseline category endpoint
register_optional(
    ETHIKOS_CATEGORIES_PREFIX,
    EthikosCategoryViewSet,
    basename="ethikos-category",
)


# ethiKos — optional Kintsugi Wave 1 / Korum foundation routes
# These stay under `/api/ethikos/*`; no `/api/kialo/*`, `/api/kintsugi/*`,
# or `/api/korum/*`.
register_optional(
    "ethikos/argument-sources",
    ArgumentSourceViewSet,
    basename="ethikos-argument-source",
)
register_optional(
    "ethikos/argument-impact-votes",
    ArgumentImpactVoteViewSet,
    basename="ethikos-argument-impact-vote",
)
register_optional(
    "ethikos/argument-suggestions",
    ArgumentSuggestionViewSet,
    basename="ethikos-argument-suggestion",
)
register_optional(
    "ethikos/discussion-participant-roles",
    DiscussionParticipantRoleViewSet,
    basename="ethikos-discussion-participant-role",
)
register_optional(
    "ethikos/discussion-visibility-settings",
    DiscussionVisibilitySettingViewSet,
    basename="ethikos-discussion-visibility-setting",
)


# keenKonnect
# Canonical v14 path.
register_required(
    "keenkonnect/projects",
    ProjectViewSet,
    basename="keenkonnect-project",
)

# Backwards compatibility for older services expecting /api/projects/.
register_required("projects", ProjectViewSet, basename="project")

register_required(
    "keenkonnect/resources",
    ProjectResourceViewSet,
    basename="keenkonnect-resource",
)
register_required(
    "keenkonnect/tasks",
    ProjectTaskViewSet,
    basename="keenkonnect-task",
)
register_required(
    "keenkonnect/messages",
    ProjectMessageViewSet,
    basename="keenkonnect-message",
)
register_required(
    "keenkonnect/teams",
    ProjectTeamViewSet,
    basename="keenkonnect-team",
)
register_required(
    "keenkonnect/ratings",
    ProjectRatingViewSet,
    basename="keenkonnect-rating",
)
register_required(
    "keenkonnect/tags",
    KeenKonnectTagViewSet,
    basename="keenkonnect-tag",
)


# Kollective Intelligence
register_optional(
    "kollective/votes",
    VoteViewSet,
    basename="kollective-vote",
)
register_optional(
    "kollective/vote-results",
    VoteResultViewSet,
    basename="kollective-vote-result",
)


# KonnectED — Knowledge
register_required(
    "konnected/resources",
    KnowledgeResourceViewSet,
    basename="konnected-resource",
)


register_required(
    "konnected/recommendations",
    KnowledgeRecommendationViewSet,
    basename="konnected-recommendation",
)
register_required(
    "konnected/progress",
    LearningProgressViewSet,
    basename="konnected-progress",
)
register_required(
    "konnected/mentors",
    MentorProfileViewSet,
    basename="konnected-mentor",
)
register_required(
    "konnected/mentorship-requests",
    MentorshipRequestViewSet,
    basename="konnected-mentorship-request",
)
register_required(
    "konnected/co-creation-projects",
    CoCreationProjectViewSet,
    basename="konnected-co-creation-project",
)
register_required(
    "konnected/co-creation-contributions",
    CoCreationContributionViewSet,
    basename="konnected-co-creation-contribution",
)
register_required(
    "konnected/forum-topics",
    ForumTopicViewSet,
    basename="konnected-forum-topic",
)
register_required(
    "konnected/forum-posts",
    ForumPostViewSet,
    basename="konnected-forum-post",
)


# KonnectED — Offline packages
# Path aligned with frontend OFFLINE_PACKAGE_* endpoints:
#   /api/konnected/offline-packages/
register_optional(
    "konnected/offline-packages",
    OfflinePackageViewSet,
    basename="konnected-offline-package",
)


# KonnectED — CertifiKation
register_required(
    "konnected/certifications/paths",
    CertificationPathViewSet,
    basename="konnected-certification-path",
)
register_required(
    "konnected/certifications/evaluations",
    EvaluationViewSet,
    basename="konnected-evaluation",
)
register_required(
    "konnected/certifications/peer-validations",
    PeerValidationViewSet,
    basename="konnected-peer-validation",
)
register_required(
    "konnected/portfolios",
    PortfolioViewSet,
    basename="konnected-portfolio",
)
register_required(
    "konnected/certifications/exam-attempts",
    ExamAttemptViewSet,
    basename="konnected-exam-attempt",
)


# Kreative
register_required(
    "kreative/artworks",
    KreativeArtworkViewSet,
    basename="kreative-artwork",
)
register_required(
    "kreative/galleries",
    GalleryViewSet,
    basename="kreative-gallery",
)
register_required(
    "kreative/collab-sessions",
    CollabSessionViewSet,
    basename="kreative-collab-session",
)
register_required(
    "kreative/traditions",
    TraditionEntryViewSet,
    basename="kreative-tradition",
)
register_required(
    "kreative/tags",
    KreativeTagViewSet,
    basename="kreative-tag",
)


# Kontrol — Admin
register_optional(
    "admin/audit-log",
    AuditLogViewSet,
    basename="kontrol-audit-log",
)
register_optional(
    "admin/moderation",
    ModerationTicketViewSet,
    basename="kontrol-moderation",
)
register_optional(
    "admin/users",
    UserAdminViewSet,
    basename="kontrol-user-admin",
)
register_optional(
    "admin/konsensus-config",
    KonsensusConfigViewSet,
    basename="kontrol-konsensus-config",
)


# ---------------------------------------------------------------------------

app_name = "api"
urlpatterns = router.urls