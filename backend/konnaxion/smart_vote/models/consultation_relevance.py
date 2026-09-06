# FILE: backend/konnaxion/smart_vote/models/consultation_relevance.py
from decimal import Decimal
from django.db import models

class ConsultationRelevance(models.Model):
    """
    Linking table defining how relevant a specific Expertise Category is
    to a specific Consultation. Used for weighting votes.
    """
    consultation = models.ForeignKey(
        "smart_vote.Consultation",
        on_delete=models.CASCADE,
    )
    category = models.ForeignKey(
        "ekoh.ExpertiseCategory",
        on_delete=models.CASCADE,
    )
    weight = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        default=Decimal("0.0"),
    )
    criteria_json = models.JSONField(null=True, blank=True)

    class Meta:
        db_table = "consultation_relevance"
        unique_together = ("consultation", "category")
        indexes = [
            models.Index(
                fields=["consultation"],
                name="idx_consult_relevance",
            )
        ]

    def __str__(self):
        return f"{self.consultation} - {self.category} ({self.weight})"