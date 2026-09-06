from __future__ import annotations

from django.conf import settings
from django.db import models


class DemoScenarioImport(models.Model):
    """
    Tracks objects created by the ethiKos Demo Importer.

    This lets reset_scenario delete only records that were imported for a
    specific demo scenario, instead of relying on fragile title/user prefixes.
    """

    OBJECT_TYPE_USER = "user"
    OBJECT_TYPE_CATEGORY = "category"
    OBJECT_TYPE_TOPIC = "topic"
    OBJECT_TYPE_STANCE = "stance"
    OBJECT_TYPE_ARGUMENT = "argument"
    OBJECT_TYPE_CONSULTATION = "consultation"
    OBJECT_TYPE_CONSULTATION_VOTE = "consultation_vote"
    OBJECT_TYPE_CONSULTATION_RESULT = "consultation_result"
    OBJECT_TYPE_IMPACT_ITEM = "impact_item"
    OBJECT_TYPE_EKOH_EXPERTISE_SCORE = "ekoh_expertise_score"
    OBJECT_TYPE_EKOH_ETHICS_SCORE = "ekoh_ethics_score"
    OBJECT_TYPE_SMART_VOTE_SOURCE_BINDING = "smart_vote_source_binding"

    OBJECT_TYPE_CHOICES = [
        (OBJECT_TYPE_USER, "User"),
        (OBJECT_TYPE_CATEGORY, "Ethikos Category"),
        (OBJECT_TYPE_TOPIC, "Ethikos Topic"),
        (OBJECT_TYPE_STANCE, "Ethikos Stance"),
        (OBJECT_TYPE_ARGUMENT, "Ethikos Argument"),
        (OBJECT_TYPE_CONSULTATION, "Consultation"),
        (OBJECT_TYPE_CONSULTATION_VOTE, "Consultation Vote"),
        (OBJECT_TYPE_CONSULTATION_RESULT, "Consultation Result"),
        (OBJECT_TYPE_IMPACT_ITEM, "Impact Item"),
        (OBJECT_TYPE_EKOH_EXPERTISE_SCORE, "EkoH Expertise Score"),
        (OBJECT_TYPE_EKOH_ETHICS_SCORE, "EkoH Ethics Score"),
        (OBJECT_TYPE_SMART_VOTE_SOURCE_BINDING, "Smart Vote Source Binding"),
    ]

    scenario_key = models.CharField(
        max_length=120,
        db_index=True,
        help_text="Stable key from the demo scenario JSON, e.g. public_square_demo.",
    )

    object_type = models.CharField(
        max_length=120,
        choices=OBJECT_TYPE_CHOICES,
        db_index=True,
        help_text=(
            "Type of imported object, e.g. topic, stance, EkoH score, "
            "or Smart Vote source binding."
        ),
    )

    object_id = models.PositiveBigIntegerField(
        db_index=True,
        help_text="Primary key of the imported object.",
    )

    object_label = models.CharField(
        max_length=255,
        blank=True,
        help_text="Human-readable label for debugging and reset reports.",
    )

    source_key = models.CharField(
        max_length=120,
        blank=True,
        db_index=True,
        help_text="Optional JSON object key, e.g. public_square or maya_argument_1.",
    )

    imported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ethikos_demo_imports",
        help_text="Admin user who imported the demo scenario.",
    )

    imported_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
    )

    class Meta:
        verbose_name = "Demo scenario import"
        verbose_name_plural = "Demo scenario imports"
        ordering = ["-imported_at", "scenario_key", "object_type"]

        indexes = [
            models.Index(
                fields=["scenario_key", "object_type"],
                name="eth_demo_scen_type_idx",
            ),
            models.Index(
                fields=["object_type", "object_id"],
                name="eth_demo_obj_idx",
            ),
            models.Index(
                fields=["scenario_key", "source_key"],
                name="eth_demo_source_idx",
            ),
            models.Index(
                fields=["scenario_key", "imported_at"],
                name="eth_demo_time_idx",
            ),
        ]

        constraints = [
            models.UniqueConstraint(
                fields=["scenario_key", "object_type", "object_id"],
                name="uniq_eth_demo_import_obj",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.scenario_key}:{self.object_type}:{self.object_id}"
