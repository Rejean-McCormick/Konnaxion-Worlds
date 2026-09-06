"""Read-only, privacy- and access-aware EkoH profile serializer.

Surfaced by ``GET /api/v1/ekoh/profile/<uid>/``. EkoH exposes its own current
ratings and disclosure decision. It never exposes or computes a global Smart
Vote weight; contextual influence belongs to a declared Smart Vote reading.
"""

from __future__ import annotations

from typing import Any

from django.contrib.auth import get_user_model
from rest_framework import serializers

from konnaxion.ekoh.db import ekoh_smartvote_db_scope
from konnaxion.ekoh.models.access import RatingAccessGrant, RatingVisibilitySetting
from konnaxion.ekoh.models.audit import ScoreHistory
from konnaxion.ekoh.models.privacy import ConfidentialitySetting
from konnaxion.ekoh.models.scores import UserExpertiseScore
from konnaxion.ekoh.services.rating_access import resolve_rating_access

User = get_user_model()


class ExpertiseScoreNested(serializers.Serializer):
    domain_code = serializers.CharField()
    domain_name = serializers.CharField()
    weighted_score = serializers.DecimalField(max_digits=12, decimal_places=4)


class ProfileSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(source="pk")
    display_name = serializers.SerializerMethodField()
    confidentiality_level = serializers.SerializerMethodField()
    rating_visibility = serializers.SerializerMethodField()
    rating_publication_basis = serializers.SerializerMethodField()
    rating_access = serializers.SerializerMethodField()
    ethics_score = serializers.SerializerMethodField()
    expertise = serializers.SerializerMethodField()
    score_history = serializers.SerializerMethodField()

    def _privacy(self, user: User) -> ConfidentialitySetting | None:
        return getattr(user, "confidentialitysetting", None)

    def _rating_visibility(self, user: User) -> RatingVisibilitySetting | None:
        return getattr(user, "ekoh_rating_visibility", None)

    def _access(self, user: User):
        cache = getattr(self, "_rating_access_cache", None)
        if cache is None:
            cache = {}
            self._rating_access_cache = cache
        if user.pk not in cache:
            request = self.context.get("request")
            viewer = getattr(request, "user", None)
            cache[user.pk] = resolve_rating_access(viewer=viewer, subject=user)
        return cache[user.pk]

    def get_confidentiality_level(self, user: User) -> str:
        setting = self._privacy(user)
        return setting.level if setting else ConfidentialitySetting.PUBLIC

    def get_rating_visibility(self, user: User) -> str:
        setting = self._rating_visibility(user)
        return setting.visibility if setting else RatingVisibilitySetting.PUBLIC

    def get_rating_publication_basis(self, user: User) -> str:
        setting = self._rating_visibility(user)
        return setting.publication_basis if setting else ""

    def get_rating_access(self, user: User) -> dict[str, Any]:
        return self._access(user).as_dict()

    def get_display_name(self, user: User) -> str:
        level = self.get_confidentiality_level(user)
        request = self.context.get("request")
        requester = getattr(request, "user", None)
        is_self = bool(
            requester
            and getattr(requester, "is_authenticated", False)
            and requester.pk == user.pk
        )
        is_staff = bool(requester and getattr(requester, "is_staff", False))

        if level == ConfidentialitySetting.ANONYMOUS and not (is_self or is_staff):
            return "Anonymous"
        if level == ConfidentialitySetting.PSEUDONYM and not (is_self or is_staff):
            return user.get_username()

        display_name = (getattr(user, "name", "") or "").strip()
        if display_name:
            return display_name

        full_name = (user.get_full_name() or "").strip()
        if full_name and all(part.casefold() != "none" for part in full_name.split()):
            return full_name

        return user.get_username()

    def get_ethics_score(self, user: User):
        if not self._access(user).allowed:
            return None
        score = getattr(user, "userethicsscore", None)
        return score.ethical_score if score is not None else 1

    def get_expertise(self, user: User) -> list[dict[str, Any]] | None:
        if not self._access(user).allowed:
            return None
        with ekoh_smartvote_db_scope():
            rows = list(
                UserExpertiseScore.objects.select_related("category")
                .filter(user_id=user.pk)
                .order_by("-weighted_score")[:20]
            )
        return [
            {
                "domain_code": row.category.code,
                "domain_name": row.category.name,
                "weighted_score": row.weighted_score,
            }
            for row in rows
        ]

    def get_score_history(self, user: User) -> list[dict[str, Any]] | None:
        decision = self._access(user)
        if not decision.allowed or decision.level != RatingAccessGrant.HISTORY:
            return None
        with ekoh_smartvote_db_scope():
            rows = list(
                ScoreHistory.objects.select_related("merit_score", "merit_score__category")
                .filter(merit_score__user_id=user.pk)
                .order_by("-changed_at")[:50]
            )
        return [
            {
                "domain_code": row.merit_score.category.code,
                "domain_name": row.merit_score.category.name,
                "old_value": row.old_value,
                "new_value": row.new_value,
                "change_reason": row.change_reason,
                "changed_at": row.changed_at,
            }
            for row in rows
        ]

    @classmethod
    def setup_eager_loading(cls, queryset):
        """Fetch one-to-one privacy/rating/ethics records in the same query."""
        return queryset.select_related(
            "confidentialitysetting",
            "ekoh_rating_visibility",
            "userethicsscore",
        )
