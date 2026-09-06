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
from konnaxion.worlds.services.naming import release_schema_names, safe_world_token


def _runtime(world_id=1, release_id=10):
    return WorldRuntime(
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
