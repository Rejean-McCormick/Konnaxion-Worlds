# FILE: backend/config/settings/test.py
"""
With these settings, tests run faster.

Neon pooled PostgreSQL endpoints reject startup ``options`` such as
``-c search_path=...``. EkoH / Smart Vote schema selection is handled
transactionally by migrations/services, so tests remove that startup option.
"""

from .base import *  # noqa: F403
from .base import TEMPLATES
from .base import env

# GENERAL
# ------------------------------------------------------------------------------
SECRET_KEY = env(
    "DJANGO_SECRET_KEY",
    default="y5jf2SIxaBqlJhJS6nOZ7wGWgxs7UJ0Wtgltt2l5tYf9KdlLNs7BSKeCE58YDZqy",
)
TEST_RUNNER = "django.test.runner.DiscoverRunner"

# Keep test DB startup behavior aligned with config.settings.local.
DATABASES["default"].setdefault("OPTIONS", {})
DATABASES["default"]["OPTIONS"].pop("options", None)

# PASSWORDS
# ------------------------------------------------------------------------------
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

# EMAIL
# ------------------------------------------------------------------------------
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# DEBUGGING FOR TEMPLATES
# ------------------------------------------------------------------------------
TEMPLATES[0]["OPTIONS"]["debug"] = True  # type: ignore[index]

# MEDIA
# ------------------------------------------------------------------------------
MEDIA_URL = "http://media.testserver/"
