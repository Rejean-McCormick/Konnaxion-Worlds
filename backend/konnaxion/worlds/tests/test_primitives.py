from __future__ import annotations

import pytest

from konnaxion.worlds.runtime import (
    WorldContextConflict,
    WorldContextRequired,
    WorldRuntime,
    get_world_runtime,
    require_world_runtime,
    reset_world_runtime,
    set_world_runtime,
)
from konnaxion.worlds.services.cache import (
    world_cache_key,
    require_world_cache_scope_token,
    world_cache_scope_token,
    world_channel_name,
)
from konnaxion.worlds.services.media import world_media_path, world_media_prefix
from konnaxion.worlds.services.naming import release_schema_names, safe_world_token
from konnaxion.worlds.services.search import (
    enforce_world_search_filter,
    stamp_world_search_document,
    world_search_namespace,
)
from konnaxion.worlds.services.tasks import (
    PinnedWorldTask,
    WorldTaskContextError,
    enqueue_for_current_releases,
)


def _runtime(world_id=1, release_id=10):
    return WorldRuntime(
        universe_id=99,
        universe_key="test-universe",
        world_id=world_id,
        world_key=f"world-{world_id}",
        release_id=release_id,
        release_number=1,
        domain_schema=f"kx_w_test_{world_id}_{release_id}",
        ekoh_schema=f"kx_e_test_{world_id}_{release_id}",
    )


def test_schema_names_are_distinct_bounded_and_stable():
    one = release_schema_names("CUNY Philosophy / unsafe", 12)
    two = release_schema_names("CUNY Philosophy / unsafe", 12)
    assert one == two
    assert one[0] != one[1]
    assert all(len(value) <= 63 for value in one)
    assert safe_world_token("A" * 400) == safe_world_token("A" * 400)


def test_world_runtime_fails_closed_and_rejects_cross_scope():
    assert get_world_runtime() is None
    with pytest.raises(WorldContextRequired):
        require_world_runtime()

    first = _runtime()
    token = set_world_runtime(first)
    try:
        assert require_world_runtime() == first
        with pytest.raises(WorldContextConflict):
            set_world_runtime(_runtime(world_id=2, release_id=20))
    finally:
        reset_world_runtime(token)
    assert get_world_runtime() is None


def test_infrastructure_namespaces_are_release_pinned_and_fail_closed():
    first = _runtime(world_id=7, release_id=12)
    second = _runtime(world_id=7, release_id=13)

    assert world_cache_scope_token(runtime=first) == (7, 12)
    assert require_world_cache_scope_token(runtime=first) == (7, 12)
    assert world_cache_key("topic:42", domain="ethikos", runtime=first) == (
        "kx:w:7:r:12:ethikos:topic:42"
    )
    assert world_cache_key("topic:42", domain="ethikos", runtime=first) != (
        world_cache_key("topic:42", domain="ethikos", runtime=second)
    )
    assert world_channel_name("reports.custom", runtime=first) == (
        "w7.r12.reports.custom"
    )

    assert world_search_namespace(domain="ethikos", runtime=first) == (
        "kx-w7-r12-ethikos"
    )
    assert enforce_world_search_filter({"status": "open"}, runtime=first) == {
        "status": "open",
        "world_id": 7,
        "release_id": 12,
    }
    with pytest.raises(ValueError):
        enforce_world_search_filter({"world_id": 8}, runtime=first)

    stamped = stamp_world_search_document(
        {"title": "Example"},
        source_type="ethikos.topic",
        source_id=42,
        runtime=first,
    )
    assert stamped["world_id"] == 7
    assert stamped["release_id"] == 12
    assert stamped["source_type"] == "ethikos.topic"
    assert stamped["source_id"] == "42"

    assert world_media_prefix(category="kreative/artworks", runtime=first) == (
        "worlds/7/releases/12/kreative/artworks"
    )
    assert world_media_path("../same-name.png", category="kreative/artworks", runtime=first) == (
        "worlds/7/releases/12/kreative/artworks/same-name.png"
    )
    with pytest.raises(ValueError):
        world_media_prefix(category="../escape", runtime=first)


def test_world_task_base_rejects_missing_release_identity_before_execution():
    task = PinnedWorldTask()
    with pytest.raises(WorldTaskContextError):
        task()


def test_periodic_fanout_enqueues_explicit_world_and_release(monkeypatch):
    calls = []

    class FakeTask:
        def apply_async(self, **options):
            calls.append(options)

    monkeypatch.setattr(
        "konnaxion.worlds.services.tasks.current_world_release_targets",
        lambda: [(7, 12), (8, 5)],
    )

    scheduled = enqueue_for_current_releases(
        FakeTask(),
        kwargs={"batch_size": 250},
    )

    assert scheduled == 2
    assert calls == [
        {"kwargs": {"batch_size": 250, "world_id": 7, "release_id": 12}},
        {"kwargs": {"batch_size": 250, "world_id": 8, "release_id": 5}},
    ]
