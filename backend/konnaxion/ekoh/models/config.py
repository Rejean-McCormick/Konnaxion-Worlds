"""Runtime-tunable coefficients."""

from django.db import models


class ScoreConfiguration(models.Model):
    weight_name = models.CharField(max_length=64)
    weight_value = models.DecimalField(max_digits=6, decimal_places=3)
    field = models.CharField(max_length=64, blank=True)

    class Meta:
        db_table = "score_configuration"
        unique_together = ("weight_name", "field")

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.weight_name}={self.weight_value}"
