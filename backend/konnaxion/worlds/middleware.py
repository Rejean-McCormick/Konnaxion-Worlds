from __future__ import annotations

import re

from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.http import JsonResponse
from django.utils import timezone

from .db import world_db_scope
from .models import WorldPersonaBridge, WorldRelease
from .resolver import WorldUnavailable, resolve_world_runtime

_WORLD_ROUTE_RE = re.compile(
    r"^/(?:api/)?w/(?P<world_key>[a-z0-9](?:[a-z0-9-]{0,118}[a-z0-9])?)(?:/|$)"
)

_SAFE_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}
_NON_DIRTY_RUNTIME_PATHS = ("/runtime/view-as/",)


def _error(code: str, detail: str, *, status: int) -> JsonResponse:
    return JsonResponse({"error": code, "detail": detail}, status=status)


def _load_view_as(request, runtime):
    request.world_persona = None
    request.world_persona_bridge = None
    request.world_actor_user = None
    if not getattr(request, "user", None) or not request.user.is_authenticated:
        return
    state = request.session.get("konnaxion_world_view_as", {}) if hasattr(request, "session") else {}
    persona_id = state.get(str(runtime.world_id))
    if not persona_id:
        return
    bridge = (
        WorldPersonaBridge.objects.select_related("persona", "bridge_user")
        .filter(release_id=runtime.release_id, persona_id=persona_id)
        .first()
    )
    if bridge is None:
        # Release changed; stale view-as state must not leak into the new release.
        if hasattr(request, "session"):
            clean = dict(state)
            clean.pop(str(runtime.world_id), None)
            request.session["konnaxion_world_view_as"] = clean
        return
    request.world_persona = bridge.persona
    request.world_persona_bridge = bridge
    request.world_actor_user = bridge.bridge_user


def _should_mark_dirty(request, response) -> bool:
    if request.method.upper() in _SAFE_METHODS or getattr(response, "status_code", 500) >= 400:
        return False
    path = request.path_info or ""
    return not any(path.endswith(suffix) for suffix in _NON_DIRTY_RUNTIME_PATHS)


def _scope_streaming_response(response, runtime):
    """Keep sync streaming iterators pinned to the release while they execute.

    Django evaluates streaming bodies after middleware has returned.  Without
    this wrapper, any ORM work performed by the iterator would run after the
    request's World transaction/search_path ended.  Async streaming is rejected
    until it has an async-safe database scope rather than silently leaking.
    """
    if not getattr(response, "streaming", False):
        return response
    if getattr(response, "is_async", False):
        return _error(
            "WORLD_ASYNC_STREAM_UNSUPPORTED",
            "Async streaming responses are not supported on World-scoped routes yet.",
            status=501,
        )
    original = response.streaming_content

    def scoped_iterator():
        with world_db_scope(runtime):
            yield from original

    response.streaming_content = scoped_iterator()
    return response


class WorldRouteMiddleware:
    """Pin each World request to one immutable WorldRelease and schema pair.

    The authenticated principal remains global. Optional ``View As`` state is
    exposed separately as ``request.world_actor_user`` and never replaces
    ``request.user``.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path_info or "/"
        match = _WORLD_ROUTE_RE.match(path)

        if match is None:
            return self.get_response(request)

        world_key = match.group("world_key")
        try:
            runtime = resolve_world_runtime(world_key=world_key, user=getattr(request, "user", None))
        except PermissionDenied as exc:
            return _error("WORLD_ACCESS_DENIED", str(exc), status=403)
        except WorldUnavailable as exc:
            return _error("WORLD_NOT_FOUND", str(exc), status=404)

        request.world_runtime = runtime
        request.world_key = runtime.world_key

        with world_db_scope(runtime):
            _load_view_as(request, runtime)
            response = self.get_response(request)
            if _should_mark_dirty(request, response):
                now = timezone.now()
                WorldRelease.objects.filter(pk=runtime.release_id).update(
                    is_dirty=True, dirty_since=now
                )
                runtime = runtime.__class__(
                    world_id=runtime.world_id,
                    world_key=runtime.world_key,
                    release_id=runtime.release_id,
                    release_number=runtime.release_number,
                    domain_schema=runtime.domain_schema,
                    ekoh_schema=runtime.ekoh_schema,
                    is_dirty=True,
                )

        response = _scope_streaming_response(response, runtime)
        response["X-Konnaxion-World"] = runtime.world_key
        response["X-Konnaxion-World-Release"] = str(runtime.release_number)
        response["X-Konnaxion-World-Release-Id"] = str(runtime.release_id)
        response["X-Konnaxion-World-Dirty"] = "true" if runtime.is_dirty else "false"
        return response
