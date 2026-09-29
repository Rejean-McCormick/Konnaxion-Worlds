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
