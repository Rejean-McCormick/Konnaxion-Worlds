"""LEGACY compatibility models for the former kollective_intelligence bundle.

Canonical ownership has moved:
- EkoH taxonomy, expertise, ethics, privacy and scoring live in `konnaxion.ekoh`.
- Smart Vote consultations, votes and readings live in `konnaxion.smart_vote`.

These models are retained only for migration/backward-compatibility safety.
New code must not import them as the source of truth and must not add new
features here. Remove them only through an explicit migration plan.
"""

# FILE: backend/konnaxion/kollective_intelligence/models.py
from django.conf import settings
from django.db import models
from django.utils import timezone


# ────────────────────────────────
# Ekoh domain
# ────────────────────────────────

class ExpertiseCategory(models.Model):
    """Catalog of knowledge domains."""
    name = models.CharField(max_length=120, unique=True)

    def __str__(self):
        return self.name


class UserExpertiseScore(models.Model):
    """Current domain-specific expertise weight per user."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL,
                             on_delete=models.CASCADE,
                             related_name="kollective_expertise_scores") # Changed related_name
    category = models.ForeignKey(ExpertiseCategory,
                                 on_delete=models.CASCADE,
                                 related_name="user_scores")
    raw_score = models.DecimalField(max_digits=7, decimal_places=3)
    weighted_score = models.DecimalField(max_digits=7, decimal_places=3)

    class Meta:
        unique_together = ("user", "category")
        indexes = [models.Index(fields=["category", "-weighted_score"])]

    def __str__(self):
        return f"{self.user} – {self.category}: {self.weighted_score}"


class UserEthicsScore(models.Model):
    """Ethical multiplier influencing all expertise weights."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL,
                                on_delete=models.CASCADE,
                                primary_key=True,
                                related_name="kollective_userethicsscore") # Changed related_name
    ethical_score = models.DecimalField(max_digits=5, decimal_places=2)

    def __str__(self):
        return f"{self.user}: {self.ethical_score}"


class ScoreConfiguration(models.Model):
    """Stores named weight configurations (global or field-specific)."""
    weight_name = models.CharField(max_length=64)
    weight_value = models.DecimalField(max_digits=6, decimal_places=3)
    field = models.CharField(max_length=64, blank=True, null=True)

    class Meta:
        unique_together = ("weight_name", "field")


class ContextAnalysisLog(models.Model):
    """Legacy analysis log. Canonical AI/context analysis is non-authoritative."""
    entity_type = models.CharField(max_length=40)
    entity_id = models.PositiveBigIntegerField()
    field = models.CharField(max_length=64)
    input_metadata = models.JSONField()
    adjustments_applied = models.JSONField()
    logged_at = models.DateTimeField(default=timezone.now)


class ConfidentialitySetting(models.Model):
    """Per-user anonymity preferences."""
    PUBLIC = "public"
    PSEUDONYM = "pseudonym"
    ANONYMOUS = "anonymous"
    LEVEL_CHOICES = [
        (PUBLIC, "Public"),
        (PSEUDONYM, "Pseudonym"),
        (ANONYMOUS, "Anonymous"),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL,
                                on_delete=models.CASCADE,
                                primary_key=True,
                                related_name="kollective_confidentialitysetting") # Changed related_name
    level = models.CharField(max_length=10, choices=LEVEL_CHOICES,
                             default=PUBLIC)


class ScoreHistory(models.Model):
    """Keeps an audit trail of every score change."""
    merit_score = models.ForeignKey(UserExpertiseScore,
                                    on_delete=models.CASCADE,
                                    related_name="history")
    old_value = models.DecimalField(max_digits=7, decimal_places=3)
    new_value = models.DecimalField(max_digits=7, decimal_places=3)
    change_reason = models.CharField(max_length=255)
    changed_at = models.DateTimeField(default=timezone.now)


# ────────────────────────────────
# Smart Vote domain
# ────────────────────────────────

class Vote(models.Model):
    """Legacy combined vote row. Canonical source ballots and readings are separate."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL,
                             on_delete=models.CASCADE,
                             related_name="kollective_votes") # Changed related_name just in case
    target_type = models.CharField(max_length=40)
    target_id = models.PositiveBigIntegerField()
    raw_value = models.DecimalField(max_digits=6, decimal_places=3)
    weighted_value = models.DecimalField(max_digits=6, decimal_places=3)
    voted_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ("user", "target_type", "target_id")


class VoteModality(models.Model):
    """Parameters for approval / ranking / rating, etc."""
    name = models.CharField(max_length=40, unique=True)
    parameters = models.JSONField()


class EmergingExpert(models.Model):
    """Flags fast-rising contributors."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL,
                             on_delete=models.CASCADE,
                             related_name="kollective_emerging_expert_flags") # Changed related_name
    detection_date = models.DateField(default=timezone.now)
    score_delta = models.DecimalField(max_digits=7, decimal_places=3)


class VoteResult(models.Model):
    """Legacy weighted aggregate; do not treat as a canonical source result."""
    target_type = models.CharField(max_length=40)
    target_id = models.PositiveBigIntegerField()
    sum_weighted_value = models.DecimalField(max_digits=12, decimal_places=3)
    vote_count = models.PositiveIntegerField()

    class Meta:
        unique_together = ("target_type", "target_id")


class IntegrationMapping(models.Model):
    """Links Smart Vote / Ekoh context to other modules' objects."""
    module_name = models.CharField(max_length=40)
    context_type = models.CharField(max_length=40)
    mapping_details = models.JSONField()