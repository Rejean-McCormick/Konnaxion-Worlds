"""Single EkoH authority for rating disclosure decisions."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from konnaxion.ekoh.db import ekoh_smartvote_db_scope
from konnaxion.ekoh.models.access import (
    RatingAccessGrant,
    RatingAccessScope,
    RatingScopeSubject,
    RatingVisibilitySetting,
)


@dataclass(frozen=True)
class RatingAccessDecision:
    allowed: bool
    level: str | None
    reason: str
    scope_key: str | None = None
    scope_name: str | None = None

    def as_dict(self) -> dict[str, Any]:
        scope = None
        if self.scope_key or self.scope_name:
            scope = {
                "key": self.scope_key,
                "name": self.scope_name,
            }
        return {
            "allowed": self.allowed,
            "level": self.level,
            "reason": self.reason,
            "scope": scope,
        }


def _visibility_for(subject) -> str:
    # Read the policy from the database instead of the reverse one-to-one
    # attribute. Django can cache ``subject.ekoh_rating_visibility`` on the
    # User instance; if the policy is then changed through another model
    # instance, that cache can be stale for the rest of the request/test.
    # Access control must always evaluate the current persisted policy.
    visibility = (
        RatingVisibilitySetting.objects.filter(user_id=subject.pk)
        .values_list("visibility", flat=True)
        .first()
    )
    if visibility is None:
        # Compatibility rule: before V4.1, readable EkoH profiles exposed their
        # current ratings. Missing policy therefore means public ratings.
        return RatingVisibilitySetting.PUBLIC
    return visibility


def _access_rank(level: str | None) -> int:
    return {
        None: 0,
        RatingAccessGrant.RATINGS: 1,
        RatingAccessGrant.HISTORY: 2,
    }.get(level, 0)


def _scope_is_within(subject_scope: RatingAccessScope, grant_scope: RatingAccessScope) -> bool:
    """Return true when ``subject_scope`` is grant_scope or one of its descendants."""
    current = subject_scope
    seen: set[int] = set()
    while current is not None and current.pk not in seen:
        seen.add(current.pk)
        if current.pk == grant_scope.pk:
            return True
        current = current.parent
    return False


def resolve_rating_access(*, viewer, subject) -> RatingAccessDecision:
    """Resolve the maximum EkoH rating detail visible to ``viewer``.

    Order is intentionally small and deterministic:
    1. subject/self;
    2. Django staff compatibility override;
    3. explicit scope grants (including ancestor grants);
    4. public rating policy;
    5. deny.

    ``private`` is intentionally stricter than ``scoped`` and ignores scope
    grants. A private subject remains visible only to self/staff.
    """

    viewer_is_authenticated = bool(
        viewer is not None and getattr(viewer, "is_authenticated", False)
    )

    if viewer_is_authenticated and viewer.pk == subject.pk:
        return RatingAccessDecision(True, RatingAccessGrant.HISTORY, "self")

    if viewer_is_authenticated and getattr(viewer, "is_staff", False):
        return RatingAccessDecision(True, RatingAccessGrant.HISTORY, "staff")

    with ekoh_smartvote_db_scope():
        visibility = _visibility_for(subject)

        if visibility == RatingVisibilitySetting.PRIVATE:
            return RatingAccessDecision(False, None, "private_policy")

        best: RatingAccessDecision | None = None
        if viewer_is_authenticated:
            subject_scopes = list(
                RatingScopeSubject.objects.select_related("scope", "scope__parent")
                .filter(user_id=subject.pk, active=True, scope__active=True)
                .order_by("scope__key")
            )
            grants = list(
                RatingAccessGrant.objects.select_related("scope")
                .filter(viewer_id=viewer.pk, active=True, scope__active=True)
                .order_by("scope__key")
            )

            for membership in subject_scopes:
                subject_scope = membership.scope
                for grant in grants:
                    applies = subject_scope.pk == grant.scope_id
                    if not applies and grant.include_descendants:
                        applies = _scope_is_within(subject_scope, grant.scope)
                    if not applies:
                        continue

                    candidate = RatingAccessDecision(
                        True,
                        grant.access_level,
                        "scope_grant",
                        scope_key=grant.scope.key,
                        scope_name=grant.scope.name,
                    )
                    if best is None or _access_rank(candidate.level) > _access_rank(best.level):
                        best = candidate

        if best is not None:
            return best

        if visibility == RatingVisibilitySetting.PUBLIC:
            return RatingAccessDecision(True, RatingAccessGrant.RATINGS, "public_policy")

        return RatingAccessDecision(False, None, "outside_authorized_scope")
