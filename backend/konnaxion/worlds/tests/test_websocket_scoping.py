from __future__ import annotations

import asyncio

from konnaxion.worlds.runtime import WorldRuntime
from konnaxion.worlds.services import websocket as websocket_service


def _runtime() -> WorldRuntime:
    return WorldRuntime(
        universe_id=3,
        universe_key="research",
        world_id=7,
        world_key="research-innovation-commons",
        release_id=17,
        release_number=7,
        domain_schema="kx_w_research_innovation_commons_r7",
        ekoh_schema="kx_e_research_innovation_commons_r7",
    )


def test_websocket_resolver_forwards_universe_world_and_session_principal(monkeypatch):
    runtime = _runtime()
    principal = object()
    headers = ((b"cookie", b"sessionid=test-session"),)
    calls = []

    monkeypatch.setattr(
        websocket_service,
        "_user_from_scope_headers",
        lambda received_headers: principal if received_headers == headers else None,
    )

    def fake_resolve_world_runtime(*, universe_key, world_key, user):
        calls.append(
            {
                "universe_key": universe_key,
                "world_key": world_key,
                "user": user,
            }
        )
        return runtime

    monkeypatch.setattr(
        websocket_service,
        "resolve_world_runtime",
        fake_resolve_world_runtime,
    )

    resolved = websocket_service.resolve_websocket_world_runtime_sync(
        universe_key=runtime.universe_key,
        world_key=runtime.world_key,
        headers=headers,
    )

    assert resolved == runtime
    assert calls == [
        {
            "universe_key": runtime.universe_key,
            "world_key": runtime.world_key,
            "user": principal,
        }
    ]


def test_async_websocket_resolver_preserves_release_pinned_runtime(monkeypatch):
    runtime = _runtime()
    headers = ()

    monkeypatch.setattr(
        websocket_service,
        "_user_from_scope_headers",
        lambda received_headers: None,
    )

    def fake_resolve_world_runtime(*, universe_key, world_key, user):
        assert universe_key == runtime.universe_key
        assert world_key == runtime.world_key
        assert user is None
        return runtime

    monkeypatch.setattr(
        websocket_service,
        "resolve_world_runtime",
        fake_resolve_world_runtime,
    )

    resolved = asyncio.run(
        websocket_service.resolve_websocket_world_runtime(
            universe_key=runtime.universe_key,
            world_key=runtime.world_key,
            headers=headers,
        )
    )

    assert resolved == runtime
    assert resolved.world_id == 7
    assert resolved.release_id == 17
