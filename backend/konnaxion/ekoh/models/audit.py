"""Context-analysis log & score history."""

from django.db import models

from .scores import UserExpertiseScore


class ContextAnalysisLog(models.Model):
    entity_type = models.CharField(max_length=64)
    entity_id = models.UUIDField()
    field = models.CharField(max_length=64, blank=True)
    input_metadata = models.JSONField(null=True, blank=True)
    adjustments_applied = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "context_analysis_log"
        indexes = [models.Index(fields=["entity_type", "entity_id"])]


class ScoreHistory(models.Model):
    merit_score = models.ForeignKey(UserExpertiseScore, on_delete=models.CASCADE)
    old_value = models.DecimalField(max_digits=12, decimal_places=4)
    new_value = models.DecimalField(max_digits=12, decimal_places=4)
    change_reason = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "score_history"
        indexes = [models.Index(fields=["changed_at"])]
