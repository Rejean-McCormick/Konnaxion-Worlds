#!/usr/bin/env python3
"""Code-only SHA-256 guarded installer for Konnaxion_Worlds Tour 5/8."""
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone

TOOL = Path(__file__).resolve().parent
ROOT = TOOL.parents[1]
PAYLOAD = TOOL / 'payload'
FILES = json.loads((TOOL / 'manifest.json').read_text('utf-8'))['files']
BACKUPS = ROOT.parent / 'Tandem_Local' / 'worlds_tour_p1' / 'backups'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def at(root, rel):
    path = Path(rel)
    if path.is_absolute() or '..' in path.parts:
        raise ValueError('Dangerous relative path')
    return root / path


def basic_checks():
    if not (ROOT / 'backend/konnaxion/worlds/resolver.py').is_file() or not (ROOT / 'universes/fakeplant/universe.yaml').is_file():
        raise RuntimeError('Wrong Konnaxion_Worlds root: ' + str(ROOT))
    for rel, expected in FILES.items():
        if sha(at(PAYLOAD, rel).read_bytes()) != expected['after_sha256']:
            raise RuntimeError('Payload hash mismatch: '+rel)


def states():
    result = {}
    for rel, hashes in FILES.items():
        destination = at(ROOT, rel)
        if destination.is_file():
            digest = sha(destination.read_bytes())
            if digest == hashes['after_sha256']:
                state = 'ALREADY_UPDATED'
            elif digest == hashes['before_sha256']:
                state = 'READY'
            else:
                state = 'ERROR_DIVERGENT'
        else:
            state = 'READY' if hashes['before_sha256'] is None else 'ERROR_MISSING'
        print(f'[{state}] {rel}')
        result[rel] = state
    if any(value.startswith('ERROR') for value in result.values()):
        raise RuntimeError('Unrecognized local changes: no files modified')
    return result


def run_tests(root):
    print('[TEST] 9 controles ACL autonomes (pas de DB, Docker, Django ou Neon)')
    target = root / 'tools/tandem_tour_worlds/tests'
    proc = subprocess.run([sys.executable, '-m', 'unittest', 'discover', '-s', str(target), '-p', 'test_*.py', '-v'], cwd=root)
    if proc.returncode:
        raise RuntimeError('Standalone ACL verification failed')
    for rel in FILES:
        if rel.endswith('.py'):
            content = at(root, rel).read_text('utf-8')
            compile(content, str(at(root, rel)), 'exec')
    print('[OK] Tests autonomes et compilation PASS')


def run_isolated_tests():
    with tempfile.TemporaryDirectory(prefix='kw-tour5-') as work:
        temp_root = Path(work)
        for rel in FILES:
            dst = at(temp_root, rel)
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(at(PAYLOAD, rel), dst)
        run_tests(temp_root)


def atomic_write(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, pending = tempfile.mkstemp(prefix='.worlds-tour-', dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as f:
            f.write(content)
            f.flush()
            os.fsync(f.fileno())
        os.replace(pending, path)
    finally:
        if os.path.exists(pending):
            os.unlink(pending)


def save_backup(current):
    location = BACKUPS / datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    location.mkdir(parents=True, exist_ok=False)
    changes = {}
    for rel, state in current.items():
        if state != 'READY':
            continue
        original = at(ROOT, rel)
        if original.is_file():
            backup = at(location / 'original', rel)
            backup.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(original, backup)
            changes[rel] = 'present'
        else:
            changes[rel] = 'absent'
    (location/'backup-manifest.json').write_text(json.dumps({'id':'KW-TOUR-5-P1-v1', 'changes': changes}, indent=2)+'\n', encoding='utf-8')
    return location


def restore(backup, *, require_patched=True):
    metadata = json.loads((backup/'backup-manifest.json').read_text('utf-8'))
    if metadata.get('id') != 'KW-TOUR-5-P1-v1':
        raise RuntimeError('Unexpected rollback manifest')
    if require_patched:
        for rel in metadata['changes']:
            dst = at(ROOT,rel)
            if not dst.is_file() or sha(dst.read_bytes()) != FILES[rel]['after_sha256']:
                raise RuntimeError('Rollback refuses divergent file: '+rel)
    for rel, previous in metadata['changes'].items():
        dst = at(ROOT,rel)
        if previous == 'absent':
            dst.unlink(missing_ok=True)
        else:
            atomic_write(dst, at(backup/'original',rel).read_bytes())


def main(mode):
    print('=== KONNAXION_WORLDS / TANDEM / TOUR 5/8 / '+mode.upper()+' ===')
    print('[REPO]',ROOT)
    print('[PORTEE] Sources uniquement; aucun VPS, Docker, service, tenant ni DB touche')
    basic_checks()
    if mode == 'rollback':
        candidates = sorted(BACKUPS.glob('*/backup-manifest.json')) if BACKUPS.exists() else []
        if not candidates:
            raise RuntimeError('No backup for this lot')
        backup = candidates[-1].parent
        restore(backup,require_patched=True)
        print('[OK] Rollback:',backup)
        return
    current = states()
    if mode == 'preview':
        print('[OK] Apercu favorable, lecture seule')
    elif mode == 'verify':
        if any(s != 'ALREADY_UPDATED' for s in current.values()):
            raise RuntimeError('Patch incomplete')
        run_tests(ROOT)
        print('[OK] Tour 5/8 conforme; tests Django et PostgreSQL restent a qualifier')
    elif mode == 'install':
        if all(s == 'ALREADY_UPDATED' for s in current.values()):
            run_tests(ROOT)
            print('[OK] Deja installe, sans changement')
            return
        print('[PRECHECK] Test des fichiers a installer sur une copie temporaire')
        run_isolated_tests()
        backup = save_backup(current)
        try:
            for rel, state in current.items():
                if state == 'READY':
                    atomic_write(at(ROOT,rel),at(PAYLOAD,rel).read_bytes())
            after = states()
            if any(s != 'ALREADY_UPDATED' for s in after.values()):
                raise RuntimeError('Hash post-install mismatch')
            run_tests(ROOT)
        except Exception:
            restore(backup,require_patched=False)
            raise
        print('[OK] Konnaxion_Worlds Tour 5/8 installe; sauvegarde:',backup)
        print('[INFO] Aucun runtime Konnaxion, Neon ou WorldRelease modifie')
    else:
        raise RuntimeError('Use preview, install, verify or rollback')

if __name__ == '__main__':
    try:
        if len(sys.argv) != 2:
            raise RuntimeError('One operation is required')
        main(sys.argv[1].lower())
    except Exception as exc:
        print('[ERREUR]',exc,file=sys.stderr)
        sys.exit(1)
