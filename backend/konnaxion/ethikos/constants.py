# FILE: backend/konnaxion/ethikos/constants.py
"""Shared ethiKos/Kintsugi constants.

This file is the thin common foundation for Wave 1 slices.

Rules:
- Keep existing ethiKos model names stable.
- Keep canonical API paths under /api/ethikos/*.
- Do not introduce /api/kialo/*, /api/kintsugi/*, /api/korum/*,
  /api/deliberation/*, or /api/home/*.
- Do not conflate topic-level stances, Kialo-style argument impact votes,
  and Smart Vote readings.
- Keep symbolic values here so branches do not redefine them independently.
"""

from __future__ import annotations

from typing import Final


# ---------------------------------------------------------------------------
# Canonical API prefixes and paths
# ---------------------------------------------------------------------------

ETHIKOS_API_PREFIX: Final[str] = "ethikos"

ETHIKOS_TOPICS_PREFIX: Final[str] = "ethikos/topics"
ETHIKOS_STANCES_PREFIX: Final[str] = "ethikos/stances"
ETHIKOS_ARGUMENTS_PREFIX: Final[str] = "ethikos/arguments"
ETHIKOS_CATEGORIES_PREFIX: Final[str] = "ethikos/categories"

ETHIKOS_TOPICS_PATH: Final[str] = f"{ETHIKOS_TOPICS_PREFIX}/"
ETHIKOS_STANCES_PATH: Final[str] = f"{ETHIKOS_STANCES_PREFIX}/"
ETHIKOS_ARGUMENTS_PATH: Final[str] = f"{ETHIKOS_ARGUMENTS_PREFIX}/"
ETHIKOS_CATEGORIES_PATH: Final[str] = f"{ETHIKOS_CATEGORIES_PREFIX}/"


# These are forbidden as route segments anywhere in the API prefix.
# Example: both "kialo" and "ethikos/kialo" must be rejected.
FORBIDDEN_KINTSUGI_API_SEGMENTS: Final[tuple[str, ...]] = (
    "home",
    "kialo",
    "kintsugi",
    "korum",
    "deliberation",
)

# Backward-compatible alias for branches that already imported this name.
FORBIDDEN_KINTSUGI_API_PREFIXES: Final[tuple[str, ...]] = (
    FORBIDDEN_KINTSUGI_API_SEGMENTS
)


# ---------------------------------------------------------------------------
# Current core model invariants
# ---------------------------------------------------------------------------

CURRENT_ETHIKOS_CORE_MODELS: Final[tuple[str, ...]] = (
    "EthikosCategory",
    "EthikosTopic",
    "EthikosStance",
    "EthikosArgument",
)


# ---------------------------------------------------------------------------
# Topic status
# ---------------------------------------------------------------------------

TOPIC_STATUS_OPEN: Final[str] = "open"
TOPIC_STATUS_CLOSED: Final[str] = "closed"
TOPIC_STATUS_ARCHIVED: Final[str] = "archived"

TOPIC_STATUS_CHOICES: Final[tuple[tuple[str, str], ...]] = (
    (TOPIC_STATUS_OPEN, "Open"),
    (TOPIC_STATUS_CLOSED, "Closed"),
    (TOPIC_STATUS_ARCHIVED, "Archived"),
)


# ---------------------------------------------------------------------------
# Topic-level stance range.
#
# This is NOT the Kialo-style claim/argument impact vote range.
# It is also NOT a Smart Vote reading.
# ---------------------------------------------------------------------------

STANCE_MIN: Final[int] = -3
STANCE_MAX: Final[int] = 3
STANCE_VALUES: Final[tuple[int, ...]] = (-3, -2, -1, 0, 1, 2, 3)


# ---------------------------------------------------------------------------
# Argument side.
#
# Current EthikosArgument.side persists pro/con only. The neutral value is
# reserved for filtering and future slice handling; do not add it to the DB
# field choices until the owning Korum slice includes a migration.
# ---------------------------------------------------------------------------

ARGUMENT_SIDE_PRO: Final[str] = "pro"
ARGUMENT_SIDE_CON: Final[str] = "con"
ARGUMENT_SIDE_NEUTRAL: Final[str] = "neutral"

ARGUMENT_SIDE_CHOICES: Final[tuple[tuple[str, str], ...]] = (
    (ARGUMENT_SIDE_PRO, "Pro"),
    (ARGUMENT_SIDE_CON, "Con"),
)

ARGUMENT_SIDE_FILTER_VALUES: Final[tuple[str, ...]] = (
    ARGUMENT_SIDE_PRO,
    ARGUMENT_SIDE_CON,
    ARGUMENT_SIDE_NEUTRAL,
)


# ---------------------------------------------------------------------------
# Future Korum/Kialo-style argument impact vote range.
#
# Kept here now as a shared invariant for later Korum slice models.
# Do not wire DB models in the foundation pass.
# ---------------------------------------------------------------------------

ARGUMENT_IMPACT_VOTE_MIN: Final[int] = 0
ARGUMENT_IMPACT_VOTE_MAX: Final[int] = 4
ARGUMENT_IMPACT_VOTE_VALUES: Final[tuple[int, ...]] = (0, 1, 2, 3, 4)

# Backward-compatible aliases for branches that already used shorter names.
ARGUMENT_IMPACT_MIN: Final[int] = ARGUMENT_IMPACT_VOTE_MIN
ARGUMENT_IMPACT_MAX: Final[int] = ARGUMENT_IMPACT_VOTE_MAX
ARGUMENT_IMPACT_VALUES: Final[tuple[int, ...]] = ARGUMENT_IMPACT_VOTE_VALUES


# ---------------------------------------------------------------------------
# Future Korum/Kialo-style discussion participant roles.
#
# These are participant-role values, not Django permission group names.
# Moderator/admin governance can still be represented in permissions.py through
# Django staff flags or groups, without changing these discussion role values.
# ---------------------------------------------------------------------------

DISCUSSION_ROLE_OWNER: Final[str] = "owner"
DISCUSSION_ROLE_ADMIN: Final[str] = "admin"
DISCUSSION_ROLE_EDITOR: Final[str] = "editor"
DISCUSSION_ROLE_WRITER: Final[str] = "writer"
DISCUSSION_ROLE_SUGGESTER: Final[str] = "suggester"
DISCUSSION_ROLE_VIEWER: Final[str] = "viewer"

DISCUSSION_ROLE_CHOICES: Final[tuple[tuple[str, str], ...]] = (
    (DISCUSSION_ROLE_OWNER, "Owner"),
    (DISCUSSION_ROLE_ADMIN, "Admin"),
    (DISCUSSION_ROLE_EDITOR, "Editor"),
    (DISCUSSION_ROLE_WRITER, "Writer"),
    (DISCUSSION_ROLE_SUGGESTER, "Suggester"),
    (DISCUSSION_ROLE_VIEWER, "Viewer"),
)


# ---------------------------------------------------------------------------
# Future discussion visibility / anonymity settings.
# ---------------------------------------------------------------------------

DISCUSSION_PARTICIPATION_STANDARD: Final[str] = "standard"
DISCUSSION_PARTICIPATION_ANONYMOUS: Final[str] = "anonymous"

DISCUSSION_PARTICIPATION_CHOICES: Final[tuple[tuple[str, str], ...]] = (
    (DISCUSSION_PARTICIPATION_STANDARD, "Standard"),
    (DISCUSSION_PARTICIPATION_ANONYMOUS, "Anonymous"),
)

# Backward-compatible aliases for branches that already used ANONYMITY names.
DISCUSSION_ANONYMITY_STANDARD: Final[str] = DISCUSSION_PARTICIPATION_STANDARD
DISCUSSION_ANONYMITY_ANONYMOUS: Final[str] = DISCUSSION_PARTICIPATION_ANONYMOUS
DISCUSSION_ANONYMITY_CHOICES: Final[tuple[tuple[str, str], ...]] = (
    DISCUSSION_PARTICIPATION_CHOICES
)

AUTHOR_VISIBILITY_NEVER: Final[str] = "never"
AUTHOR_VISIBILITY_ADMINS_ONLY: Final[str] = "admins_only"
AUTHOR_VISIBILITY_ALL: Final[str] = "all"

AUTHOR_VISIBILITY_CHOICES: Final[tuple[tuple[str, str], ...]] = (
    (AUTHOR_VISIBILITY_NEVER, "Never"),
    (AUTHOR_VISIBILITY_ADMINS_ONLY, "Admins only"),
    (AUTHOR_VISIBILITY_ALL, "All"),
)

VOTE_VISIBILITY_ALL: Final[str] = "all"
VOTE_VISIBILITY_ADMINS_ONLY: Final[str] = "admins_only"
VOTE_VISIBILITY_SELF_ONLY: Final[str] = "self_only"

VOTE_VISIBILITY_CHOICES: Final[tuple[tuple[str, str], ...]] = (
    (VOTE_VISIBILITY_ALL, "All"),
    (VOTE_VISIBILITY_ADMINS_ONLY, "Admins only"),
    (VOTE_VISIBILITY_SELF_ONLY, "Self only"),
)


# ---------------------------------------------------------------------------
# Future discussion topology settings.
# ---------------------------------------------------------------------------

DISCUSSION_TOPOLOGY_SINGLE_THESIS: Final[str] = "single_thesis"
DISCUSSION_TOPOLOGY_MULTI_THESIS: Final[str] = "multi_thesis"

DISCUSSION_TOPOLOGY_CHOICES: Final[tuple[tuple[str, str], ...]] = (
    (DISCUSSION_TOPOLOGY_SINGLE_THESIS, "Single thesis"),
    (DISCUSSION_TOPOLOGY_MULTI_THESIS, "Multi thesis"),
)


# ---------------------------------------------------------------------------
# Future argument suggestion workflow.
# ---------------------------------------------------------------------------

ARGUMENT_SUGGESTION_PENDING: Final[str] = "pending"
ARGUMENT_SUGGESTION_ACCEPTED: Final[str] = "accepted"
ARGUMENT_SUGGESTION_REJECTED: Final[str] = "rejected"
ARGUMENT_SUGGESTION_REVISION_REQUESTED: Final[str] = "revision_requested"

ARGUMENT_SUGGESTION_STATUS_CHOICES: Final[tuple[tuple[str, str], ...]] = (
    (ARGUMENT_SUGGESTION_PENDING, "Pending"),
    (ARGUMENT_SUGGESTION_ACCEPTED, "Accepted"),
    (ARGUMENT_SUGGESTION_REJECTED, "Rejected"),
    (ARGUMENT_SUGGESTION_REVISION_REQUESTED, "Revision requested"),
)