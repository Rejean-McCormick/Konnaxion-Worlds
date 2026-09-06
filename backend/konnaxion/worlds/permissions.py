from __future__ import annotations

from rest_framework.permissions import BasePermission, SAFE_METHODS


class WorldControlPermission(BasePermission):
    """Readable Worlds for authenticated users; mutations require staff."""
    def has_permission(self, request, view) -> bool:
        if request.method in SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return bool(request.user and request.user.is_staff)
