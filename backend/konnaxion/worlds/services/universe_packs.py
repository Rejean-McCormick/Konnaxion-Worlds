from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import transaction

from ..models import Universe, World, WorldRelation, WorldRelease, WorldSubscription
from .builder import build_world_release, promote_release
from .seed_packs import WORLD_PACK_CONTRACT, get_seed_pack

UNIVERSE_PACK_CONTRACT = "kx-universe-pack/v1"
_WORLD_KEY_RE = re.compile(r"^[a-z0-9](?:[a-z0-9-]{0,118}[a-z0-9])?$")
_SEMVER_RE = re.compile(
    r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)"
    r"(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?"
    r"(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$"
)


class UniversePackError(ValueError):
    pass


@dataclass(frozen=True, slots=True)
class UniversePack:
    root: Path
    manifest_path: Path
    universe_key: str
    title: str
    description: str
    version: str
    visibility: str
    default_world: str | None
    worlds: tuple[dict[str, Any], ...]
    relations: tuple[dict[str, Any], ...]
    subscriptions: tuple[dict[str, Any], ...]
    requires: dict[str, Any]
    metadata: dict[str, Any]
    checksum: str


def universe_seed_root() -> Path:
    configured = getattr(settings, "KONNAXION_UNIVERSE_SEED_ROOT", None)
    if configured:
        return Path(configured).resolve()

    # Konnaxion already exposes the canonical World seed root. Universe Packs
    # live beside World Packs under the same seed-data tree, so derive the
    # Universe root from that host contract instead of assuming repository
    # layout from the installed Konnaxion_Worlds package.
    configured_world_root = getattr(settings, "KONNAXION_WORLD_SEED_ROOT", None)
    if configured_world_root:
        return (Path(configured_world_root).resolve().parent / "universes").resolve()

    # Standalone Worlds keeps BASE_DIR at backend/.
    return (Path(settings.BASE_DIR) / "seed-data" / "universes").resolve()


def _inside(root: Path, candidate: Path) -> Path:
    root = root.resolve()
    resolved = candidate.resolve()
    try:
        resolved.relative_to(root)
    except ValueError as exc:
        raise UniversePackError(f"Universe Pack path escapes configured root: {candidate}") from exc
    return resolved


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _semver_key(value: str) -> tuple:
    match = _SEMVER_RE.fullmatch(value)
    if not match:
        raise UniversePackError(
            f"pack_version must be semantic versioning (MAJOR.MINOR.PATCH[-PRERELEASE]): {value!r}"
        )
    major, minor, patch = (int(match.group(i)) for i in (1, 2, 3))
    prerelease = match.group(4)
    if prerelease is None:
        pre_key = (1,)
    else:
        identifiers = []
        for token in prerelease.split("."):
            identifiers.append((0, int(token)) if token.isdigit() else (1, token.lower()))
        pre_key = (0, tuple(identifiers))
    return (major, minor, patch, pre_key)


def _validate_semver(value: str) -> None:
    _semver_key(value)


def _slug(value: Any, *, field: str) -> str:
    normalized = str(value or "").strip().lower()
    if not normalized or not _WORLD_KEY_RE.fullmatch(normalized):
        raise UniversePackError(f"Invalid {field}: {normalized!r}")
    return normalized


def load_universe_pack(manifest_path: str | Path, *, configured_root: Path | None = None) -> UniversePack:
    configured_root = (configured_root or universe_seed_root()).resolve()
    manifest_path = _inside(configured_root, Path(manifest_path))
    if manifest_path.name not in {"universe.yaml", "universe.yml"}:
        raise UniversePackError("Universe Pack manifest must be universe.yaml or universe.yml")
    with manifest_path.open("r", encoding="utf-8") as fh:
        data = yaml.safe_load(fh) or {}
    if not isinstance(data, dict):
        raise UniversePackError("Universe Pack manifest must be a YAML object.")
    if data.get("universe_contract") != UNIVERSE_PACK_CONTRACT:
        raise UniversePackError(f"universe_contract must be {UNIVERSE_PACK_CONTRACT}")

    universe_key = _slug(data.get("universe_key"), field="universe_key")
    title = str(data.get("title") or "").strip()
    description = str(data.get("description") or "")
    version = str(data.get("pack_version") or "").strip()
    visibility = str(data.get("visibility") or Universe.VISIBILITY_PRIVATE).strip().lower()
    default_world = str(data.get("default_world") or "").strip().lower() or None
    if not title or not version:
        raise UniversePackError("title and pack_version are required.")
    if len(title) > 255:
        raise UniversePackError("Universe Pack title exceeds 255 characters.")
    _validate_semver(version)
    if visibility not in {Universe.VISIBILITY_PUBLIC, Universe.VISIBILITY_PRIVATE}:
        raise UniversePackError(f"Invalid Universe visibility: {visibility!r}")

    requires = data.get("requires") or {}
    if not isinstance(requires, dict):
        raise UniversePackError("requires must be a YAML object.")
    required_world_contract = str(requires.get("world_contract") or WORLD_PACK_CONTRACT)
    if required_world_contract != WORLD_PACK_CONTRACT:
        raise UniversePackError(
            f"requires.world_contract must be {WORLD_PACK_CONTRACT}, got {required_world_contract!r}."
        )
    host_contracts = requires.get("host_contracts") or []
    if not isinstance(host_contracts, list) or any(not isinstance(v, str) for v in host_contracts):
        raise UniversePackError("requires.host_contracts must be a list of strings.")

    raw_worlds = data.get("worlds") or []
    if not isinstance(raw_worlds, list) or not raw_worlds:
        raise UniversePackError("Universe Pack must declare at least one World.")
    worlds: list[dict[str, Any]] = []
    seen_worlds: set[str] = set()
    for idx, raw in enumerate(raw_worlds):
        if not isinstance(raw, dict):
            raise UniversePackError(f"worlds[{idx}] must be an object.")
        world_key = _slug(raw.get("world_key"), field=f"worlds[{idx}].world_key")
        if world_key in seen_worlds:
            raise UniversePackError(f"Duplicate world_key in Universe Pack: {world_key!r}")
        seen_worlds.add(world_key)
        seed_pack_key = _slug(raw.get("seed_pack_key") or world_key, field=f"worlds[{idx}].seed_pack_key")
        seed_version = str(raw.get("seed_version") or "").strip()
        if not seed_version:
            raise UniversePackError(f"worlds[{idx}].seed_version is required for reproducibility.")
        _validate_semver(seed_version)
        world_visibility = str(raw.get("visibility") or World.VISIBILITY_PRIVATE).strip().lower()
        if world_visibility not in {World.VISIBILITY_PUBLIC, World.VISIBILITY_PRIVATE}:
            raise UniversePackError(f"Invalid visibility for World {world_key!r}.")
        worlds.append({
            "world_key": world_key,
            "seed_pack_key": seed_pack_key,
            "seed_version": seed_version,
            "title": str(raw.get("title") or "").strip(),
            "description": str(raw.get("description") or ""),
            "visibility": world_visibility,
            "metadata": dict(raw.get("metadata") or {}),
        })
    if default_world is not None and default_world not in seen_worlds:
        raise UniversePackError("default_world must reference a declared World.")

    allowed_relation_types = {value for value, _label in WorldRelation.TYPE_CHOICES}
    relations: list[dict[str, Any]] = []
    relation_ids: set[tuple[str, str, str]] = set()
    for idx, raw in enumerate(data.get("relations") or []):
        if not isinstance(raw, dict):
            raise UniversePackError(f"relations[{idx}] must be an object.")
        source = _slug(raw.get("source"), field=f"relations[{idx}].source")
        target = _slug(raw.get("target"), field=f"relations[{idx}].target")
        kind = str(raw.get("type") or "").strip()
        if source not in seen_worlds or target not in seen_worlds or source == target:
            raise UniversePackError(f"Invalid relation endpoints at relations[{idx}].")
        if kind not in allowed_relation_types:
            raise UniversePackError(f"Invalid relation type {kind!r}.")
        identity = (source, target, kind)
        if identity in relation_ids:
            raise UniversePackError(f"Duplicate relation {identity!r}.")
        relation_ids.add(identity)
        relations.append({
            "source": source,
            "target": target,
            "type": kind,
            "title": str(raw.get("title") or ""),
            "description": str(raw.get("description") or ""),
            "metadata": dict(raw.get("metadata") or {}),
        })

    subscriptions: list[dict[str, Any]] = []
    subscription_ids: set[tuple[str, str, str]] = set()
    allowed_subscription_statuses = {value for value, _label in WorldSubscription.STATUS_CHOICES}
    for idx, raw in enumerate(data.get("subscriptions") or []):
        if not isinstance(raw, dict):
            raise UniversePackError(f"subscriptions[{idx}] must be an object.")
        consumer = _slug(raw.get("consumer"), field=f"subscriptions[{idx}].consumer")
        source = _slug(raw.get("source"), field=f"subscriptions[{idx}].source")
        publication_type = str(raw.get("publication_type") or "").strip()
        status = str(raw.get("status") or WorldSubscription.STATUS_ACTIVE).strip().lower()
        if consumer not in seen_worlds or source not in seen_worlds or consumer == source:
            raise UniversePackError(f"Invalid subscription endpoints at subscriptions[{idx}].")
        if not publication_type:
            raise UniversePackError(f"subscriptions[{idx}].publication_type is required.")
        if status not in allowed_subscription_statuses:
            raise UniversePackError(f"Invalid subscription status {status!r}.")
        identity = (consumer, source, publication_type)
        if identity in subscription_ids:
            raise UniversePackError(f"Duplicate subscription {identity!r}.")
        subscription_ids.add(identity)
        subscriptions.append({
            "consumer": consumer,
            "source": source,
            "publication_type": publication_type,
            "status": status,
            "metadata": dict(raw.get("metadata") or {}),
        })

    metadata = dict(data.get("metadata") or {})
    return UniversePack(
        root=manifest_path.parent,
        manifest_path=manifest_path,
        universe_key=universe_key,
        title=title,
        description=description,
        version=version,
        visibility=visibility,
        default_world=default_world,
        worlds=tuple(worlds),
        relations=tuple(relations),
        subscriptions=tuple(subscriptions),
        requires=requires,
        metadata=metadata,
        checksum=_sha256(manifest_path),
    )


def discover_universe_packs() -> list[UniversePack]:
    root = universe_seed_root()
    if not root.exists():
        return []
    packs = []
    identities: set[tuple[str, str]] = set()
    for candidate in sorted((*root.glob("*/universe.yaml"), *root.glob("*/universe.yml"))):
        pack = load_universe_pack(candidate, configured_root=root)
        identity = (pack.universe_key, pack.version)
        if identity in identities:
            raise UniversePackError(f"Duplicate Universe Pack identity: {identity!r}")
        identities.add(identity)
        packs.append(pack)
    return packs


def get_universe_pack(key: str, version: str | None = None) -> UniversePack:
    normalized = str(key or "").strip().lower()
    matches = [p for p in discover_universe_packs() if p.universe_key == normalized]
    if version is not None:
        matches = [p for p in matches if p.version == version]
    if not matches:
        raise UniversePackError(f"Universe Pack not found: {normalized}@{version or 'latest'}")
    # Universe packs require exact versions on referenced World packs; latest here
    # is only a convenience for choosing the composition manifest itself.
    return max(matches, key=lambda p: _semver_key(p.version))


def _managed_metadata(pack: UniversePack, metadata: dict[str, Any]) -> dict[str, Any]:
    return {
        **metadata,
        "_kx_universe_pack": {
            "contract": UNIVERSE_PACK_CONTRACT,
            "universe_key": pack.universe_key,
            "pack_version": pack.version,
            "checksum": pack.checksum,
        },
    }


def _reconcile_topology(*, pack: UniversePack, universe: Universe, worlds: dict[str, World]) -> None:
    desired_relations = set()
    for row in pack.relations:
        relation = WorldRelation(
            universe=universe,
            source_world=worlds[row["source"]],
            target_world=worlds[row["target"]],
            relation_type=row["type"],
            title=row["title"],
            description=row["description"],
            metadata_json=_managed_metadata(pack, row["metadata"]),
        )
        relation.full_clean()
        WorldRelation.objects.update_or_create(
            source_world=relation.source_world,
            target_world=relation.target_world,
            relation_type=relation.relation_type,
            defaults={
                "universe": universe,
                "title": relation.title,
                "description": relation.description,
                "metadata_json": relation.metadata_json,
            },
        )
        desired_relations.add((relation.source_world_id, relation.target_world_id, relation.relation_type))

    for relation in WorldRelation.objects.filter(universe=universe):
        marker = (relation.metadata_json or {}).get("_kx_universe_pack") or {}
        if marker.get("universe_key") != pack.universe_key:
            continue
        identity = (relation.source_world_id, relation.target_world_id, relation.relation_type)
        if identity not in desired_relations:
            relation.delete()

    desired_subscriptions = set()
    for row in pack.subscriptions:
        subscription = WorldSubscription(
            consumer_world=worlds[row["consumer"]],
            source_world=worlds[row["source"]],
            publication_type=row["publication_type"],
            status=row["status"],
            metadata_json=_managed_metadata(pack, row["metadata"]),
        )
        subscription.full_clean()
        WorldSubscription.objects.update_or_create(
            consumer_world=subscription.consumer_world,
            source_world=subscription.source_world,
            publication_type=subscription.publication_type,
            defaults={
                "status": subscription.status,
                "metadata_json": subscription.metadata_json,
            },
        )
        desired_subscriptions.add((subscription.consumer_world_id, subscription.source_world_id, subscription.publication_type))

    for subscription in WorldSubscription.objects.filter(consumer_world__universe=universe):
        marker = (subscription.metadata_json or {}).get("_kx_universe_pack") or {}
        if marker.get("universe_key") != pack.universe_key:
            continue
        identity = (subscription.consumer_world_id, subscription.source_world_id, subscription.publication_type)
        if identity not in desired_subscriptions:
            subscription.delete()


def apply_universe_pack(*, pack: UniversePack, actor=None, promote: bool = False) -> dict[str, Any]:
    # Resolve every referenced World pack before mutating the control plane.
    resolved = {}
    for row in pack.worlds:
        seed_pack, _record = get_seed_pack(row["seed_pack_key"], row["seed_version"])
        resolved[row["world_key"]] = seed_pack

    with transaction.atomic():
        universe, created = Universe.objects.get_or_create(
            key=pack.universe_key,
            defaults={
                "title": pack.title,
                "description": pack.description,
                "visibility": Universe.VISIBILITY_PRIVATE,
                "created_by": actor,
            },
        )
        if universe.status == Universe.STATUS_ARCHIVED:
            raise UniversePackError("Archived Universes cannot be applied without explicit restoration.")
        universe.title = pack.title
        universe.description = pack.description
        # Fresh installs stay private until the complete composition is promoted.
        if not universe.worlds.filter(current_release__isnull=False).exists():
            universe.visibility = Universe.VISIBILITY_PRIVATE
        universe.status = Universe.STATUS_ACTIVE
        universe.metadata_json = _managed_metadata(pack, dict(pack.metadata))
        universe.full_clean()
        universe.save()

        worlds: dict[str, World] = {}
        for row in pack.worlds:
            seed_pack = resolved[row["world_key"]]
            world, _ = World.objects.get_or_create(
                key=row["world_key"],
                defaults={
                    "universe": universe,
                    "title": row["title"] or seed_pack.title,
                    "description": row["description"],
                    "visibility": World.VISIBILITY_PRIVATE,
                    "created_by": actor,
                },
            )
            if world.universe_id != universe.id:
                raise UniversePackError(
                    f"World {world.key!r} belongs to Universe {world.universe.key!r}, "
                    f"not {universe.key!r}."
                )
            world.title = row["title"] or seed_pack.title
            world.description = row["description"] or str(seed_pack.metadata.get("description") or "")
            world.status = World.STATUS_ACTIVE
            # Preserve live visibility during upgrades; new Worlds remain private until promotion.
            if not world.current_release_id:
                world.visibility = World.VISIBILITY_PRIVATE
            world.full_clean()
            world.save()
            worlds[world.key] = world

    builds = []
    promotion_targets: list[tuple[World, WorldRelease]] = []
    for row in pack.worlds:
        world = worlds[row["world_key"]]
        seed_pack = resolved[world.key]
        current = world.current_release
        if current and current.seed_checksum == seed_pack.checksum and current.seed_version == seed_pack.version:
            builds.append({"world": world.key, "action": "already_current", "release": current.release_number})
            continue
        ready = (
            world.releases.filter(
                seed_checksum=seed_pack.checksum,
                seed_version=seed_pack.version,
                status=WorldRelease.STATUS_READY,
            )
            .order_by("-release_number")
            .first()
        )
        if ready is None:
            ready = build_world_release(
                world=world,
                seed_pack_key=seed_pack.world_key,
                seed_version=seed_pack.version,
                actor=actor,
                promote=False,
            )
            builds.append({"world": world.key, "action": "built", "release": ready.release_number})
        else:
            builds.append({"world": world.key, "action": "reuse_ready", "release": ready.release_number})
        promotion_targets.append((world, ready))

    promoted = []
    if promote:
        with transaction.atomic():
            for world, release in promotion_targets:
                target = promote_release(world=world, release=release, actor=actor)
                promoted.append({"world": world.key, "release": target.release_number})
            # Normalize declared World visibility only after all target releases are promotable.
            for row in pack.worlds:
                world = World.objects.select_for_update().get(pk=worlds[row["world_key"]].pk)
                if world.visibility != row["visibility"]:
                    world.visibility = row["visibility"]
                    world.save(update_fields=["visibility", "updated_at"])
                worlds[world.key] = world

            universe = Universe.objects.select_for_update().get(pk=universe.pk)
            _reconcile_topology(pack=pack, universe=universe, worlds=worlds)
            universe.default_world = worlds.get(pack.default_world) if pack.default_world else None
            universe.visibility = pack.visibility
            universe.metadata_json = _managed_metadata(pack, dict(pack.metadata))
            universe.full_clean()
            universe.save(update_fields=["default_world", "visibility", "metadata_json", "updated_at"])
    else:
        with transaction.atomic():
            universe = Universe.objects.select_for_update().get(pk=universe.pk)
            _reconcile_topology(pack=pack, universe=universe, worlds=worlds)
            # default_world is safe as a navigation preference even before promotion.
            universe.default_world = worlds.get(pack.default_world) if pack.default_world else None
            universe.metadata_json = _managed_metadata(pack, dict(pack.metadata))
            universe.full_clean()
            universe.save(update_fields=["default_world", "metadata_json", "updated_at"])

    return {
        "ok": True,
        "contract": UNIVERSE_PACK_CONTRACT,
        "universe": pack.universe_key,
        "pack_version": pack.version,
        "checksum": pack.checksum,
        "required_host_contracts": list(pack.requires.get("host_contracts") or []),
        "builds": builds,
        "promoted": promoted,
    }
