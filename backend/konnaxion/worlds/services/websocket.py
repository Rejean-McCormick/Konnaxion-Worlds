from __future__ import annotations

from http.cookies import SimpleCookie
from importlib import import_module
from typing import Iterable

from asgiref.sync import sync_to_async
from django.conf import settings
from django.contrib.auth import get_user
from django.http import HttpRequest

from ..resolver import resolve_world_runtime


def _header_value(headers: Iterable[tuple[bytes, bytes]], name: bytes) -> str:
    target = name.lower()
    for key, value in headers:
        if key.lower() == target:
            return value.decode("latin1")
    return ""


def _user_from_scope_headers(headers: Iterable[tuple[bytes, bytes]]):
    """Resolve the normal Django session principal from raw ASGI headers."""
    cookie_header = _header_value(headers, b"cookie")
    if not cookie_header:
        return None

    cookies = SimpleCookie()
    try:
        cookies.load(cookie_header)
    except Exception:
        return None

    morsel = cookies.get(settings.SESSION_COOKIE_NAME)
    if morsel is None or not morsel.value:
        return None

    session_engine = import_module(settings.SESSION_ENGINE)
    session = session_engine.SessionStore(session_key=morsel.value)
    request = HttpRequest()
    request.session = session
    user = get_user(request)
    if not getattr(user, "is_authenticated", False):
        return None
    return user


def resolve_websocket_world_runtime_sync(*, world_key: str, universe_key: str | None = None, headers=()):
    user = _user_from_scope_headers(headers)
    return resolve_world_runtime(universe_key=universe_key, world_key=world_key, user=user)


resolve_websocket_world_runtime = sync_to_async(
    resolve_websocket_world_runtime_sync,
    thread_sensitive=True,
)
