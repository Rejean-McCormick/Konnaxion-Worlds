from django.contrib import admin

from konnaxion.ekoh.models.access import (
    RatingAccessGrant,
    RatingAccessScope,
    RatingScopeSubject,
    RatingVisibilitySetting,
)
from konnaxion.ekoh.models.audit import ContextAnalysisLog, ScoreHistory
from konnaxion.ekoh.models.config import ScoreConfiguration
from konnaxion.ekoh.models.privacy import ConfidentialitySetting
from konnaxion.ekoh.models.scores import UserEthicsScore, UserExpertiseScore
from konnaxion.ekoh.models.taxonomy import ExpertiseCategory


@admin.register(ExpertiseCategory)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "depth", "parent")
    list_filter = ("depth",)
    search_fields = ("code", "name")


@admin.register(UserExpertiseScore)
class ExpertiseScoreAdmin(admin.ModelAdmin):
    list_display = ("user", "category", "weighted_score")
    list_filter = ("category",)
    search_fields = ("user__username", "category__code")


@admin.register(UserEthicsScore)
class EthicsAdmin(admin.ModelAdmin):
    list_display = ("user", "ethical_score")


@admin.register(ConfidentialitySetting)
class PrivacyAdmin(admin.ModelAdmin):
    list_display = ("user", "level")
    list_filter = ("level",)


@admin.register(RatingVisibilitySetting)
class RatingVisibilityAdmin(admin.ModelAdmin):
    list_display = ("user", "visibility", "updated_at")
    list_filter = ("visibility",)
    search_fields = ("user__username", "user__email", "publication_basis")


@admin.register(RatingAccessScope)
class RatingAccessScopeAdmin(admin.ModelAdmin):
    list_display = ("key", "name", "scope_type", "parent", "active")
    list_filter = ("scope_type", "active")
    search_fields = ("key", "name", "external_namespace", "external_key")


@admin.register(RatingScopeSubject)
class RatingScopeSubjectAdmin(admin.ModelAdmin):
    list_display = ("user", "scope", "active")
    list_filter = ("active", "scope")
    search_fields = ("user__username", "scope__key", "scope__name")
    autocomplete_fields = ("user", "scope")


@admin.register(RatingAccessGrant)
class RatingAccessGrantAdmin(admin.ModelAdmin):
    list_display = ("viewer", "scope", "access_level", "include_descendants", "active")
    list_filter = ("access_level", "include_descendants", "active")
    search_fields = ("viewer__username", "scope__key", "scope__name")
    autocomplete_fields = ("viewer", "scope")


@admin.register(ContextAnalysisLog)
class AnalysisLogAdmin(admin.ModelAdmin):
    list_display = ("entity_type", "entity_id", "created_at")
    readonly_fields = ("input_metadata", "adjustments_applied")
    list_filter = ("entity_type", "created_at")


@admin.register(ScoreConfiguration)
class ConfigAdmin(admin.ModelAdmin):
    list_display = ("weight_name", "field", "weight_value")
    list_filter = ("field",)
    search_fields = ("weight_name",)


@admin.register(ScoreHistory)
class ScoreHistoryAdmin(admin.ModelAdmin):
    list_display = ("merit_score", "old_value", "new_value", "changed_at")
    readonly_fields = ("merit_score", "old_value", "new_value", "change_reason", "changed_at")
    list_filter = ("changed_at",)
