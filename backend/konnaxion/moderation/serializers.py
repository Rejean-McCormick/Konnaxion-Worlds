# FILE: backend/konnaxion/moderation/serializers.py
# backend/konnaxion/moderation/serializers.py

from __future__ import annotations

from rest_framework import serializers

from .models import AuditLogEntry, ModerationReport


__all__ = [
    "ModerationReportSerializer",
    "ModerationActionSerializer",
    "AuditLogEntrySerializer",
]


class ModerationReportSerializer(serializers.ModelSerializer):
    """
    Serializer used by the admin moderation UIs.

    It exposes both:
      - the original minimal moderation shape used by services/admin.Report
        (id, content, reporter, type, status)
      - richer fields consumed by the newer Ethikos/KonnectED moderation pages.

    The underlying DB model is ModerationReport, but many queue-related
    fields are denormalised on the related ModerationCase and exposed here
    via `source="case.*"`.
    """

    # ------------------------------------------------------------------
    # Legacy Admin UI shape (services/admin.Report)
    # ------------------------------------------------------------------

    # Short preview of the offending content, taken from the ModerationCase.
    content = serializers.CharField(
        source="case.content_preview",
        read_only=True,
    )

    # Primary moderation reason; matches ModerationReason values
    # ("Spam", "Harassment", "Misinformation", …).
    type = serializers.CharField()

    # Queue-level state and severity from the ModerationCase.
    status = serializers.CharField(source="case.status", read_only=True)
    severity = serializers.CharField(source="case.severity", read_only=True)

    # Human-readable relations
    reporter = serializers.StringRelatedField(read_only=True)
    author = serializers.StringRelatedField(source="case.author", read_only=True)

    # High-level identifiers from the ModerationCase
    target_type = serializers.CharField(source="case.target_type", read_only=True)
    target_id = serializers.CharField(source="case.target_id", read_only=True)

    created_at = serializers.DateTimeField(source="case.created_at", read_only=True)
    # Backwards-compatible alias: some code expects `updated_at`; we map it
    # to the last moderation action timestamp on the case.
    updated_at = serializers.DateTimeField(source="case.last_action_at", read_only=True)

    # ------------------------------------------------------------------
    # CamelCase aliases for Ethikos / KonnectED adapters
    # ------------------------------------------------------------------

    targetType = serializers.CharField(source="case.target_type", read_only=True)
    targetId = serializers.CharField(source="case.target_id", read_only=True)

    createdAt = serializers.DateTimeField(source="case.created_at", read_only=True)
    lastActionAt = serializers.DateTimeField(source="case.last_action_at", read_only=True)

    reporterName = serializers.SerializerMethodField()
    authorName = serializers.SerializerMethodField()

    def get_reporterName(self, obj: ModerationReport) -> str:
        """
        Prefer the cached reporter_name if present,
        otherwise derive from the related User.
        """
        if getattr(obj, "reporter_name", ""):
            return obj.reporter_name

        user = getattr(obj, "reporter", None)
        if user is None:
            return ""

        name = getattr(user, "name", None)
        if name:
            return name

        get_username = getattr(user, "get_username", None)
        if callable(get_username):
            return get_username() or str(user)

        return str(user)

    def get_authorName(self, obj: ModerationReport) -> str:
        """
        Prefer the cached author_name on the ModerationCase if present,
        otherwise derive from the related author User.
        """
        case = getattr(obj, "case", None)
        if case is None:
            return ""

        if getattr(case, "author_name", ""):
            return case.author_name

        user = getattr(case, "author", None)
        if user is None:
            return ""

        name = getattr(user, "name", None)
        if name:
            return name

        get_username = getattr(user, "get_username", None)
        if callable(get_username):
            return get_username() or str(user)

        return str(user)


class ModerationActionSerializer(serializers.Serializer):
    """
    Payload used by POST admin/moderation/{id}/ from the frontend.

    Field:
        remove: if true, the offending content is removed and the report is
                marked as resolved; if false, the content is approved and
                the report is simply resolved.
    """

    remove = serializers.BooleanField()


class AuditLogEntrySerializer(serializers.ModelSerializer):
    """
    Serializer for the canonical audit-log row shape consumed by
    services/audit.ts (LogRow).
    """

    # Frontend expects `entityId`; the model stores `entity_id`.
    entityId = serializers.CharField(source="entity_id", read_only=True)

    class Meta:
        model = AuditLogEntry
        fields = (
            "id",
            "ts",
            "actor",
            "action",
            "target",
            "severity",
            "entity",
            "entityId",
            "ip",
            "status",
            "meta",
        )
        read_only_fields = fields
