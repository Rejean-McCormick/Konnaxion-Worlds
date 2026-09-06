"""Core Smart Vote persistence models."""

from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models


class VoteModality(models.Model):
    """Approval, ranking, rating, preferential, budget_split."""

    APPROVAL = "approval"
    RANKING = "ranking"
    RATING = "rating"
    PREFERENTIAL = "preferential"
    BUDGET = "budget_split"

    id = models.AutoField(primary_key=True)
    name = models.CharField(
        max_length=32,
        unique=True,
        choices=[
            (APPROVAL, "Approval"),
            (RANKING, "Ranking"),
            (RATING, "Rating 1-5"),
            (PREFERENTIAL, "Preferential"),
            (BUDGET, "Budget split"),
        ],
    )
    parameters = models.JSONField(blank=True, null=True)

    class Meta:
        db_table = "vote_modality"

    def __str__(self) -> str:  # pragma: no cover
        return self.name


class Vote(models.Model):
    """One source ballot cast by a user on an arbitrary target."""

    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    target_type = models.CharField(max_length=64)
    target_id = models.UUIDField(default=uuid.uuid4)
    modality = models.ForeignKey(VoteModality, on_delete=models.PROTECT)
    raw_value = models.DecimalField(max_digits=12, decimal_places=4)

    # Legacy compatibility only. New source ballots do not persist a derived
    # Smart Vote reading weight on the source row.
    weighted_value = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "vote"
        # PostgreSQL partitioned uniqueness must include the partition key.
        unique_together = ("user", "target_type", "target_id", "created_at")
        indexes = [
            models.Index(fields=["target_type", "target_id"], name="idx_vote_target")
        ]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.user_id}→{self.target_id} = {self.raw_value}"


class VoteResult(models.Model):
    """Legacy materialized weighted result projection."""

    target_type = models.CharField(max_length=64)
    target_id = models.UUIDField()
    sum_weighted_value = models.DecimalField(max_digits=20, decimal_places=4)
    vote_count = models.IntegerField()

    class Meta:
        db_table = "vote_result"
        unique_together = ("target_type", "target_id")

    def __str__(self):  # pragma: no cover
        return f"{self.target_id} ⟹ {self.sum_weighted_value}"


class VoteLedger(models.Model):
    """Append-only ledger metadata for a vote."""

    ledger_id = models.BigAutoField(primary_key=True)
    # The partitioned physical vote table cannot provide a simple UNIQUE(id)
    # constraint while partitioned by created_at, so this relation is logical.
    vote = models.ForeignKey(
        Vote,
        on_delete=models.CASCADE,
        db_constraint=False,
    )
    sha256_hash = models.BinaryField()
    block_height = models.BigIntegerField(null=True, blank=True)
    logged_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "vote_ledger"
        indexes = [models.Index(fields=["vote_id"], name="idx_ledger_vote")]

    def __str__(self):  # pragma: no cover
        return f"ledger {self.ledger_id} → vote {self.vote_id}"
