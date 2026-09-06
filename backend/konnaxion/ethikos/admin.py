# FILE: backend/konnaxion/ethikos/admin.py
# konnaxion/ethikos/admin.py
from __future__ import annotations

from typing import Sequence

from django.apps import apps
from django.contrib import admin
from django.db import models
from django.db.models import QuerySet
from django.http import HttpRequest
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from .models import (
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


# ───────── Shared helpers ─────────

def _model_field_names(model: type[models.Model]) -> set[str]:
    return {field.name for field in model._meta.get_fields()}


def _existing_fields(
    model: type[models.Model],
    fields: Sequence[str],
) -> tuple[str, ...]:
    names = _model_field_names(model)
    return tuple(field for field in fields if field in names)


def _short_text(value: str | None, limit: int = 60) -> str:
    text = value or ""
    return (text[:limit] + "…") if len(text) > limit else text


# ───────── Mix-in to show created/updated columns ─────────

class TimestampMixin(admin.ModelAdmin):
    date_hierarchy = "created_at"

    def _time_fields(self) -> tuple[str, ...]:
        return _existing_fields(self.model, ("created_at", "updated_at"))

    def get_readonly_fields(
        self,
        request: HttpRequest,
        obj=None,
    ) -> Sequence[str]:
        return (*super().get_readonly_fields(request, obj), *self._time_fields())

    def get_list_display(self, request: HttpRequest) -> tuple[str, ...]:
        cols = list(super().get_list_display(request))

        for field in self._time_fields():
            if field not in cols:
                cols.append(field)

        return tuple(cols)


# ───────── Generic fallback for future additive ethiKos models ─────────

class KintsugiFallbackAdmin(admin.ModelAdmin):
    """
    Safe fallback admin for additive Wave 1 models.

    This keeps future slice-created models visible in Django admin without
    requiring each branch to edit this file immediately. Explicit admin classes
    should still be added for important models once their slice stabilizes.
    """

    list_per_page = 30

    def get_date_hierarchy(self, request: HttpRequest) -> str | None:
        fields = _model_field_names(self.model)

        if "created_at" in fields:
            return "created_at"
        if "updated_at" in fields:
            return "updated_at"

        return None

    def get_readonly_fields(
        self,
        request: HttpRequest,
        obj=None,
    ) -> Sequence[str]:
        readonly = tuple(super().get_readonly_fields(request, obj))
        return (*readonly, *_existing_fields(self.model, ("created_at", "updated_at")))

    def get_list_display(self, request: HttpRequest) -> tuple[str, ...]:
        preferred = (
            "id",
            "name",
            "title",
            "topic",
            "argument",
            "user",
            "status",
            "visibility",
            "role",
            "side",
            "is_hidden",
            "is_removed",
            "created_at",
            "updated_at",
        )
        fields = _existing_fields(self.model, preferred)

        return fields or ("__str__",)

    def get_search_fields(self, request: HttpRequest) -> tuple[str, ...]:
        preferred = (
            "name",
            "title",
            "content",
            "description",
            "url",
            "citation_text",
            "quote",
            "note",
            "user__username",
            "user__email",
            "created_by__username",
            "created_by__email",
            "topic__title",
            "argument__content",
        )
        return _existing_fields(self.model, preferred)

    def get_list_filter(self, request: HttpRequest) -> tuple[str, ...]:
        preferred = (
            "status",
            "visibility",
            "role",
            "side",
            "is_hidden",
            "is_removed",
            "participation_type",
            "author_visibility",
            "vote_visibility",
            "created_at",
            "updated_at",
        )
        return _existing_fields(self.model, preferred)


# ───────── Category ─────────

@admin.register(EthikosCategory)
class EthikosCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "description")
    search_fields = ("name", "description")
    ordering = ("name",)
    list_per_page = 30


# ───────── Topic ─────────

@admin.register(EthikosTopic)
class EthikosTopicAdmin(TimestampMixin):
    list_display = (
        "title",
        "category",
        "expertise_category",
        "status_badge",
        "total_votes",
        "created_by",
        "last_activity",
    )
    list_filter = ("status", "category", "expertise_category")
    search_fields = (
        "title",
        "description",
        "category__name",
        "created_by__username",
        "created_by__email",
    )
    autocomplete_fields = ("category", "expertise_category", "created_by")
    list_select_related = ("category", "expertise_category", "created_by")
    ordering = ("-created_at",)
    list_per_page = 30

    @admin.display(description=_("status"), ordering="status")
    def status_badge(self, obj: EthikosTopic) -> str:
        colour = {
            EthikosTopic.OPEN: "green",
            EthikosTopic.CLOSED: "red",
            EthikosTopic.ARCHIVED: "grey",
        }.get(obj.status, "black")

        return format_html(
            '<span style="color:{};font-weight:600;">{}</span>',
            colour,
            obj.get_status_display(),
        )

    def get_queryset(self, request: HttpRequest) -> QuerySet[EthikosTopic]:
        return (
            super()
            .get_queryset(request)
            .select_related("category", "expertise_category", "created_by")
        )


# ───────── Stance ─────────

@admin.register(EthikosStance)
class EthikosStanceAdmin(admin.ModelAdmin):
    list_display = ("user", "topic", "value_badge", "timestamp")
    list_filter = ("value", "timestamp")
    search_fields = (
        "user__username",
        "user__email",
        "topic__title",
    )
    autocomplete_fields = ("user", "topic")
    list_select_related = ("user", "topic")
    ordering = ("-timestamp",)
    list_per_page = 30

    @admin.display(description=_("value"), ordering="value")
    def value_badge(self, obj: EthikosStance) -> str:
        if obj.value > 0:
            colour = "green"
        elif obj.value < 0:
            colour = "red"
        else:
            colour = "grey"

        return format_html(
            '<span style="color:{};font-weight:600;">{}</span>',
            colour,
            obj.value,
        )

    def get_queryset(self, request: HttpRequest) -> QuerySet[EthikosStance]:
        return super().get_queryset(request).select_related("user", "topic")


# ───────── Argument ─────────

@admin.register(EthikosArgument)
class EthikosArgumentAdmin(TimestampMixin):
    list_display = (
        "short_content",
        "topic",
        "user",
        "side_badge",
        "parent",
        "is_hidden",
    )
    list_filter = ("side", "is_hidden", "created_at", "updated_at")
    search_fields = (
        "content",
        "user__username",
        "user__email",
        "topic__title",
        "parent__content",
    )
    autocomplete_fields = ("topic", "user", "parent")
    list_select_related = ("topic", "user", "parent")
    ordering = ("-created_at",)
    list_per_page = 30

    @admin.display(description=_("content"), ordering="content")
    def short_content(self, obj: EthikosArgument) -> str:
        return _short_text(obj.content)

    @admin.display(description=_("side"), ordering="side")
    def side_badge(self, obj: EthikosArgument) -> str:
        if obj.side == EthikosArgument.PRO:
            colour = "green"
            label = _("pro")
        elif obj.side == EthikosArgument.CON:
            colour = "red"
            label = _("con")
        else:
            colour = "grey"
            label = _("neutral")

        return format_html(
            '<span style="color:{};font-weight:600;">{}</span>',
            colour,
            label,
        )

    def get_queryset(self, request: HttpRequest) -> QuerySet[EthikosArgument]:
        return (
            super()
            .get_queryset(request)
            .select_related("topic", "user", "parent")
        )


# ───────── Korum / Argument source ─────────

@admin.register(ArgumentSource)
class ArgumentSourceAdmin(TimestampMixin):
    list_display = (
        "short_source",
        "argument",
        "created_by",
        "source_type",
        "is_removed",
    )
    list_filter = ("source_type", "is_removed", "created_at", "updated_at")
    search_fields = (
        "url",
        "title",
        "excerpt",
        "citation_text",
        "quote",
        "note",
        "argument__content",
        "argument__topic__title",
        "created_by__username",
        "created_by__email",
    )
    autocomplete_fields = ("argument", "created_by")
    list_select_related = ("argument", "argument__topic", "created_by")
    ordering = ("-created_at",)
    list_per_page = 30

    @admin.display(description=_("source"), ordering="title")
    def short_source(self, obj: ArgumentSource) -> str:
        return _short_text(obj.title or obj.url or obj.citation_text or obj.quote)

    def get_queryset(self, request: HttpRequest) -> QuerySet[ArgumentSource]:
        return (
            super()
            .get_queryset(request)
            .select_related("argument", "argument__topic", "created_by")
        )


# ───────── Korum / Argument impact vote ─────────

@admin.register(ArgumentImpactVote)
class ArgumentImpactVoteAdmin(TimestampMixin):
    list_display = (
        "argument",
        "user",
        "value_badge",
    )
    list_filter = ("value", "created_at", "updated_at")
    search_fields = (
        "argument__content",
        "argument__topic__title",
        "user__username",
        "user__email",
    )
    autocomplete_fields = ("argument", "user")
    list_select_related = ("argument", "argument__topic", "user")
    ordering = ("-updated_at", "-created_at")
    list_per_page = 30

    @admin.display(description=_("impact"), ordering="value")
    def value_badge(self, obj: ArgumentImpactVote) -> str:
        colour = {
            0: "grey",
            1: "grey",
            2: "black",
            3: "green",
            4: "green",
        }.get(obj.value, "black")

        return format_html(
            '<span style="color:{};font-weight:600;">{}</span>',
            colour,
            obj.value,
        )

    def get_queryset(self, request: HttpRequest) -> QuerySet[ArgumentImpactVote]:
        return (
            super()
            .get_queryset(request)
            .select_related("argument", "argument__topic", "user")
        )


# ───────── Korum / Argument suggestion ─────────

@admin.register(ArgumentSuggestion)
class ArgumentSuggestionAdmin(TimestampMixin):
    list_display = (
        "short_content",
        "topic",
        "created_by",
        "side_badge",
        "status_badge",
        "accepted_argument",
        "reviewed_by",
    )
    list_filter = ("status", "side", "created_at", "updated_at", "reviewed_at")
    search_fields = (
        "content",
        "topic__title",
        "parent__content",
        "accepted_argument__content",
        "created_by__username",
        "created_by__email",
        "reviewed_by__username",
        "reviewed_by__email",
    )
    autocomplete_fields = (
        "topic",
        "parent",
        "accepted_argument",
        "created_by",
        "reviewed_by",
    )
    list_select_related = (
        "topic",
        "parent",
        "accepted_argument",
        "created_by",
        "reviewed_by",
    )
    ordering = ("-created_at",)
    list_per_page = 30

    @admin.display(description=_("content"), ordering="content")
    def short_content(self, obj: ArgumentSuggestion) -> str:
        return _short_text(obj.content)

    @admin.display(description=_("side"), ordering="side")
    def side_badge(self, obj: ArgumentSuggestion) -> str:
        if obj.side == EthikosArgument.PRO:
            colour = "green"
            label = _("pro")
        elif obj.side == EthikosArgument.CON:
            colour = "red"
            label = _("con")
        else:
            colour = "grey"
            label = _("neutral")

        return format_html(
            '<span style="color:{};font-weight:600;">{}</span>',
            colour,
            label,
        )

    @admin.display(description=_("status"), ordering="status")
    def status_badge(self, obj: ArgumentSuggestion) -> str:
        colour = {
            "pending": "grey",
            "accepted": "green",
            "rejected": "red",
            "revision_requested": "orange",
        }.get(obj.status, "black")

        return format_html(
            '<span style="color:{};font-weight:600;">{}</span>',
            colour,
            obj.get_status_display(),
        )

    def get_queryset(self, request: HttpRequest) -> QuerySet[ArgumentSuggestion]:
        return (
            super()
            .get_queryset(request)
            .select_related(
                "topic",
                "parent",
                "accepted_argument",
                "created_by",
                "reviewed_by",
            )
        )


# ───────── Korum / Discussion participant role ─────────

@admin.register(DiscussionParticipantRole)
class DiscussionParticipantRoleAdmin(TimestampMixin):
    list_display = (
        "topic",
        "user",
        "role_badge",
        "assigned_by",
    )
    list_filter = ("role", "created_at", "updated_at")
    search_fields = (
        "topic__title",
        "user__username",
        "user__email",
        "assigned_by__username",
        "assigned_by__email",
    )
    autocomplete_fields = ("topic", "user", "assigned_by")
    list_select_related = ("topic", "user", "assigned_by")
    ordering = ("topic", "user")
    list_per_page = 30

    @admin.display(description=_("role"), ordering="role")
    def role_badge(self, obj: DiscussionParticipantRole) -> str:
        colour = {
            "owner": "purple",
            "admin": "red",
            "editor": "blue",
            "writer": "green",
            "suggester": "orange",
            "viewer": "grey",
        }.get(obj.role, "black")

        return format_html(
            '<span style="color:{};font-weight:600;">{}</span>',
            colour,
            obj.get_role_display(),
        )

    def get_queryset(self, request: HttpRequest) -> QuerySet[DiscussionParticipantRole]:
        return (
            super()
            .get_queryset(request)
            .select_related("topic", "user", "assigned_by")
        )


# ───────── Korum / Discussion visibility settings ─────────

@admin.register(DiscussionVisibilitySetting)
class DiscussionVisibilitySettingAdmin(TimestampMixin):
    list_display = (
        "topic",
        "participation_type",
        "author_visibility",
        "vote_visibility",
        "changed_by",
    )
    list_filter = (
        "participation_type",
        "author_visibility",
        "vote_visibility",
        "created_at",
        "updated_at",
    )
    search_fields = (
        "topic__title",
        "changed_by__username",
        "changed_by__email",
    )
    autocomplete_fields = ("topic", "changed_by")
    list_select_related = ("topic", "changed_by")
    ordering = ("topic",)
    list_per_page = 30

    def get_queryset(
        self,
        request: HttpRequest,
    ) -> QuerySet[DiscussionVisibilitySetting]:
        return super().get_queryset(request).select_related("topic", "changed_by")


# ───────── Fallback auto-registration ─────────

cfg = apps.get_app_config("ethikos")

for model in cfg.get_models():
    if not admin.site.is_registered(model):
        admin.site.register(model, KintsugiFallbackAdmin)