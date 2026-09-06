# backend/konnaxion/moderation/api_views.py
"""
REST API for moderation, role toggles and audit-log admin endpoints.

This module exposes the following endpoints (to be wired in ``konnaxion/urls.py``):

    GET   /api/admin/moderation
    POST  /api/admin/moderation/<id>
    GET   /api/admin/roles
    PATCH /api/admin/roles/<id>
    GET   /api/admin/audit/logs

They are consumed by:

  - services/admin.fetchModerationQueue
  - services/admin.actOnReport
  - services/admin.fetchRoles
  - services/admin.toggleRole
  - services/audit.fetchAuditLogs
  - the Ethikos / KonnectED admin moderation, roles & audit UIs.
"""

from __future__ import annotations

from typing import Any

from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework import serializers as drf_serializers
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AuditLogEntry, ModerationReport
from .serializers import ModerationReportSerializer, AuditLogEntrySerializer


# ---------------------------------------------------------------------------
# Permission used by all admin endpoints in this module
# ---------------------------------------------------------------------------


class IsModerationAdmin(permissions.BasePermission):
    """
    Permission class for moderation, roles and audit endpoints.

    Default behaviour:
      - requires an authenticated user
      - and user.is_staff or user.is_superuser

    If you later introduce a dedicated "moderator" role or group,
    you can extend ``has_permission`` accordingly (e.g. check groups).
    """

    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        user = request.user
        if not user or not user.is_authenticated:
            return False
        # Keep it simple and predictable: staff/superusers only by default
        return bool(getattr(user, "is_staff", False) or getattr(user, "is_superuser", False))


# ---------------------------------------------------------------------------
# Moderation queue API
# ---------------------------------------------------------------------------


class ModerationQueueView(generics.ListAPIView):
    """
    GET /admin/moderation

    Returns the global moderation queue used by several frontends.

    Response shape is intentionally simple and stable::

        {
            "items": [
                {
                    "id": "...",
                    "content": "...",
                    "reporter": "...",
                    "type": "Spam" | "Harassment" | "Misinformation",
                    "status": "Pending" | "Resolved" | "Escalated",
                    ...  # optional richer fields
                },
                ...
            ]
        }

    The serializer can expose additional fields (targetType, targetId,
    severity, timestamps, etc.). Frontends are defensive and will
    gracefully consume whatever superset you provide.
    """

    serializer_class = ModerationReportSerializer
    permission_classes = [IsModerationAdmin]
    pagination_class = None  # return full queue, not paginated

    def get_queryset(self):
        qs = ModerationReport.objects.all()

        # Optional status filter: /admin/moderation?status=Pending
        status_param = self.request.query_params.get("status")
        if status_param and any(f.name == "status" for f in ModerationReport._meta.fields):
            qs = qs.filter(status=status_param)

        # Prefer created_at ordering if the field exists
        if any(f.name == "created_at" for f in ModerationReport._meta.fields):
            qs = qs.order_by("-created_at")
        else:
            qs = qs.order_by("-pk")

        return qs

    def list(self, request, *args, **kwargs) -> Response:  # type: ignore[override]
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        # Wrap into {items: [...]} to match services/admin.ModerationPayload
        return Response({"items": serializer.data})


class ModerationDecisionView(APIView):
    """
    POST /admin/moderation/<id>

    Body::

        { "remove": true | false }

    Semantics:
      - remove = true  → content should be removed/hidden, report resolved
      - remove = false → content is approved/kept, report resolved

    Frontends do not rely on a particular response body; a 2xx with
    empty content is sufficient. This view returns HTTP 204 on success.
    """

    permission_classes = [IsModerationAdmin]

    def post(self, request, pk: int, *args: Any, **kwargs: Any) -> Response:
        report = get_object_or_404(ModerationReport, pk=pk)

        if "remove" not in request.data:
            raise ValidationError({"remove": "This field is required."})

        remove = bool(request.data.get("remove"))

        # Always mark as resolved in the moderation queue.
        # Prefer a typed constant on the model if it exists.
        if hasattr(report, "status"):
            resolved_value = getattr(report, "STATUS_RESOLVED", None)
            if resolved_value is None:
                # Fallback to simple string value if no constant defined
                resolved_value = "Resolved"
            setattr(report, "status", resolved_value)

        # Optional bookkeeping fields on the model, if they exist.
        now = timezone.now()

        if hasattr(report, "last_action_at"):
            setattr(report, "last_action_at", now)

        if hasattr(report, "resolved_at"):
            setattr(report, "resolved_at", now)

        if hasattr(report, "resolved_by") and getattr(request.user, "is_authenticated", False):
            # type: ignore[assignment]
            setattr(report, "resolved_by", request.user)

        # If the domain model exposes a helper method to apply the decision
        # to the underlying target object, call it defensively.
        apply_fn = getattr(report, "apply_decision", None)
        if callable(apply_fn):
            # Recommended signature on the model::
            #   def apply_decision(self, *, remove: bool, actor: User | None) -> None: ...
            apply_fn(remove=remove, actor=request.user if request.user.is_authenticated else None)

        # Finally persist changes on the report itself.
        report.save()

        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Role-management API (admin/roles)
# ---------------------------------------------------------------------------

# Permission used to flag a Group as "enabled" for Ethikos admin.
# This does not add any new tables; it simply leverages Django's
# built-in auth_permission / contenttypes tables.
ADMIN_ROLE_PERMISSION_CODENAME = "can_access_ethikos_admin"
ADMIN_ROLE_PERMISSION_NAME = "Can access Ethikos admin & moderation UIs"


def _get_admin_role_permission() -> Permission:
    """
    Ensure the dedicated permission used for role toggles exists.

    Groups that include this permission are considered "enabled" by
    the Ethikos role management screens.
    """
    ct = ContentType.objects.get_for_model(Group)
    perm, _ = Permission.objects.get_or_create(
        content_type=ct,
        codename=ADMIN_ROLE_PERMISSION_CODENAME,
        defaults={"name": ADMIN_ROLE_PERMISSION_NAME},
    )
    return perm


class AdminRoleSerializer(drf_serializers.Serializer):
    """
    Serializer matching services/admin.RoleRow on the frontend.

    It is intentionally decoupled from any particular DB model so that
    you can later change the underlying implementation (e.g. limit to
    a subset of groups, expose descriptions) without breaking the API
    contract.
    """

    id = drf_serializers.CharField()
    name = drf_serializers.CharField()
    userCount = drf_serializers.IntegerField()
    enabled = drf_serializers.BooleanField()


class AdminRoleListView(APIView):
    """
    GET /admin/roles

    Returns a flat list of role rows consumed by the Ethikos admin UIs.

    For the initial implementation, each Django auth.Group is treated
    as a role:

      - id        → Group.pk (stringified)
      - name      → Group.name
      - userCount → number of users in the group
      - enabled   → whether the group has the dedicated "admin role"
                    permission attached

    This design reuses the existing groups/permissions RBAC model and
    does not introduce new tables.
    """

    permission_classes = [IsModerationAdmin]

    def get(self, request, *args: Any, **kwargs: Any) -> Response:
        perm = _get_admin_role_permission()
        groups = Group.objects.all().order_by("name")

        items: list[dict[str, Any]] = []
        for group in groups:
            items.append(
                {
                    "id": str(group.pk),
                    "name": group.name,
                    "userCount": group.user_set.count(),
                    "enabled": group.permissions.filter(pk=perm.pk).exists(),
                }
            )

        serializer = AdminRoleSerializer(items, many=True)
        return Response({"items": serializer.data})


class AdminRoleToggleView(APIView):
    """
    PATCH /admin/roles/<id>

    Body::

        { "enabled": true | false }

    Semantics:

      - enabled = true  → attach the dedicated Ethikos admin permission
                          to the corresponding Django Group.
      - enabled = false → remove that permission from the group.

    This affects all users that belong to the group, without modifying
    group membership itself. You can later wire actual access control
    checks to this permission (e.g. user.has_perm("auth.can_access_ethikos_admin")).
    """

    permission_classes = [IsModerationAdmin]

    def patch(self, request, pk: int, *args: Any, **kwargs: Any) -> Response:
        group = get_object_or_404(Group, pk=pk)

        if "enabled" not in request.data:
            raise ValidationError({"enabled": "This field is required."})

        enabled = bool(request.data.get("enabled"))
        perm = _get_admin_role_permission()

        if enabled:
            group.permissions.add(perm)
        else:
            group.permissions.remove(perm)

        # Optional: log the change in the audit stream. Fail silently
        # if anything goes wrong to avoid breaking the admin UI.
        try:
            AuditLogEntry.log(
                actor_user=request.user if request.user.is_authenticated else None,
                action="TOGGLE_ROLE",
                target=group.name,
                entity="role",
                entity_id=group.pk,
                severity="info",
                status="ok",
                meta={"enabled": enabled},
            )
        except Exception:
            pass

        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Audit-log API
# ---------------------------------------------------------------------------


class AuditLogPagination(PageNumberPagination):
    """
    Page-number pagination matching the admin audit UI contract.

    Query params:

      - ``page``     – 1-based page index
      - ``pageSize`` – number of items per page (max 200)
    """

    page_query_param = "page"
    page_size_query_param = "pageSize"
    page_size = 20
    max_page_size = 200

    def get_paginated_response(self, data):
        assert self.request is not None  # for type checkers
        return Response(
            {
                "items": data,
                "page": self.page.number,
                "pageSize": self.get_page_size(self.request),
                "total": self.page.paginator.count,
            }
        )


class AuditLogListView(generics.ListAPIView):
    """
    GET /admin/audit/logs

    Paginated, filterable audit log stream used by the admin UI.

    Supported query params:

        page      – 1-based page index (default: 1)
        pageSize  – page size (default: 20, max: 200)
        q         – free-text search across actor, action, target, entity
        severity  – 'info' | 'warn' | 'critical'
        sort      – one of 'ts', '-ts', 'actor', '-actor',
                    'action', '-action', 'severity', '-severity',
                    'status', '-status'

    Response shape::

        {
            "items": [...],
            "page": <int>,
            "pageSize": <int>,
            "total": <int>
        }
    """

    serializer_class = AuditLogEntrySerializer
    permission_classes = [IsModerationAdmin]
    pagination_class = AuditLogPagination

    def get_queryset(self):
        qs = AuditLogEntry.objects.all()
        params = self.request.query_params

        severity = params.get("severity")
        if severity:
            qs = qs.filter(severity=severity)

        q = params.get("q")
        if q:
            qs = qs.filter(
                Q(actor__icontains=q)
                | Q(action__icontains=q)
                | Q(target__icontains=q)
                | Q(entity__icontains=q)
            )

        sort = params.get("sort") or "-ts"
        allowed_sorts = {
            "ts",
            "-ts",
            "actor",
            "-actor",
            "action",
            "-action",
            "severity",
            "-severity",
            "status",
            "-status",
        }
        if sort not in allowed_sorts:
            sort = "-ts"

        # Secondary order for deterministic pagination
        return qs.order_by(sort, "-id")
