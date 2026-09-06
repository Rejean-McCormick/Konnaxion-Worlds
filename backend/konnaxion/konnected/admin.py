# FILE: backend/konnaxion/konnected/admin.py
# backend/konnaxion/konnected/admin.py
from __future__ import annotations

from typing import Sequence

from django.apps import apps
from django.contrib import admin

from .models import (
    CertificationPath,
    CoCreationContribution,
    CoCreationProject,
    Evaluation,
    ForumPost,
    ForumTopic,
    InteropMapping,
    KnowledgeRecommendation,
    KnowledgeResource,
    LearningProgress,
    PeerValidation,
    Portfolio,
)


# ───────── Generic timestamp mixin (created_at / updated_at) ─────────
class TimestampMixin(admin.ModelAdmin):
    """
    Common admin behaviour for TimeStampedModel-based models:
    - expose created_at / updated_at as read-only
    - add them to list_display
    """
    date_hierarchy = "created_at"

    def _time_fields(self) -> set[str]:
        return {"created_at", "updated_at"} & {
            f.name for f in self.model._meta.get_fields()
        }

    def get_readonly_fields(self, request, obj=None) -> Sequence[str]:  # type: ignore[override]
        return (*super().get_readonly_fields(request, obj), *self._time_fields())

    def get_list_display(self, request):  # type: ignore[override]
        cols = list(super().get_list_display(request))
        for f in self._time_fields():
            if f not in cols:
                cols.append(f)
        return tuple(cols)


# ───────── CertifiKation sub-module ─────────
@admin.register(CertificationPath)
class CertificationPathAdmin(TimestampMixin):
    list_display = ("name", "description")
    search_fields = ("name", "description")
    ordering = ("name",)


@admin.register(Evaluation)
class EvaluationAdmin(TimestampMixin):
    list_display = ("user", "path", "raw_score", "created_at")
    list_filter = ("path",)
    search_fields = (
        "user__username",
        "path__name",
    )
    autocomplete_fields = ("user", "path")
    list_select_related = ("user", "path")
    ordering = ("-created_at",)


@admin.register(PeerValidation)
class PeerValidationAdmin(TimestampMixin):
    list_display = ("evaluation", "peer", "decision", "created_at")
    list_filter = ("decision",)
    search_fields = (
        "peer__username",
        "evaluation__id",
        "evaluation__path__name",
    )
    autocomplete_fields = ("evaluation", "peer")
    list_select_related = ("evaluation", "peer")


@admin.register(Portfolio)
class PortfolioAdmin(TimestampMixin):
    list_display = ("title", "user", "items_count", "created_at")
    search_fields = ("title", "user__username")
    autocomplete_fields = ("user",)
    filter_horizontal = ("items",)

    def items_count(self, obj: Portfolio) -> int:
        return obj.items.count()

    items_count.short_description = "Items"  # type: ignore[attr-defined]


@admin.register(InteropMapping)
class InteropMappingAdmin(TimestampMixin):
    list_display = ("local_certification", "external_system", "external_id")
    search_fields = (
        "external_system",
        "external_id",
        "local_certification__name",
    )
    autocomplete_fields = ("local_certification",)
    list_select_related = ("local_certification",)


# ───────── Knowledge sub-module ─────────
@admin.register(KnowledgeResource)
class KnowledgeResourceAdmin(TimestampMixin):
    list_display = ("title", "type", "url", "author", "created_at")
    list_filter = ("type",)
    search_fields = ("title", "url", "author__username")
    autocomplete_fields = ("author",)
    list_select_related = ("author",)


@admin.register(KnowledgeRecommendation)
class KnowledgeRecommendationAdmin(TimestampMixin):
    list_display = ("user", "resource", "recommended_at", "created_at")
    search_fields = ("user__username", "resource__title")
    autocomplete_fields = ("user", "resource")
    list_select_related = ("user", "resource")


@admin.register(LearningProgress)
class LearningProgressAdmin(TimestampMixin):
    list_display = ("user", "resource", "progress_percent", "created_at")
    search_fields = ("user__username", "resource__title")
    autocomplete_fields = ("user", "resource")
    list_select_related = ("user", "resource")


# ───────── Co‑Creation sub-module ─────────
@admin.register(CoCreationProject)
class CoCreationProjectAdmin(TimestampMixin):
    list_display = ("title", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("title",)


@admin.register(CoCreationContribution)
class CoCreationContributionAdmin(TimestampMixin):
    list_display = ("project", "user", "short_content", "created_at")
    search_fields = ("content", "user__username", "project__title")
    autocomplete_fields = ("project", "user")
    list_select_related = ("project", "user")

    def short_content(self, obj: CoCreationContribution) -> str:
        text = obj.content or ""
        return (text[:60] + "…") if len(text) > 60 else text

    short_content.short_description = "Content"  # type: ignore[attr-defined]


# ───────── Forum sub-module ─────────
@admin.register(ForumTopic)
class ForumTopicAdmin(TimestampMixin):
    list_display = ("title", "category", "creator", "created_at")
    list_filter = ("category",)
    search_fields = ("title", "category", "creator__username")
    autocomplete_fields = ("creator",)
    list_select_related = ("creator",)


@admin.register(ForumPost)
class ForumPostAdmin(TimestampMixin):
    list_display = ("topic", "author", "short_content", "created_at")
    search_fields = ("content", "topic__title", "author__username")
    autocomplete_fields = ("topic", "author")
    list_select_related = ("topic", "author")

    def short_content(self, obj: ForumPost) -> str:
        text = obj.content or ""
        return (text[:60] + "…") if len(text) > 60 else text

    short_content.short_description = "Content"  # type: ignore[attr-defined]


# ───────── Fallback auto-registration ─────────
# Ensure any future models in this app still appear in the admin.
cfg = apps.get_app_config("konnected")
for mdl in cfg.get_models():
    if not admin.site.is_registered(mdl):
        admin.site.register(mdl)
