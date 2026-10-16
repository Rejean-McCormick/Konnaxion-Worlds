"""Local read-only FakePlant pack and fixture validation. No Django database required."""
from __future__ import annotations
import hashlib, json, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
try:import yaml
except ImportError:sys.exit('PyYAML requis: pip install pyyaml')
fixture=ROOT/'fakeplant/fixture'
raw=lambda p:json.loads(p.read_text(encoding='utf-8'))
manifest=raw(fixture/'MANIFEST.json')
for fn,digest in manifest['sha256'].items():
    assert hashlib.sha256((fixture/fn).read_bytes()).hexdigest()==digest,fn
people=raw(fixture/'employes.json')['employees'];members=raw(fixture/'acces-worlds.json')['memberships']
assert len(people)==900 and len({x['id'] for x in people})==900
assert all(x['synthetic'] and not x['login_enabled'] for x in people)
assert len(members)==2736 and len({(x['person_id'],x['world_key']) for x in members})==2736
assert set(x['person_id'] for x in members)<=set(x['id'] for x in people)
uni=yaml.safe_load((ROOT/'seed-data/universes/fakeplant/universe.yaml').read_text(encoding='utf-8'))
assert uni['universe_contract']=='kx-universe-pack/v1' and uni['universe_key']=='fakeplant' and len(uni['worlds'])==6
assert {x['world_key'].removeprefix('fp-') for x in uni['worlds']}=={w['key'] for w in raw(fixture/'organigramme.json')['organization']['worlds']}
t=c=actors=0
for w in uni['worlds']:
    root=ROOT/'seed-data/worlds'/w['seed_pack_key']
    obj=yaml.safe_load((root/'world.yaml').read_text(encoding='utf-8'))
    assert obj['world_contract']=='kx-world-pack/v1' and obj['world_key']==w['world_key'] and obj['pack_version']==w['seed_version']
    for rel in obj['scenarios']:
        s=raw(root/rel)
        assert s['schema_version']=='ethikos-demo-scenario/v3' and s['metadata']['world_key']==w['world_key']
        assert s['metadata']['persona_projection']['mode']=='identity_binding_only'
        assert set(s['metadata']['actor_profiles'])=={a['key'] for a in s['actors']}
        idmap={x['employee_code']:x['id'] for x in people}
        write_access={(x['person_id'],x['world_key']) for x in members if x['role'] in ('member','owner','maintainer')}
        assert all((idmap[a['key']],w['world_key'].removeprefix('fp-')) in write_access for a in s['actors']), w['world_key']
        actors+=len(s['actors']);t+=len(s['topics']);c+=len(s['consultations'])
assert (t,c)==(47,16),(t,c)
k=raw(fixture/'keenkonnect.json');assert (len(k['projects']),len(k['messages']),len(k['tasks']))==(29,116,87)
host=ROOT.parent/'Konnaxion/backend/konnaxion/ethikos/demo_import/schema.py'
if host.exists():
    import importlib.util
    spec=importlib.util.spec_from_file_location('fakeplant_ethikos_schema',host)
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    for w in uni['worlds']:
        source=ROOT/'seed-data/worlds'/w['world_key']/'scenarios/fakeplant.json'
        errors=module.validate_demo_scenario(raw(source))
        assert not errors,(w['world_key'],errors[:3])
    print('PASS: Ethikos official v3 schema (6 scenarios).')
print(f'PASS Konnaxion_Worlds: 6 Worlds, {len(people)} employés, {len(members)} appartenances, {t} sujets Ethikos, {c} consultations, {actors} profils de publication, {len(k["projects"])} projets keenKonnect (fixture).')
print('READ ONLY — aucun changement de base, keenKonnect et comptes non importés.')
