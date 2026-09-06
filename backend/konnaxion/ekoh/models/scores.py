"""Per-user merit and ethics scores."""

from django.db import models
from django.conf import settings

from .taxonomy import ExpertiseCategory


class UserExpertiseScore(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    category = models.ForeignKey(ExpertiseCategory, on_delete=models.CASCADE)
    raw_score = models.DecimalField(max_digits=12, decimal_places=4)
    weighted_score = models.DecimalField(max_digits=12, decimal_places=4)

    class Meta:
        db_table = "user_expertise_score"
        unique_together = ("user", "category")
        indexes = [
            models.Index(
                fields=["category", "-weighted_score"],
                name="idx_score_top",
                condition=models.Q(weighted_score__gt=0),
            ),
        ]


class UserEthicsScore(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, primary_key=True, on_delete=models.CASCADE
    )
    ethical_score = models.DecimalField(max_digits=5, decimal_places=3)

    class Meta:
        db_table = "user_ethics_score"
