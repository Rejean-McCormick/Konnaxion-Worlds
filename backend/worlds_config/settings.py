from __future__ import annotations

import os
from pathlib import Path
from urllib.parse import parse_qsl, unquote, urlsplit

BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BACKEND_DIR.parent
BASE_DIR = BACKEND_DIR


def _load_env(path: Path) -> None:
    if not path.is_file():
        return
    for raw in path.read_text(encoding="utf-8-sig", errors="replace").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        if key and key not in os.environ:
            os.environ[key] = value.strip().strip('"').strip("'")


_load_env(REPO_ROOT / ".env")


def _bool(name: str, default: bool = False) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _csv(name: str, default: str = "") -> list[str]:
    return [part.strip() for part in os.environ.get(name, default).split(",") if part.strip()]


def _database_from_url(raw: str) -> dict:
    parts = urlsplit(raw)
    if parts.scheme.lower() not in {"postgres", "postgresql"}:
        raise RuntimeError("Konnaxion Worlds DATABASE_URL must use postgres:// or postgresql://")
    name = unquote(parts.path.lstrip("/"))
    if not name:
        raise RuntimeError("Konnaxion Worlds DATABASE_URL is missing the database name")
    options = {key: value for key, value in parse_qsl(parts.query, keep_blank_values=True)}
    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": name,
        "USER": unquote(parts.username or ""),
        "PASSWORD": unquote(parts.password or ""),
        "HOST": parts.hostname or "",
        "PORT": str(parts.port or "5432"),
        "CONN_MAX_AGE": 60,
        "OPTIONS": options,
    }


SECRET_KEY = os.environ.get("KONNAXION_WORLDS_SECRET_KEY", "konnaxion-worlds-dev-only-change-me")
DEBUG = _bool("KONNAXION_WORLDS_DEBUG", True)
ALLOWED_HOSTS = _csv("KONNAXION_WORLDS_ALLOWED_HOSTS", "127.0.0.1,localhost")
CSRF_TRUSTED_ORIGINS = _csv("KONNAXION_WORLDS_CSRF_TRUSTED_ORIGINS")

INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "rest_framework",
    "konnaxion.worlds",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "konnaxion.worlds.middleware.WorldRouteMiddleware",
]

ROOT_URLCONF = "worlds_config.urls"
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
            ],
        },
    }
]
WSGI_APPLICATION = "worlds_config.wsgi.application"
ASGI_APPLICATION = "worlds_config.asgi.application"

_database_url = (
    os.environ.get("KONNAXION_WORLDS_DATABASE_URL", "").strip()
    or os.environ.get("DATABASE_URL", "").strip()
)
if _database_url:
    DATABASES = {"default": _database_from_url(_database_url)}
else:
    # Allows static checks/setup without credentials. Runtime health/builds fail
    # closed because Konnaxion Worlds requires PostgreSQL schema support.
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": REPO_ROOT / ".konnaxion-worlds-check.sqlite3",
        }
    }

REDIS_URL = os.environ.get("REDIS_URL", "").strip()
if REDIS_URL:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": REDIS_URL,
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "konnaxion-worlds",
        }
    }

CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", REDIS_URL or "redis://127.0.0.1:6379/0")
CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND", CELERY_BROKER_URL)
CELERY_TASK_DEFAULT_QUEUE = "default"

LANGUAGE_CODE = "en-us"
TIME_ZONE = os.environ.get("KONNAXION_WORLDS_TIME_ZONE", "UTC")
USE_I18N = True
USE_TZ = True
STATIC_URL = "/static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_PASSWORD_VALIDATORS = []

KONNAXION_CONTROL_SCHEMA = os.environ.get("KONNAXION_WORLDS_CONTROL_SCHEMA", "public")
KONNAXION_WORLDS_STRICT_ROUTING = _bool("KONNAXION_WORLDS_STRICT_ROUTING", True)
KONNAXION_WORLD_SEED_ROOT = str(BACKEND_DIR / "seed-data" / "worlds")
KONNAXION_WORLD_BUILD_CONCURRENCY = int(os.environ.get("KONNAXION_WORLD_BUILD_CONCURRENCY", "1"))

IK_ORGO_INTERACTIONS_URL = os.environ.get("IK_ORGO_INTERACTIONS_URL", "").strip()
IK_ORGO_TOKEN = os.environ.get("IK_ORGO_TOKEN", "").strip()
IK_HTTP_TIMEOUT_SECONDS = float(os.environ.get("IK_HTTP_TIMEOUT_SECONDS", "10"))

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.BasicAuthentication",
    ],
}
