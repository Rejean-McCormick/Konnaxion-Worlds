# FILE: backend/konnaxion/users/tests/api/test_views.py
import pytest
from rest_framework.test import APIRequestFactory

from konnaxion.users.api.views import UserViewSet
from konnaxion.users.models import User


class TestUserViewSet:
    @pytest.fixture
    def api_rf(self) -> APIRequestFactory:
        return APIRequestFactory()

    def test_get_queryset(self, user: User, api_rf: APIRequestFactory):
        view = UserViewSet()
        request = api_rf.get("/fake-url/")
        request.user = user

        view.request = request

        qs = view.get_queryset()
        # The authenticated user must be in the queryset…
        assert user in qs
        # …and for the /api/users/ endpoint we only expose the current user
        assert qs.count() == 1

    def test_me(self, user: User, api_rf: APIRequestFactory):
        view = UserViewSet()
        request = api_rf.get("/fake-url/")
        request.user = user

        view.request = request
        # GenericAPIView normally sets this during request dispatch.
        view.format_kwarg = None

        response = view.me(request)  # type: ignore[call-arg, arg-type, misc]

        assert response.status_code == 200

        data = response.data
        # Existing fields
        assert data["username"] == user.username
        assert data["url"] == f"http://testserver/api/users/{user.username}/"
        assert data["name"] == user.name

        # New field for avatar support in the frontend
        assert "avatar_url" in data
        # Optional: if you enforce a non-empty URL, keep this; otherwise remove it.
        # assert isinstance(data["avatar_url"], str)
        # assert data["avatar_url"] != ""
