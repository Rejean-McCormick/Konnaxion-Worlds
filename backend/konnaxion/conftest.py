# FILE: backend/konnaxion/conftest.py
import pytest

from konnaxion.users.models import User
from konnaxion.users.tests.factories import UserFactory


@pytest.fixture(autouse=True)
def _media_storage(settings, tmpdir) -> None:
    settings.MEDIA_ROOT = tmpdir.strpath


@pytest.fixture
def user(db) -> User:
    return UserFactory()
