# FILE: backend/konnaxion/teambuilder/problem_logic.py
"""
Helper functions for the Team Builder "Problem" domain.

This module centralises reusable logic around:
- Fetching sessions linked to a given Problem
- Fetching change history for a Problem
- Recording change events (created / edited / status changes)
- Computing simple usage statistics

You can call these helpers from views, signals or management commands.
"""

from __future__ import annotations

from typing import Dict, Optional, Union

from django.db.models import QuerySet

from .models import (
    BuilderSession,
    Problem,
    ProblemChangeEvent,
)


# ---------------------------------------------------------------------------
# Query helpers
# ---------------------------------------------------------------------------


def get_problem_sessions(problem: Problem) -> QuerySet[BuilderSession]:
    """
    Return the queryset of BuilderSession instances that reference this Problem.

    Used for:
    - Problem detail "Sessions" tab
    - Usage statistics (usage_count, etc.)
    """
    return (
        BuilderSession.objects.filter(problem=problem)
        .select_related("created_by", "problem")
        .order_by("-created_at")
    )


def get_problem_history(problem: Problem) -> QuerySet[ProblemChangeEvent]:
    """
    Return the queryset of history events for a Problem, newest first.

    Used for:
    - Problem detail "History of changes" timeline.
    """
    return problem.change_events.select_related("changed_by").order_by("-timestamp")


def get_problem_usage_stats(problem: Problem) -> Dict[str, Union[int, float, None]]:
    """
    Compute simple usage statistics for a Problem.

    Currently returns:
        {
            "usage_count": int,
            "average_outcome": Optional[float],
        }

    NOTE:
    - `average_outcome` is returned as None for now, because the backend
      does not yet persist an `outcome_score` on sessions.
    - When you later add such a metric, update this function to compute the
      real average.
    """
    sessions_qs = get_problem_sessions(problem)
    usage_count = sessions_qs.count()

    # Placeholder: no persisted outcome_score yet.
    average_outcome: Optional[float] = None

    return {
        "usage_count": usage_count,
        "average_outcome": average_outcome,
    }


# ---------------------------------------------------------------------------
# Logging helpers (ProblemChangeEvent)
# ---------------------------------------------------------------------------


def log_problem_created(problem: Problem, user) -> ProblemChangeEvent:
    """
    Create a 'CREATED' event for the given Problem.
    """
    return ProblemChangeEvent.objects.create(
        problem=problem,
        type=ProblemChangeEvent.EventType.CREATED,
        title="Problem created",
        description=f"Problem '{problem.name}' was created.",
        changed_by=user,
    )


def log_problem_edited(
    problem: Problem,
    user,
    title: str = "Problem updated",
    description: Optional[str] = None,
) -> ProblemChangeEvent:
    """
    Create a generic 'EDIT' event for the given Problem.

    You can supply a custom title/description when calling this helper
    to make the timeline more informative.
    """
    if description is None:
        description = f"Problem '{problem.name}' was updated."

    return ProblemChangeEvent.objects.create(
        problem=problem,
        type=ProblemChangeEvent.EventType.EDIT,
        title=title,
        description=description,
        changed_by=user,
    )


def log_problem_status_change(
    problem: Problem,
    user,
    old_status: Optional[str],
    new_status: str,
) -> ProblemChangeEvent:
    """
    Create a 'STATUS_CHANGE' event when the Problem's status changes.

    Call this from your update logic after detecting a status transition.
    """
    if old_status == new_status:
        # No-op: don't create redundant events
        return ProblemChangeEvent.objects.create(
            problem=problem,
            type=ProblemChangeEvent.EventType.OTHER,
            title="Status change attempted with same status",
            description=f"Status remained '{new_status}'.",
            changed_by=user,
        )

    title = "Problem status changed"
    description = f"Status changed from '{old_status}' to '{new_status}'."

    return ProblemChangeEvent.objects.create(
        problem=problem,
        type=ProblemChangeEvent.EventType.STATUS_CHANGE,
        title=title,
        description=description,
        changed_by=user,
    )


def log_problem_deleted(problem: Problem, user) -> ProblemChangeEvent:
    """
    Create an 'OTHER' event to note that a Problem is being deleted.

    This is only useful if you keep events around for auditing or if
    deletion is soft-deletion. If you hard-delete both Problem and its
    events, this will not be visible later.
    """
    return ProblemChangeEvent.objects.create(
        problem=problem,
        type=ProblemChangeEvent.EventType.OTHER,
        title="Problem deleted",
        description=f"Problem '{problem.name}' was deleted.",
        changed_by=user,
    )
