from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml
from django.conf import settings

from ..models import SeedPackRecord

WORLD_PACK_CONTRACT = "kx-world-pack/v1"
_WORLD_KEY_RE = re.compile(r"^[a-z0-9](?:[a-z0-9-]{0,118}[a-z0-9])?$")
_SEMVER_RE = re.compile(
    r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)"
    r"(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?"
    r"(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$"
)


class SeedPackError(ValueError):
    pass


@dataclass(frozen=True, slots=True)
class SeedPack:
    root: Path
    manifest_path: Path
    world_key: str
    title: str
    version: str
    scenario_schema_version: str
    scenario_paths: tuple[Path, ...]
    checksum: str
    metadata: dict[str, Any]

    def load_scenarios(self) -> list[dict[str, Any]]:
        scenarios: list[dict[str, Any]] = []
        seen_keys: set[str] = set()
        for path in self.scenario_paths:
            with path.open("r", encoding="utf-8") as fh:
                payload = json.load(fh)
            if not isinstance(payload, dict):
                raise SeedPackError(f"Scenario must be a JSON object: {path}")
            schema_version = str(payload.get("schema_version") or "")
            if schema_version != self.scenario_schema_version:
                raise SeedPackError(
                    f"Scenario schema mismatch in {path.name}: "
                    f"expected {self.scenario_schema_version}, got {schema_version or '<missing>'}."
                )
            scenario_key = str(payload.get("scenario_key") or "").strip()
            if not scenario_key:
                raise SeedPackError(f"Scenario missing scenario_key: {path}")
            if scenario_key in seen_keys:
                raise SeedPackError(
                    f"Duplicate scenario_key {scenario_key!r} inside Seed Pack {self.world_key}@{self.version}."
                )
            seen_keys.add(scenario_key)
            scenarios.append(payload)
        return scenarios


def seed_root() -> Path:
    configured = getattr(settings, "KONNAXION_WORLD_SEED_ROOT", None)
    if configured:
        return Path(configured).resolve()
    return (Path(settings.BASE_DIR).parent / "seed-data" / "worlds").resolve()


def _inside(root: Path, candidate: Path) -> Path:
    root = root.resolve()
    resolved = candidate.resolve()
    try:
        resolved.relative_to(root)
    except ValueError as exc:
        raise SeedPackError(f"Seed Pack path escapes configured root: {candidate}") from exc
    return resolved


def _hash_pack(root: Path) -> str:
    digest = hashlib.sha256()
    for path in sorted(p for p in root.rglob("*") if p.is_file()):
        rel = path.relative_to(root).as_posix().encode("utf-8")
        digest.update(len(rel).to_bytes(8, "big"))
        digest.update(rel)
        data = path.read_bytes()
        digest.update(len(data).to_bytes(8, "big"))
        digest.update(data)
    return digest.hexdigest()


def _semver_key(version: str) -> tuple:
    match = _SEMVER_RE.fullmatch(version)
    if not match:
        raise SeedPackError(
            f"pack_version must be semantic versioning (MAJOR.MINOR.PATCH[-PRERELEASE]): {version!r}"
        )
    major, minor, patch = (int(match.group(i)) for i in (1, 2, 3))
    prerelease = match.group(4)
    # A release sorts after all prereleases of the same core version.
    if prerelease is None:
        pre_key = (1,)
    else:
        identifiers = []
        for token in prerelease.split("."):
            # SemVer: numeric identifiers have lower precedence than nonnumeric.
            identifiers.append((0, int(token)) if token.isdigit() else (1, token.lower()))
        pre_key = (0, tuple(identifiers))
    return (major, minor, patch, pre_key)


def load_seed_pack(manifest_path: str | Path, *, configured_root: Path | None = None) -> SeedPack:
    configured_root = (configured_root or seed_root()).resolve()
    manifest_path = _inside(configured_root, Path(manifest_path))
    root = manifest_path.parent
    if manifest_path.name not in {"world.yaml", "world.yml"}:
        raise SeedPackError("Seed Pack manifest must be world.yaml or world.yml")
    with manifest_path.open("r", encoding="utf-8") as fh:
        data = yaml.safe_load(fh) or {}
    if not isinstance(data, dict):
        raise SeedPackError("Seed Pack manifest must be a YAML object.")
    if data.get("world_contract") != WORLD_PACK_CONTRACT:
        raise SeedPackError(f"world_contract must be {WORLD_PACK_CONTRACT}")

    key = str(data.get("world_key") or "").strip().lower()
    title = str(data.get("title") or "").strip()
    version = str(data.get("pack_version") or "").strip()
    if not key or not title or not version:
        raise SeedPackError("world_key, title and pack_version are required.")
    if not _WORLD_KEY_RE.fullmatch(key):
        raise SeedPackError(f"Invalid world_key: {key!r}")
    if len(title) > 255:
        raise SeedPackError("Seed Pack title exceeds 255 characters.")
    _semver_key(version)

    requires = data.get("requires") or {}
    if not isinstance(requires, dict):
        raise SeedPackError("requires must be a YAML object.")
    scenario_version = str(requires.get("ethikos_scenario_schema") or "").strip()
    if not scenario_version:
        raise SeedPackError("requires.ethikos_scenario_schema is required.")

    raw_scenarios = data.get("scenarios") or []
    if not isinstance(raw_scenarios, list) or not raw_scenarios:
        raise SeedPackError("Seed Pack must declare at least one scenario.")
    scenario_paths = tuple(_inside(root, root / str(rel)) for rel in raw_scenarios)
    if len(set(scenario_paths)) != len(scenario_paths):
        raise SeedPackError("Seed Pack declares the same scenario file more than once.")
    for path in scenario_paths:
        if not path.is_file() or path.suffix.lower() != ".json":
            raise SeedPackError(f"Scenario file is missing or not JSON: {path}")

    pack = SeedPack(
        root=root,
        manifest_path=manifest_path,
        world_key=key,
        title=title,
        version=version,
        scenario_schema_version=scenario_version,
        scenario_paths=scenario_paths,
        checksum=_hash_pack(root),
        metadata=data,
    )
    # Validate scenario headers during discovery, not halfway through a build.
    pack.load_scenarios()
    return pack


def discover_seed_packs(*, persist: bool = True) -> list[SeedPack]:
    root = seed_root()
    if not root.exists():
        return []
    packs: list[SeedPack] = []
    identities: dict[tuple[str, str], Path] = {}
    manifests = sorted((*root.glob("*/world.yaml"), *root.glob("*/world.yml")))
    for candidate in manifests:
        manifest = _inside(root, candidate)
        pack = load_seed_pack(manifest, configured_root=root)
        identity = (pack.world_key, pack.version)
        previous = identities.get(identity)
        if previous is not None and previous != pack.manifest_path:
            raise SeedPackError(
                f"Duplicate Seed Pack identity {pack.world_key}@{pack.version}: "
                f"{previous} and {pack.manifest_path}"
            )
        identities[identity] = pack.manifest_path
        packs.append(pack)
        if persist:
            SeedPackRecord.objects.update_or_create(
                key=pack.world_key,
                version=pack.version,
                defaults={
                    "manifest_path": str(pack.manifest_path),
                    "checksum": pack.checksum,
                    "scenario_schema_version": pack.scenario_schema_version,
                    "metadata_json": pack.metadata,
                },
            )
    return packs


def get_seed_pack(key: str, version: str | None = None) -> tuple[SeedPack, SeedPackRecord]:
    key = str(key).strip().lower()
    packs = discover_seed_packs(persist=True)
    candidates = [p for p in packs if p.world_key == key and (version is None or p.version == version)]
    if not candidates:
        raise SeedPackError(f"Seed Pack not found: {key}@{version or 'latest'}")
    pack = max(candidates, key=lambda p: _semver_key(p.version))
    record = SeedPackRecord.objects.get(key=pack.world_key, version=pack.version)
    return pack, record
