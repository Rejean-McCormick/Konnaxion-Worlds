from __future__ import annotations

from pathlib import Path

import pytest
import yaml
from django.test import override_settings

from konnaxion.worlds.services.universe_packs import (
    UNIVERSE_PACK_CONTRACT,
    UniversePackError,
    discover_universe_packs,
    load_universe_pack,
    universe_seed_root,
)


def _write_pack(root: Path, data: dict) -> Path:
    target = root / data["universe_key"]
    target.mkdir(parents=True)
    path = target / "universe.yaml"
    path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
    return path


def test_universe_pack_validates_composition(tmp_path):
    root = tmp_path / "universes"
    path = _write_pack(root, {
        "universe_contract": UNIVERSE_PACK_CONTRACT,
        "universe_key": "demo-universe",
        "title": "Demo Universe",
        "pack_version": "1.0.0",
        "visibility": "private",
        "default_world": "demo-world",
        "requires": {"world_contract": "kx-world-pack/v1", "host_contracts": ["kx-world-personas/v1"]},
        "worlds": [{"world_key": "demo-world", "seed_pack_key": "demo-world", "seed_version": "1.0.0"}],
        "relations": [],
        "subscriptions": [],
    })
    pack = load_universe_pack(path, configured_root=root)
    assert pack.universe_key == "demo-universe"
    assert pack.default_world == "demo-world"
    assert pack.worlds[0]["seed_version"] == "1.0.0"


def test_universe_pack_rejects_relation_to_undeclared_world(tmp_path):
    root = tmp_path / "universes"
    path = _write_pack(root, {
        "universe_contract": UNIVERSE_PACK_CONTRACT,
        "universe_key": "demo-universe",
        "title": "Demo Universe",
        "pack_version": "1.0.0",
        "worlds": [{"world_key": "demo-world", "seed_version": "1.0.0"}],
        "relations": [{"source": "demo-world", "target": "missing", "type": "references"}],
    })
    with pytest.raises(UniversePackError, match="Invalid relation endpoints"):
        load_universe_pack(path, configured_root=root)


@pytest.mark.django_db
def test_discovery_uses_universe_seed_root(settings, tmp_path):
    root = tmp_path / "universes"
    _write_pack(root, {
        "universe_contract": UNIVERSE_PACK_CONTRACT,
        "universe_key": "demo-universe",
        "title": "Demo Universe",
        "pack_version": "1.0.0",
        "worlds": [{"world_key": "demo-world", "seed_version": "1.0.0"}],
    })
    with override_settings(KONNAXION_UNIVERSE_SEED_ROOT=str(root)):
        packs = discover_universe_packs()
    assert [(p.universe_key, p.version) for p in packs] == [("demo-universe", "1.0.0")]


def test_apply_universe_command_accepts_pack_version():
    from konnaxion.worlds.management.commands.worlds_apply_universe import Command

    parser = Command().create_parser("manage.py", "worlds_apply_universe")
    options = parser.parse_args(["demo-universe", "--pack-version", "1.2.3"])
    assert options.universe_key == "demo-universe"
    assert options.pack_version == "1.2.3"


def test_universe_seed_root_follows_world_seed_root(settings, tmp_path):
    world_root = tmp_path / "seed-data" / "worlds"
    with override_settings(
        KONNAXION_UNIVERSE_SEED_ROOT=None,
        KONNAXION_WORLD_SEED_ROOT=str(world_root),
    ):
        assert universe_seed_root() == (world_root.parent / "universes").resolve()


@pytest.mark.django_db
def test_reconcile_topology_is_idempotent_for_existing_relation(tmp_path):
    from konnaxion.worlds.models import Universe, World, WorldRelation
    from konnaxion.worlds.services.universe_packs import _reconcile_topology

    root = tmp_path / "universes"
    path = _write_pack(root, {
        "universe_contract": UNIVERSE_PACK_CONTRACT,
        "universe_key": "topology-demo",
        "title": "Topology Demo",
        "pack_version": "1.0.0",
        "worlds": [
            {"world_key": "topology-a", "seed_version": "1.0.0"},
            {"world_key": "topology-b", "seed_version": "1.0.0"},
        ],
        "relations": [
            {"source": "topology-a", "target": "topology-b", "type": "references", "title": "A to B"}
        ],
    })
    pack = load_universe_pack(path, configured_root=root)
    universe = Universe.objects.create(key="topology-demo", title="Topology Demo")
    a = World.objects.create(universe=universe, key="topology-a", title="A")
    b = World.objects.create(universe=universe, key="topology-b", title="B")
    worlds = {a.key: a, b.key: b}

    _reconcile_topology(pack=pack, universe=universe, worlds=worlds)
    _reconcile_topology(pack=pack, universe=universe, worlds=worlds)

    assert WorldRelation.objects.count() == 1
    relation = WorldRelation.objects.get()
    assert relation.title == "A to B"
    assert relation.relation_type == "references"


def test_apply_universe_command_accepts_queue_wait_options():
    from konnaxion.worlds.management.commands.worlds_apply_universe import Command

    parser = Command().create_parser("manage.py", "worlds_apply_universe")
    options = parser.parse_args([
        "demo-universe",
        "--pack-version", "1.2.3",
        "--queue", "--wait", "--promote",
        "--poll-seconds", "1.5",
    ])
    assert options.queue is True
    assert options.wait is True
    assert options.promote is True
    assert options.poll_seconds == 1.5


def test_apply_universe_command_accepts_local_workers():
    from konnaxion.worlds.management.commands.worlds_apply_universe import Command

    parser = Command().create_parser("manage.py", "worlds_apply_universe")
    options = parser.parse_args([
        "demo-universe",
        "--pack-version", "1.2.3",
        "--local-workers", "2",
        "--promote",
    ])
    assert options.local_workers == 2
    assert options.promote is True
