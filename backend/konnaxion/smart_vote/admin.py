from django.contrib import admin

from konnaxion.smart_vote.models.core import (
    Vote,
    VoteModality,
    VoteResult,
    VoteLedger,
)


@admin.register(VoteModality)
class ModalityAdmin(admin.ModelAdmin):
    list_display = ("name",)


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "target_type", "weighted_value", "created_at")
    list_filter = ("target_type", "modality")
    search_fields = ("user__username", "target_id")


@admin.register(VoteResult)
class VoteResultAdmin(admin.ModelAdmin):
    list_display = ("target_type", "target_id", "sum_weighted_value", "vote_count")


@admin.register(VoteLedger)
class LedgerAdmin(admin.ModelAdmin):
    list_display = ("ledger_id", "vote", "block_height", "logged_at")
    readonly_fields = ("sha256_hash",)
