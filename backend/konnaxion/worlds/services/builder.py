from __future__ import annotations

from django.db import connection, transaction
from django.db.models.deletion import ProtectedError
from django.db.models import Max
from django.utils import timezone

from ..models import World, WorldRelease
from .audit import audit
from .naming import release_schema_names
from .personas import (
    cleanup_orphan_bridge_users,
    clone_persona_bridges,
    promote_persona_bridges,
)
from .schema import (
    clear_schema_data,
    copy_schema_data,
    drop_schema,
    provision_release_schemas,
    remap_global_user_references,
    validate_release_schemas,
    write_canary,
)
from .seed_packs import get_seed_pack


class WorldBuildError(RuntimeError):
    pass


def _next_release_number(world: World) -> int:
    value = world.releases.aggregate(value=Max("release_number"))["value"] or 0
    return int(value) + 1


def create_release_record(
    *, world: World, seed_pack=None, parent_release=None, reason="build"
) -> WorldRelease:
    # Release numbering is a control-plane critical section.  Locking the World
    # prevents two concurrent builders from choosing the same rN.
    with transaction.atomic():
        locked_world = World.objects.select_for_update().get(pk=world.pk)
        number = _next_release_number(locked_world)
        domain_schema, ekoh_schema = release_schema_names(locked_world.key, number)
        return WorldRelease.objects.create(
            world=locked_world,
            release_number=number,
            status=WorldRelease.STATUS_BUILDING,
            domain_schema=domain_schema,
            ekoh_schema=ekoh_schema,
            seed_pack=seed_pack,
            seed_pack_key=getattr(seed_pack, "key", "") or "",
            seed_version=getattr(seed_pack, "version", "") or "",
            seed_checksum=getattr(seed_pack, "checksum", "") or "",
            scenario_schema_version=getattr(seed_pack, "scenario_schema_version", "") or "",
            build_started_at=timezone.now(),
            parent_release=parent_release,
            build_reason=reason,
        )


def _load_pack_fixtures(pack) -> list[str]:
    requires = (pack.metadata.get("requires") or {}) if pack else {}
    fixtures = requires.get("fixtures") or []
    if not isinstance(fixtures, list) or any(not isinstance(value, str) for value in fixtures):
        raise WorldBuildError("Seed Pack requires.fixtures must be a list of strings.")
    return list(fixtures)


def _import_pack_scenarios(*, release: WorldRelease, pack, actor=None) -> list[dict]:
    """Validate Seed Pack payloads without importing a sibling application's models."""

    fixtures = _load_pack_fixtures(pack)
    reports: list[dict] = [{"fixtures": fixtures, "mode": "validated_only"}]
    for payload in pack.load_scenarios():
        reports.append(
            {
                "ok": True,
                "scenario_key": str(payload.get("scenario_key") or ""),
                "schema_version": str(payload.get("schema_version") or ""),
                "release_id": release.id,
            }
        )
    return reports


def build_world_release(
    *,
    world: World,
    seed_pack_key: str,
    seed_version: str | None = None,
    actor=None,
    promote: bool = False,
    progress_callback=None,
) -> WorldRelease:
    if world.status == World.STATUS_ARCHIVED:
        raise WorldBuildError("Archived Worlds cannot be rebuilt until explicitly restored.")
    pack, record = get_seed_pack(seed_pack_key, seed_version)
    release = create_release_record(world=world, seed_pack=record, reason="seed_build")
    release.seed_pack_key = pack.world_key
    release.seed_version = pack.version
    release.seed_checksum = pack.checksum
    release.scenario_schema_version = pack.scenario_schema_version
    release.build_metadata_json = {
        "architecture_lock": "KX-WORLDS-1",
        "manifest": str(pack.manifest_path),
        "scenario_count": len(pack.scenario_paths),
    }
    release.save(update_fields=[
        "seed_pack_key", "seed_version", "seed_checksum", "scenario_schema_version",
        "build_metadata_json",
    ])
    audit(event_type="release_build_started", world=world, release=release, actor=actor)
    if progress_callback is not None:
        progress_callback(release)

    try:
        domain_fp, ekoh_fp = provision_release_schemas(release)
        release.status = WorldRelease.STATUS_VALIDATING
        release.domain_migration_fingerprint = domain_fp
        release.ekoh_migration_fingerprint = ekoh_fp
        release.save(update_fields=["status", "domain_migration_fingerprint", "ekoh_migration_fingerprint"])
        if progress_callback is not None:
            progress_callback(release)

        import_report = _import_pack_scenarios(release=release, pack=pack, actor=actor)
        validation = validate_release_schemas(release)
        validation["imports"] = import_report
        if not validation.get("ok"):
            raise WorldBuildError(f"World schema validation failed: {validation}")

        release.status = WorldRelease.STATUS_READY
        release.validation_report_json = validation
        release.build_finished_at = timezone.now()
        release.save(update_fields=["status", "validation_report_json", "build_finished_at"])
        if progress_callback is not None:
            progress_callback(release)
        audit(event_type="release_ready", world=world, release=release, actor=actor, metadata=validation)
        if promote:
            promote_release(world=world, release=release, actor=actor)
        return release
    except Exception as exc:
        release.status = WorldRelease.STATUS_FAILED
        release.build_finished_at = timezone.now()
        release.validation_report_json = {"ok": False, "error": str(exc)}
        release.save(update_fields=["status", "build_finished_at", "validation_report_json"])
        if progress_callback is not None:
            progress_callback(release)
        audit(
            event_type="release_build_failed",
            world=world,
            release=release,
            actor=actor,
            metadata={"error": str(exc)},
        )
        raise


def promote_release(*, world: World, release: WorldRelease, actor=None) -> WorldRelease:
    if world.status == World.STATUS_ARCHIVED:
        raise WorldBuildError("Archived Worlds cannot promote releases until explicitly restored.")
    if release.world_id != world.id:
        raise WorldBuildError("Cannot promote a Release from another World.")
    if release.status != WorldRelease.STATUS_READY:
        raise WorldBuildError(
            f"Release is not promotable: {release.status}. "
            "Frozen releases are immutable; clone/restore them into a new READY release first."
        )

    # Validate before taking the control-plane lock so expensive schema checks do
    # not block unrelated World operations.  Status is checked again under lock.
    validation = validate_release_schemas(release)
    if not validation.get("ok"):
        raise WorldBuildError(f"Release schema validation failed: {validation}")

    with transaction.atomic():
        locked = World.objects.select_for_update().get(pk=world.pk)
        target = WorldRelease.objects.select_for_update().select_related("world").get(
            pk=release.pk, world=locked
        )
        if target.status != WorldRelease.STATUS_READY:
            raise WorldBuildError(
                f"Release is not promotable: {target.status}. "
                "Frozen releases are immutable; clone/restore them into a new READY release first."
            )

        previous = locked.current_release
        if previous and previous.pk != target.pk:
            previous = WorldRelease.objects.select_for_update().get(pk=previous.pk)
            if previous.status == WorldRelease.STATUS_CURRENT:
                previous.status = WorldRelease.STATUS_FROZEN
                previous.save(update_fields=["status"])

        target.status = WorldRelease.STATUS_CURRENT
        target.promoted_at = timezone.now()
        target.save(update_fields=["status", "promoted_at"])
        locked.current_release = target
        locked.status = World.STATUS_ACTIVE
        locked.save(update_fields=["current_release", "status", "updated_at"])
        promote_persona_bridges(target)

    audit(
        event_type="release_promoted",
        world=locked,
        release=target,
        actor=actor,
        metadata={"previous_release_id": getattr(previous, "id", None)},
    )
    return target


def clone_release_state(
    *,
    source: WorldRelease,
    target_world: World,
    actor=None,
    reason="clone",
    target_status=WorldRelease.STATUS_READY,
) -> WorldRelease:
    if source.status not in {
        WorldRelease.STATUS_CURRENT,
        WorldRelease.STATUS_READY,
        WorldRelease.STATUS_FROZEN,
    }:
        raise WorldBuildError(f"Source release cannot be cloned in state: {source.status}")
    source_validation = validate_release_schemas(source)
    if not source_validation.get("ok"):
        raise WorldBuildError(f"Source release failed schema validation: {source_validation}")

    release = create_release_record(
        world=target_world,
        seed_pack=source.seed_pack,
        parent_release=source,
        reason=reason,
    )
    release.seed_pack_key = source.seed_pack_key
    release.seed_version = source.seed_version
    release.seed_checksum = source.seed_checksum
    release.scenario_schema_version = source.scenario_schema_version
    release.save(update_fields=["seed_pack_key", "seed_version", "seed_checksum", "scenario_schema_version"])
    audit(event_type="release_build_started", world=target_world, release=release, actor=actor, metadata={"clone_source": source.id})
    try:
        domain_fp, ekoh_fp = provision_release_schemas(release)

        # Copy release-local schema + persona bridge state from one PostgreSQL MVCC
        # snapshot. Concurrent writes may continue on the source World, but this
        # clone observes one coherent point in time instead of one snapshot per
        # table/schema.
        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ")
            clear_schema_data(release.domain_schema)
            clear_schema_data(release.ekoh_schema)
            copy_schema_data(source.domain_schema, release.domain_schema)
            copy_schema_data(source.ekoh_schema, release.ekoh_schema)
            user_mapping = clone_persona_bridges(source_release=source, target_release=release)
            remapped_domain = remap_global_user_references(release.domain_schema, user_mapping)
            remapped_ekoh = remap_global_user_references(release.ekoh_schema, user_mapping)
            write_canary(
                schema=release.domain_schema, world_id=target_world.id,
                release_id=release.id, schema_kind="domain"
            )
            write_canary(
                schema=release.ekoh_schema, world_id=target_world.id,
                release_id=release.id, schema_kind="ekoh"
            )
        release.domain_migration_fingerprint = domain_fp
        release.ekoh_migration_fingerprint = ekoh_fp
        validation = validate_release_schemas(release)
        validation["persona_user_remap"] = {
            "users": len(user_mapping),
            "domain_rows": remapped_domain,
            "ekoh_rows": remapped_ekoh,
        }
        if not validation.get("ok"):
            raise WorldBuildError(f"Cloned release failed validation: {validation}")
        release.status = target_status
        release.validation_report_json = validation
        release.build_finished_at = timezone.now()
        release.save(update_fields=[
            "status", "validation_report_json", "build_finished_at",
            "domain_migration_fingerprint", "ekoh_migration_fingerprint",
        ])
        audit(event_type="release_ready", world=target_world, release=release, actor=actor, metadata={"clone_source": source.id})
        return release
    except Exception as exc:
        release.status = WorldRelease.STATUS_FAILED
        release.build_finished_at = timezone.now()
        release.validation_report_json = {"ok": False, "error": str(exc)}
        release.save(update_fields=["status", "build_finished_at", "validation_report_json"])
        audit(event_type="release_build_failed", world=target_world, release=release, actor=actor, metadata={"error": str(exc)})
        raise


def purge_release(*, release: WorldRelease, actor=None) -> None:
    """Purge a non-current, unreferenced release atomically.

    PostgreSQL DDL is transactional, so schema drops and control-plane deletion
    either commit together or roll back together.  This prevents a failed
    ``PROTECT`` delete from leaving a WorldRelease record whose schemas vanished.
    """
    bridge_user_ids: list[int] = []
    with transaction.atomic():
        world = World.objects.select_for_update().get(pk=release.world_id)
        target = WorldRelease.objects.select_for_update().get(pk=release.pk, world=world)
        if world.current_release_id == target.id:
            raise WorldBuildError("Cannot purge the current release.")
        if target.source_snapshots.exists() or target.frozen_snapshots.exists():
            raise WorldBuildError("Cannot purge a release retained by a World snapshot.")

        metadata = {
            "release_id": target.id,
            "domain_schema": target.domain_schema,
            "ekoh_schema": target.ekoh_schema,
        }
        bridge_user_ids = list(
            target.persona_bridges.values_list("bridge_user_id", flat=True)
        )
        drop_schema(target.ekoh_schema)
        drop_schema(target.domain_schema)
        try:
            target.delete()
        except ProtectedError as exc:
            raise WorldBuildError(
                "Cannot purge release because another control-plane object retains it."
            ) from exc

    cleaned = cleanup_orphan_bridge_users(bridge_user_ids)
    metadata["bridge_users_cleaned"] = cleaned
    audit(event_type="release_purged", world=world, actor=actor, metadata=metadata)
