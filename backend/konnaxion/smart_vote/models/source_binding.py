"""Stable mapping from source decision objects to Smart Vote consultations.

Smart Vote owns derived readings; it does not own the source decision object.
This binding gives a consultation an explicit source reference without asking
Ethikos/Konsultations to duplicate or mutate its canonical records.
"""

from django.db import models


class SourceConsultationBinding(models.Model):
    """Bind one canonical source target to one Smart Vote consultation."""

    source_type = models.CharField(max_length=64)
    source_id = models.CharField(max_length=128)
    source_key = models.CharField(max_length=160, blank=True)
    consultation = models.OneToOneField(
        "smart_vote.Consultation",
        on_delete=models.CASCADE,
        related_name="source_binding",
    )
    metadata_json = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "smart_vote_source_binding"
        constraints = [
            models.UniqueConstraint(
                fields=["source_type", "source_id"],
                name="uq_sv_source_binding",
            )
        ]
        indexes = [
            models.Index(
                fields=["source_type", "source_id"],
                name="idx_sv_source_binding",
            )
        ]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.source_type}:{self.source_id} -> {self.consultation_id}"
