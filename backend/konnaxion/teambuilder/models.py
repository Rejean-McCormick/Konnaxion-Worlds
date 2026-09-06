# backend/konnaxion/teambuilder/models.py
import uuid

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class Problem(models.Model):
  """
  Reusable problem template that Team Builder sessions can reference.
  Includes risk level, UNESCO codes, categories and recommended modes.
  """

  class Status(models.TextChoices):
    ACTIVE = "ACTIVE", _("Active")
    DRAFT = "DRAFT", _("Draft")
    DEPRECATED = "DEPRECATED", _("Deprecated")

  class RiskLevel(models.TextChoices):
    LOW = "LOW", _("Low")
    MEDIUM = "MEDIUM", _("Medium")
    HIGH = "HIGH", _("High")
    CRITICAL = "CRITICAL", _("Critical")

  id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
  name = models.CharField(_("Problem Name"), max_length=255)
  description = models.TextField(_("Description"), blank=True)

  status = models.CharField(
    max_length=20,
    choices=Status.choices,
    default=Status.DRAFT,
  )

  risk_level = models.CharField(
    max_length=20,
    choices=RiskLevel.choices,
    default=RiskLevel.MEDIUM,
  )

  # Team size guidance for this problem
  min_team_size = models.PositiveIntegerField(
    _("Minimum team size"),
    null=True,
    blank=True,
  )
  max_team_size = models.PositiveIntegerField(
    _("Maximum team size"),
    null=True,
    blank=True,
  )

  # Classification / routing
  unesco_codes = models.JSONField(
    _("UNESCO codes"),
    default=list,
    blank=True,
    help_text=_("List of UNESCO taxonomy codes, e.g. ['13.01', '05.03']."),
  )
  categories = models.JSONField(
    _("Categories"),
    default=list,
    blank=True,
    help_text=_("Additional free-form categories or tags."),
  )

  # Mode presets (e.g. ['Elite', 'Learning'])
  recommended_modes = models.JSONField(
    _("Recommended modes"),
    default=list,
    blank=True,
    help_text=_("Recommended team modes for this problem."),
  )

  facilitator_notes = models.TextField(
    _("Notes for facilitators"),
    blank=True,
  )

  created_by = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name="teambuilder_problems",
  )

  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)

  def __str__(self) -> str:
    return f"{self.name} ({self.get_status_display()})"


class ProblemChangeEvent(models.Model):
  """
  Audit trail / history for changes made to a Problem.
  Used to populate the 'History of changes' timeline.
  """

  class EventType(models.TextChoices):
    STATUS_CHANGE = "STATUS_CHANGE", _("Status change")
    EDIT = "EDIT", _("Edit")
    CREATED = "CREATED", _("Created")
    OTHER = "OTHER", _("Other")

  id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
  problem = models.ForeignKey(
    Problem,
    on_delete=models.CASCADE,
    related_name="change_events",
  )

  type = models.CharField(
    max_length=32,
    choices=EventType.choices,
    default=EventType.OTHER,
  )

  title = models.CharField(max_length=255)
  description = models.TextField(blank=True)

  timestamp = models.DateTimeField(auto_now_add=True)

  changed_by = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name="teambuilder_problem_events",
  )

  def __str__(self) -> str:
    return f"[{self.type}] {self.title} ({self.problem.name})"


class BuilderSession(models.Model):
  """
  Represents a team-building event/session where an admin configures
  parameters to generate teams from a pool of candidates.
  """

  class Status(models.TextChoices):
    DRAFT = "DRAFT", _("Draft")
    PROCESSING = "PROCESSING", _("Processing")
    COMPLETED = "COMPLETED", _("Completed")
    ARCHIVED = "ARCHIVED", _("Archived")

  id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
  name = models.CharField(_("Session Name"), max_length=255)
  description = models.TextField(_("Description"), blank=True)

  # Link to a reusable Problem template (optional)
  problem = models.ForeignKey(
    Problem,
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name="sessions",
  )

  created_by = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.SET_NULL,
    null=True,
    related_name="teambuilder_sessions",
  )

  # The pool of users available to be sorted into teams
  candidates = models.ManyToManyField(
    settings.AUTH_USER_MODEL,
    related_name="teambuilder_candidate_sessions",
    blank=True,
  )

  # Configuration for the algorithm
  # (e.g., {"target_team_size": 4, "diversity_weight": 0.5})
  algorithm_config = models.JSONField(default=dict, blank=True)

  status = models.CharField(
    max_length=20,
    choices=Status.choices,
    default=Status.DRAFT,
  )

  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)

  def __str__(self) -> str:
    return f"{self.name} ({self.status})"


class Team(models.Model):
  """
  A specific group generated within a BuilderSession.
  """

  id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
  session = models.ForeignKey(
    BuilderSession,
    on_delete=models.CASCADE,
    related_name="teams",
  )
  name = models.CharField(_("Team Name"), max_length=255)

  # Stores calculated stats for this specific team
  # (e.g., {"avg_skill": 85, "diversity_score": 0.9})
  metrics = models.JSONField(default=dict, blank=True)

  created_at = models.DateTimeField(auto_now_add=True)

  def __str__(self) -> str:
    return f"{self.name} - {self.session.name}"


class TeamMember(models.Model):
  """
  The assignment of a specific user to a specific team.
  """

  team = models.ForeignKey(
    Team,
    on_delete=models.CASCADE,
    related_name="members",
  )
  user = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name="teambuilder_assignments",
  )

  # Optional: If the algorithm assigns a specific role (e.g., "Leader", "Scribe")
  suggested_role = models.CharField(max_length=100, blank=True)

  # Why this user was placed here (debug/transparency info)
  match_reason = models.TextField(blank=True)

  class Meta:
    unique_together = ["team", "user"]

  def __str__(self) -> str:
    return f"{self.user} in {self.team}"
