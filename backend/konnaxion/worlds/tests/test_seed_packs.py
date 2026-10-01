from __future__ import annotations

import json
from pathlib import Path

import pytest
import yaml
from django.test import override_settings

from konnaxion.worlds.services.seed_packs import SeedPackError, discover_seed_packs, load_seed_pack


@pytest.mark.django_db
def test_collision_seed_packs_are_valid_and_semver_discoverable(settings):
    root = Path(settings.BASE_DIR) / "seed-data" / "worlds"
    with override_settings(KONNAXION_WORLD_SEED_ROOT=str(root)):
        packs = discover_seed_packs(persist=False)
    identities = {(pack.world_key, pack.version) for pack in packs}
    assert ("demo-alpha", "1.0.0") in identities
    assert ("demo-beta", "1.0.0") in identities


@pytest.mark.django_db
def test_seed_pack_rejects_path_escape(tmp_path):
    root = tmp_path / "worlds"
    pack_root = root / "bad"
    pack_root.mkdir(parents=True)
    outside = tmp_path / "outside.json"
    outside.write_text(json.dumps({"schema_version": "ethikos-demo-scenario/v3"}), encoding="utf-8")
    manifest = {
        "world_contract": "kx-world-pack/v1",
        "world_key": "bad",
        "title": "Bad",
        "pack_version": "1.0.0",
        "requires": {"ethikos_scenario_schema": "ethikos-demo-scenario/v3"},
        "scenarios": ["../../outside.json"],
    }
    path = pack_root / "world.yaml"
    path.write_text(yaml.safe_dump(manifest), encoding="utf-8")
    with pytest.raises(SeedPackError, match="escapes configured root"):
        load_seed_pack(path, configured_root=root)


def _write_seed_pack(root: Path, key: str, version: str = "1.0.0") -> None:
    pack_root = root / key
    pack_root.mkdir(parents=True)
    scenario = {
        "schema_version": "ethikos-demo-scenario/v3",
        "scenario_key": f"{key}-scenario",
    }
    (pack_root / "scenario.json").write_text(json.dumps(scenario), encoding="utf-8")
    manifest = {
        "world_contract": "kx-world-pack/v1",
        "world_key": key,
        "title": key,
        "pack_version": version,
        "requires": {"ethikos_scenario_schema": "ethikos-demo-scenario/v3"},
        "scenarios": ["scenario.json"],
    }
    (pack_root / "world.yaml").write_text(yaml.safe_dump(manifest), encoding="utf-8")


@pytest.mark.django_db
def test_seed_pack_catalog_resolves_without_rediscovery(settings, tmp_path, monkeypatch):
    from konnaxion.worlds.services import seed_packs

    root = tmp_path / "worlds"
    _write_seed_pack(root, "catalog-a")
    _write_seed_pack(root, "catalog-b")
    calls = {"hash": 0}
    original = seed_packs._hash_pack

    def counted(path):
        calls["hash"] += 1
        return original(path)

    monkeypatch.setattr(seed_packs, "_hash_pack", counted)
    with override_settings(KONNAXION_WORLD_SEED_ROOT=str(root)):
        catalog = seed_packs.discover_seed_pack_catalog(persist=True)
        assert catalog.resolve("catalog-a", "1.0.0").world_key == "catalog-a"
        seed_packs.get_seed_pack("catalog-b", "1.0.0", catalog=catalog)

    assert calls["hash"] == 2
