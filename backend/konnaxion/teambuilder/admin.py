# backend/konnaxion/teambuilder/admin.py
from django.contrib import admin

from .models import (
    BuilderSession,
    Team,
    TeamMember,
    Problem,
    ProblemChangeEvent,
)


class TeamMemberInline(admin.TabularInline):
    model = TeamMember
    extra = 0
    readonly_fields = ["match_reason", "suggested_role"]
    autocomplete_fields = ["user"]


class TeamInline(admin.TabularInline):
    model = Team
    extra = 0
    show_change_link = True
    fields = ["name", "metrics"]
    readonly_fields = ["metrics"]


class ProblemChangeEventInline(admin.TabularInline):
    model = ProblemChangeEvent
    extra = 0
    readonly_fields = ["type", "title", "description", "timestamp", "changed_by"]
    can_delete = False

    def has_add_permission(self, request, obj=None):
        # History entries are created programmatically, not manually
        return False


@admin.register(Problem)
class ProblemAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "status",
        "risk_level",
        "created_by",
        "created_at",
        "session_count",
    ]
    list_filter = ["status", "risk_level", "created_at"]
    search_fields = ["name", "description", "categories", "unesco_codes"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [ProblemChangeEventInline]

    def session_count(self, obj):
        return obj.sessions.count()

    session_count.short_description = "Sessions"


@admin.register(BuilderSession)
class BuilderSessionAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "status",
        "problem",
        "created_by",
        "created_at",
        "candidate_count",
    ]
    list_filter = ["status", "created_at", "problem"]
    search_fields = ["name", "description"]
    readonly_fields = ["created_at", "updated_at"]
    filter_horizontal = ["candidates"]
    autocomplete_fields = ["problem", "created_by"]
    inlines = [TeamInline]

    def candidate_count(self, obj):
        return obj.candidates.count()

    candidate_count.short_description = "Candidates"


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ["name", "session", "member_count", "created_at"]
    list_filter = ["session", "created_at"]
    search_fields = ["name", "session__name"]
    inlines = [TeamMemberInline]

    def member_count(self, obj):
        return obj.members.count()

    member_count.short_description = "Members"


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ["user", "team", "suggested_role"]
    list_filter = ["team__session", "suggested_role"]
    search_fields = ["user__username", "user__email", "team__name"]
    autocomplete_fields = ["user", "team"]


@admin.register(ProblemChangeEvent)
class ProblemChangeEventAdmin(admin.ModelAdmin):
    list_display = ["problem", "type", "title", "timestamp", "changed_by"]
    list_filter = ["type", "timestamp", "problem"]
    search_fields = ["title", "description", "problem__name"]
    readonly_fields = ["timestamp"]
    autocomplete_fields = ["problem", "changed_by"]
