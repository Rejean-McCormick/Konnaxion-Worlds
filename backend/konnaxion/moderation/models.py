# FILE: backend/konnaxion/moderation/models.py
# backend/konnaxion/moderation/models.py
from __future__ import annotations

from typing import Any

from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.translation import gettext_lazy as _


# ---------------------------------------------------------------------------
#  Enumerations
# ---------------------------------------------------------------------------


class ModerationTargetType(models.TextChoices):
    TOPIC = "topic", _("Topic")
    POST = "post", _("Post / argument")
    USER = "user", _("User")
    OTHER = "other", _("Other")


class ModerationStatus(models.TextChoices):
    # Values match what the Ethikos admin UI expects from the API
    PENDING = "Pending", _("Pending")
    RESOLVED = "Resolved", _("Resolved")
    ESCALATED = "Escalated", _("Escalated")


class ModerationSeverity(models.TextChoices):
    LOW = "low", _("Low")
    MEDIUM = "medium", _("Medium")
    HIGH = "high", _("High")


class ModerationReason(models.TextChoices):
    # Values match admin.services.Report["type"]
    SPAM = "Spam", _("Spam")
    HARASSMENT = "Harassment", _("Harassment")
    MISINFORMATION = "Misinformation", _("Misinformation")
    OTHER = "Other", _("Other")


class ModerationActionType(models.TextChoices):
    APPROVE = "approve", _("Approve content")
    REMOVE = "remove", _("Remove content")
    ESCALATE = "escalate", _("Escalate / flag")
    IGNORE = "ignore", _("Ignore / keep pending")


class AuditSeverity(models.TextChoices):
    # Matches services/audit.LogRow["severity"]
    INFO = "info", _("Info")
    WARN = "warn", _("Warning")
    CRITICAL = "critical", _("Critical")


class AuditStatus(models.TextChoices):
    # Matches services/audit.LogRow["status"]
    OK = "ok", _("OK")
    WARN = "warn", _("Warning")
    ERROR = "error", _("Error")


# ---------------------------------------------------------------------------
#  Moderation models
# ---------------------------------------------------------------------------


class ModerationCase(models.Model):
    """
    Canonical moderation queue entry, independent from the source system.

    This aggregates one or more user reports for the same target object.
    It is what you typically expose to `/admin/moderation` and adapt into
    the Ethikos moderation queue shape on the API layer.
    """

    # Optional generic relation to the moderated object (topic, argument, user, etc.)
    target_content_type = models.ForeignKey(
        ContentType,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="moderation_cases",
    )
    target_object_id = models.CharField(
        max_length=64,
        blank=True,
        help_text=_("Primary key of the moderated object, stored as text."),
    )
    target_object = GenericForeignKey("target_content_type", "target_object_id")

    # Loose target type/id mirrors what the frontend expects
    target_type = models.CharField(
        max_length=16,
        choices=ModerationTargetType.choices,
        default=ModerationTargetType.POST,
        help_text=_("High-level target bucket for the queue UI."),
    )
    target_id = models.CharField(
        max_length=64,
        blank=True,
        help_text=_("External target identifier used by the frontend."),
    )

    # Cached, human-readable context for display
    context_title = models.CharField(
        max_length=255,
        blank=True,
        help_text=_("Title or short label providing context in the queue."),
    )
    content_preview = models.TextField(
        blank=True,
        help_text=_("Short excerpt of the offending content, for quick triage."),
    )
    author_name = models.CharField(
        max_length=255,
        blank=True,
        help_text=_("Cached name of the content author."),
    )
    author_id = models.CharField(
        max_length=64,
        blank=True,
        help_text=_("External identifier of the content author."),
    )

    # Aggregated signal
    report_count = models.PositiveIntegerField(
        default=0,
        help_text=_("Number of individual reports associated with this case."),
    )

    status = models.CharField(
        max_length=16,
        choices=ModerationStatus.choices,
        default=ModerationStatus.PENDING,
        db_index=True,
    )
    severity = models.CharField(
        max_length=16,
        choices=ModerationSeverity.choices,
        default=ModerationSeverity.MEDIUM,
        db_index=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    last_action_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_("Timestamp of the last moderation action."),
    )

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=("status", "severity")),
            models.Index(fields=("target_type", "target_id")),
            models.Index(fields=("created_at",)),
        ]
        verbose_name = _("Moderation case")
        verbose_name_plural = _("Moderation cases")

    def __str__(self) -> str:
        return f"Case #{self.pk} ({self.get_status_display()})"

    def recalculate_report_count(self, *, commit: bool = True) -> int:
        """
        Recompute `report_count` from the related ModerationReport rows.
        Call this from admin actions or signals if you change reports in bulk.
        """
        count = self.reports.count()
        self.report_count = count
        if commit:
            self.save(update_fields=["report_count"])
        return count


class ModerationReport(models.Model):
    """
    Individual user report that feeds a ModerationCase.

    This is the canonical storage for `/report` endpoints from any module
    (Ethikos debates, consultations, project messages, …).
    """

    case = models.ForeignKey(
        ModerationCase,
        on_delete=models.CASCADE,
        related_name="reports",
    )

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="moderation_reports",
    )
    reporter_name = models.CharField(
        max_length=255,
        blank=True,
        help_text=_("Cached reporter label for admin views."),
    )

    type = models.CharField(
        max_length=32,
        choices=ModerationReason.choices,
        default=ModerationReason.SPAM,
        help_text=_("Primary moderation reason label."),
    )
    message = models.TextField(
        blank=True,
        help_text=_("Optional free-text notes supplied by the reporter."),
    )

    meta = models.JSONField(
        blank=True,
        default=dict,
        help_text=_("Arbitrary JSON payload with source-specific details."),
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text=_("Source IP address of the reporter, if tracked."),
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=("type",)),
            models.Index(fields=("created_at",)),
        ]
        verbose_name = _("Moderation report")
        verbose_name_plural = _("Moderation reports")

    def __str__(self) -> str:
        return f"{self.get_type_display()} on case #{self.case_id}"


class ModerationAction(models.Model):
    """
    Moderator decision attached to a ModerationCase.

    You can use this to drive the queue (approve/remove/escalate) and
    optionally link it to an AuditLogEntry for full traceability.
    """

    case = models.ForeignKey(
        ModerationCase,
        on_delete=models.CASCADE,
        related_name="actions",
    )
    moderator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="moderation_actions",
    )
    action = models.CharField(
        max_length=16,
        choices=ModerationActionType.choices,
    )
    notes = models.TextField(
        blank=True,
        help_text=_("Optional internal notes from the moderator."),
    )
    created_at = models.DateTimeField(auto_now_add=True)

    audit_entry = models.ForeignKey(
        "AuditLogEntry",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="moderation_actions",
        help_text=_("Optional link to the audit log entry for this decision."),
    )

    class Meta:
        ordering = ("-created_at",)
        verbose_name = _("Moderation action")
        verbose_name_plural = _("Moderation actions")

    def __str__(self) -> str:
        return f"{self.get_action_display()} on case #{self.case_id}"


# ---------------------------------------------------------------------------
#  Audit log model
# ---------------------------------------------------------------------------


class AuditLogEntry(models.Model):
    """
    Canonical audit log entry used by Ethikos admin and other apps.

    It is intentionally aligned with `services/audit.ts`'s `LogRow`:
      - `id`       → primary key
      - `ts`       → timestamp
      - `actor`    → denormalised actor label
      - `action`   → logical action identifier
      - `target`   → human-readable context
      - `severity` → 'info' | 'warn' | 'critical'
      - `entity`   → machine entity type (topic, argument, user, …)
      - `entityId` → comes from `entity_id` here
      - `ip`       → source IP
      - `status`   → 'ok' | 'warn' | 'error'
      - `meta`     → JSON blob
    """

    ts = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text=_("Timestamp when the event occurred."),
    )

    # Optional structured link to the actor
    actor_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_entries",
        help_text=_("Optional link to the user that triggered the event."),
    )
    actor = models.CharField(
        max_length=255,
        blank=True,
        help_text=_("Denormalized actor label exposed in the API."),
    )

    action = models.CharField(
        max_length=128,
        help_text=_("Logical action identifier, e.g. 'UPDATE_TOPIC'."),
    )
    target = models.CharField(
        max_length=255,
        blank=True,
        help_text=_("Human-readable target used in the admin UI."),
    )

    entity = models.CharField(
        max_length=64,
        blank=True,
        help_text=_("Machine-oriented entity type, e.g. 'topic', 'argument', 'user'."),
    )
    entity_id = models.CharField(
        max_length=64,
        blank=True,
        help_text=_("Primary key of the entity in the source system, stored as text."),
    )

    severity = models.CharField(
        max_length=10,
        choices=AuditSeverity.choices,
        default=AuditSeverity.INFO,
        db_index=True,
    )
    status = models.CharField(
        max_length=10,
        choices=AuditStatus.choices,
        default=AuditStatus.OK,
        db_index=True,
    )
    ip = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text=_("Source IP address, if available."),
    )
    meta = models.JSONField(
        blank=True,
        default=dict,
        help_text=_("Free-form JSON payload with extra context for the event."),
    )

    class Meta:
        ordering = ("-ts",)
        indexes = [
            models.Index(fields=("ts",)),
            models.Index(fields=("severity",)),
            models.Index(fields=("status",)),
            models.Index(fields=("entity", "entity_id")),
        ]
        verbose_name = _("Audit log entry")
        verbose_name_plural = _("Audit log entries")

    def __str__(self) -> str:
        return f"{self.ts.isoformat()} {self.action}"

    def save(self, *args: Any, **kwargs: Any) -> None:
        """
        Ensure `actor` is filled when a structured `actor_user` exists.
        """
        if self.actor_user and not self.actor:
            # Prefer get_username() when available
            get_username = getattr(self.actor_user, "get_username", None)
            self.actor = get_username() if callable(get_username) else str(self.actor_user)
        super().save(*args, **kwargs)

    @classmethod
    def log(
        cls,
        *,
        actor_user: Any | None = None,
        actor: str | None = None,
        action: str,
        target: str | None = None,
        entity: str | None = None,
        entity_id: str | int | None = None,
        severity: AuditSeverity | str = AuditSeverity.INFO,
        status: AuditStatus | str = AuditStatus.OK,
        ip: str | None = None,
        meta: dict[str, Any] | None = None,
    ) -> "AuditLogEntry":
        """
        Convenience helper to create an audit entry from application code.

        Example::

            AuditLogEntry.log(
                actor_user=request.user,
                action="UPDATE_TOPIC",
                target=topic.title,
                entity="topic",
                entity_id=topic.pk,
                severity=AuditSeverity.INFO,
                status=AuditStatus.OK,
                meta={"topic_id": topic.pk},
            )
        """
        if entity_id is not None and not isinstance(entity_id, str):
            entity_id = str(entity_id)

        entry = cls(
            actor_user=actor_user,
            actor=actor or "",
            action=action,
            target=target or "",
            entity=entity or "",
            entity_id=entity_id or "",
            severity=severity,
            status=status,
            ip=ip,
            meta=meta or {},
        )
        entry.save()
        return entry

