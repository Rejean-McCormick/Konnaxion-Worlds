# FILE: backend/konnaxion/ethikos/permissions.py
# backend/konnaxion/ethikos/permissions.py
"""
Reusable DRF permissions for ethiKos / Kintsugi Wave 1.

This module is intentionally small and dependency-light. It avoids importing
ethiKos models so it can be reused safely from viewsets, serializers, admin
helpers, and future slice code without circular imports.

Design goals:
- public read where the API contract allows it;
- authenticated writes by default;
- owner/admin object edits;
- moderator/admin governance actions;
- no new Kintsugi/Kialo permission namespace;
- no assumptions about future slice models beyond common ownership fields.
"""

from __future__ import annotations

from typing import Any

from rest_framework.permissions import SAFE_METHODS, BasePermission


# Group names are deliberately permissive during Wave 1 so existing deployments
# can adopt either Django staff flags or explicit moderator groups.
ETHIKOS_MODERATOR_GROUP_NAMES = {
    "ethikos_moderator",
    "ethikos_moderators",
    "moderator",
    "moderators",
    "Moderators",
}

ETHIKOS_ADMIN_GROUP_NAMES = {
    "ethikos_admin",
    "ethikos_admins",
    "admin",
    "admins",
    "Administrators",
}


def is_authenticated_user(user: Any) -> bool:
    """Return True only for a real authenticated Django user."""
    return bool(user and getattr(user, "is_authenticated", False))


def is_staff_or_superuser(user: Any) -> bool:
    """Return True for Django staff or superusers."""
    if not is_authenticated_user(user):
        return False
    return bool(
        getattr(user, "is_staff", False)
        or getattr(user, "is_superuser", False)
    )


def user_in_any_group(user: Any, group_names: set[str]) -> bool:
    """
    Return True if the user belongs to at least one named Django group.

    This is defensive because AnonymousUser, test doubles, or custom user
    objects may not expose a normal ``groups`` relation.
    """
    if not is_authenticated_user(user):
        return False

    groups = getattr(user, "groups", None)
    if groups is None:
        return False

    try:
        return groups.filter(name__in=group_names).exists()
    except Exception:
        return False


def is_ethikos_admin(user: Any) -> bool:
    """
    Return True for users allowed to perform ethiKos administrative actions.

    Staff and superusers are always accepted. Explicit admin groups are accepted
    to support future role-based governance without changing permission classes.
    """
    return is_staff_or_superuser(user) or user_in_any_group(
        user,
        ETHIKOS_ADMIN_GROUP_NAMES,
    )


def is_ethikos_moderator(user: Any) -> bool:
    """
    Return True for users allowed to moderate ethiKos content.

    Admin users are also moderators.
    """
    return is_ethikos_admin(user) or user_in_any_group(
        user,
        ETHIKOS_MODERATOR_GROUP_NAMES,
    )


def get_object_owner_id(obj: Any) -> Any | None:
    """
    Best-effort owner lookup for current and future ethiKos objects.

    Current known ownership fields:
    - EthikosTopic.created_by
    - EthikosArgument.user
    - EthikosStance.user

    Future Wave 1 slice models may use ``owner``, ``created_by``, ``author``,
    ``submitted_by``, or ``user``. This helper supports those names without
    importing models or forcing a specific abstract base class.
    """
    for field_name in (
        "owner",
        "created_by",
        "author",
        "submitted_by",
        "user",
    ):
        owner_id = getattr(obj, f"{field_name}_id", None)
        if owner_id is not None:
            return owner_id

        owner = getattr(obj, field_name, None)
        if owner is not None:
            return getattr(owner, "id", None)

    return None


def user_owns_object(user: Any, obj: Any) -> bool:
    """Return True if ``user`` owns ``obj`` according to common owner fields."""
    if not is_authenticated_user(user):
        return False

    owner_id = get_object_owner_id(obj)
    user_id = getattr(user, "id", None)

    return owner_id is not None and user_id is not None and owner_id == user_id


class PublicReadAuthenticatedWrite(BasePermission):
    """
    Allow public reads and require authentication for unsafe methods.

    Use for core public ethiKos resources such as topics, stances, arguments,
    previews, and future Kintsugi read surfaces where unauthenticated browsing
    is allowed but writes require a logged-in user.
    """

    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        if request.method in SAFE_METHODS:
            return True
        return is_authenticated_user(request.user)


class AuthenticatedOnly(BasePermission):
    """
    Require authentication for every method.

    Use for user-specific actions, submissions, suggestions, draft work, and
    other endpoints where even reads should not be public.
    """

    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        return is_authenticated_user(request.user)


class EthikosAdminOnly(BasePermission):
    """
    Require ethiKos admin rights.

    Staff, superusers, and users in accepted ethiKos admin groups pass.
    """

    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        return is_ethikos_admin(request.user)

    def has_object_permission(self, request, view, obj) -> bool:  # type: ignore[override]
        return is_ethikos_admin(request.user)


class EthikosModeratorOnly(BasePermission):
    """
    Require ethiKos moderator rights.

    Admin users are treated as moderators.
    """

    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        return is_ethikos_moderator(request.user)

    def has_object_permission(self, request, view, obj) -> bool:  # type: ignore[override]
        return is_ethikos_moderator(request.user)


class OwnerOrEthikosAdmin(BasePermission):
    """
    Allow object owners or ethiKos admins.

    This class does not allow anonymous public reads. Use
    ``OwnerOrEthikosAdminOrReadOnly`` when public read access is desired.
    """

    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        return is_authenticated_user(request.user)

    def has_object_permission(self, request, view, obj) -> bool:  # type: ignore[override]
        return is_ethikos_admin(request.user) or user_owns_object(request.user, obj)


class OwnerOrEthikosModerator(BasePermission):
    """
    Allow object owners, moderators, or admins.

    Useful for argument moderation and future queue-like slice objects where
    owners may edit their own submissions and moderators may intervene.
    """

    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        return is_authenticated_user(request.user)

    def has_object_permission(self, request, view, obj) -> bool:  # type: ignore[override]
        return is_ethikos_moderator(request.user) or user_owns_object(
            request.user,
            obj,
        )


class OwnerOrEthikosAdminOrReadOnly(BasePermission):
    """
    Public read, owner/admin write.

    Recommended default for resources such as EthikosTopic where:
    - list/retrieve/preview are public;
    - create requires authentication;
    - update/delete require owner or admin.
    """

    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        if request.method in SAFE_METHODS:
            return True
        return is_authenticated_user(request.user)

    def has_object_permission(self, request, view, obj) -> bool:  # type: ignore[override]
        if request.method in SAFE_METHODS:
            return True
        return is_ethikos_admin(request.user) or user_owns_object(request.user, obj)


class OwnerOrEthikosModeratorOrReadOnly(BasePermission):
    """
    Public read, owner/moderator/admin write.

    Recommended default for user-authored deliberation objects such as
    arguments, sources, suggestions, and other Korum slice artifacts.
    """

    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        if request.method in SAFE_METHODS:
            return True
        return is_authenticated_user(request.user)

    def has_object_permission(self, request, view, obj) -> bool:  # type: ignore[override]
        if request.method in SAFE_METHODS:
            return True
        return is_ethikos_moderator(request.user) or user_owns_object(
            request.user,
            obj,
        )


class SelfOrEthikosAdmin(BasePermission):
    """
    Allow users to access only their own user-linked object, or admins.

    Useful for user-specific stance, role, declaration, or profile-context
    records where public read access is not appropriate.
    """

    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        return is_authenticated_user(request.user)

    def has_object_permission(self, request, view, obj) -> bool:  # type: ignore[override]
        return is_ethikos_admin(request.user) or user_owns_object(request.user, obj)


# Compatibility aliases for readable viewset declarations.
IsEthikosAdmin = EthikosAdminOnly
IsEthikosModerator = EthikosModeratorOnly
IsAuthenticatedForEthikos = AuthenticatedOnly
IsPublicReadAuthenticatedWrite = PublicReadAuthenticatedWrite
IsOwnerOrAdmin = OwnerOrEthikosAdmin
IsOwnerOrAdminOrReadOnly = OwnerOrEthikosAdminOrReadOnly
IsOwnerOrModeratorOrReadOnly = OwnerOrEthikosModeratorOrReadOnly