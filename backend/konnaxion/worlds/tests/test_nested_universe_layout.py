"""Nested seed layout contract; no DB changes without explicit test settings."""
from pathlib import Path
from tempfile import TemporaryDirectory
import json
from django.test import TestCase, override_settings

from konnaxion.worlds.services.seed_packs import discover_seed_packs, SeedPackError
from konnaxion.worlds.services.universe_packs import discover_universe_packs

class NestedLayoutTests(TestCase):
    def test_nested_catalog_and_scenario(self):
        with TemporaryDirectory() as tmp:
            root=Path(tmp)/"universes"
            wdir=root/"company"/"worlds"/"department"
            wdir.mkdir(parents=True)
            (root/"company"/"universe.yaml").write_text("""universe_contract: kx-universe-pack/v1
universe_key: company
title: Company
pack_version: 1.0.0
visibility: private
default_world: department
worlds:
  - world_key: department
    seed_pack_key: department
    seed_version: 1.0.0
    visibility: private
""", encoding="utf8")
            (wdir/"world.yaml").write_text("""world_contract: kx-world-pack/v1
world_key: department
title: Department
pack_version: 1.0.0
requires:
  ethikos_scenario_schema: ethikos.scenario.v1
scenarios:
  - scenarios/example.json
""", encoding="utf8")
            (wdir/"scenarios").mkdir()
            (wdir/"scenarios"/"example.json").write_text(json.dumps({"schema_version":"ethikos.scenario.v1","scenario_key":"one"}))
            with override_settings(KONNAXION_WORLD_SEED_ROOT=str(root), KONNAXION_UNIVERSE_SEED_ROOT=str(root)):
                worlds=discover_seed_packs(persist=False)
                universes=discover_universe_packs()
            self.assertEqual([(w.world_key,w.version) for w in worlds],[("department","1.0.0")])
            self.assertEqual([(u.universe_key,len(u.worlds)) for u in universes],[("company",1)])
