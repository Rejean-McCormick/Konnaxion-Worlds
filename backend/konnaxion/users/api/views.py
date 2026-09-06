# FILE: backend/konnaxion/users/api/views.py
from rest_framework import status, permissions
from rest_framework.decorators import action
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, UpdateModelMixin
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from konnaxion.users.models import User
from .serializers import UserSerializer


class UserViewSet(RetrieveModelMixin, ListModelMixin, UpdateModelMixin, GenericViewSet):
    """
    /api/users/           → list (current user only)
    /api/users/{username}/ → retrieve
    /api/users/me/        → current user (explicit)
    """
    serializer_class = UserSerializer
    queryset = User.objects.all()
    lookup_field = "username"
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Limit list queries to the authenticated user.
        """
        user = self.request.user
        if not getattr(user, "is_authenticated", False):
            return User.objects.none()
        return self.queryset.filter(id=user.id)

    @action(detail=False, methods=["get"], url_path="me", url_name="me")
    def me(self, request):
        """
        Return the authenticated user's own record using the same serializer,
        so fields like `avatar_url` can build an absolute URL from `request`.
        """
        serializer = self.get_serializer(request.user, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)
