from __future__ import annotations

from django.conf import settings
from django.db import connection, transaction
from django.db.models.deletion import ProtectedError
from django.db.models import Max
from django.utils import timezone
from django.utils.module_loading import import_string


from ..db import world_db_scope
from ..models import SeedPackRecord, World, WorldRelease
from ..resolver import runtime_from_release
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


def _record_build_progress(
    release: WorldRelease,
    *,
    stage: str,
    step: int,
    steps_total: int,
    message: str,
    progress_callback=None,
    stage_step: int | None = None,
    stage_steps_total: int | None = None,
) -> None:
    progress = {
        "stage": stage,
        "step": int(step),
        "steps_total": int(steps_total),
        "percent": int(round((int(step) / max(1, int(steps_total))) * 100)),
        "message": message,
        "updated_at": timezone.now().isoformat(),
    }
    if stage_step is not None:
        progress["stage_step"] = int(stage_step)
    if stage_steps_total is not None:
        progress["stage_steps_total"] = int(stage_steps_total)
    release.build_metadata_json = {
        **(release.build_metadata_json or {}),
        "progress": progress,
    }
    release.save(update_fields=["build_metadata_json"])
    if progress_callback is not None:
        progress_callback(release)


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


def _import_pack_scenarios(*, release: WorldRelease, pack, actor=None, progress_callback=None) -> list[dict]:
    """Import host-domain scenarios through an explicit adapter when configured.

    Konnaxion_Worlds owns the release boundary, not ethiKos or any other host
    domain. Standalone deployments therefore validate scenario payloads only.
    Product hosts MAY configure ``KONNAXION_WORLDS_SCENARIO_IMPORTER`` with a
    dotted callable accepting ``payload``, ``imported_by`` and ``dry_run``.
    """
    fixtures = _load_pack_fixtures(pack)
    importer_path = str(
        getattr(settings, "KONNAXION_WORLDS_SCENARIO_IMPORTER", "") or ""
    ).strip()
    if not importer_path:
        reports: list[dict] = [{"fixtures": fixtures, "mode": "validated_only"}]
        scenarios = pack.load_scenarios()
        for index, payload in enumerate(scenarios, start=1):
            if progress_callback is not None:
                progress_callback(index, len(scenarios), str(payload.get("scenario_key") or "scenario"))
            reports.append(
                {
                    "ok": True,
                    "scenario_key": str(payload.get("scenario_key") or ""),
                    "schema_version": str(payload.get("schema_version") or ""),
                    "release_id": release.id,
                }
            )
        return reports

    importer = import_string(importer_path)
    reports = [{"fixtures": fixtures, "mode": "host_adapter_import", "adapter": importer_path}]
    runtime = runtime_from_release(release)
    scenarios = pack.load_scenarios()
    with world_db_scope(runtime):
        for index, payload in enumerate(scenarios, start=1):
            if progress_callback is not None:
                progress_callback(index, len(scenarios), str(payload.get("scenario_key") or "scenario"))
            result = importer(payload, imported_by=actor, dry_run=False)
            if not isinstance(result, dict) or not result.get("ok"):
                raise WorldBuildError(
                    "World scenario import failed for "
                    f"{payload.get('scenario_key') or '<unknown>'}: "
                    f"{(result or {}).get('errors') if isinstance(result, dict) else result}"
                )
            reports.append(
                {
                    "ok": True,
                    "scenario_key": str(payload.get("scenario_key") or ""),
                    "schema_version": str(payload.get("schema_version") or ""),
                    "release_id": release.id,
                    "summary": result.get("summary", {}),
                    "created_count": len(result.get("created", [])),
                    "updated_count": len(result.get("updated", [])),
                    "warning_count": len(result.get("warnings", [])),
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
    resolved_pack=None,
    seed_record: SeedPackRecord | None = None,
) -> WorldRelease:
    if world.status == World.STATUS_ARCHIVED:
        raise WorldBuildError("Archived Worlds cannot be rebuilt until explicitly restored.")

    if resolved_pack is None:
        pack, record = get_seed_pack(seed_pack_key, seed_version)
    else:
        pack = resolved_pack
        if pack.world_key != str(seed_pack_key).strip().lower():
            raise WorldBuildError(
                f"Resolved Seed Pack key mismatch: expected {seed_pack_key!r}, got {pack.world_key!r}."
            )
        if seed_version is not None and pack.version != str(seed_version).strip():
            raise WorldBuildError(
                f"Resolved Seed Pack version mismatch: expected {seed_version!r}, got {pack.version!r}."
            )
        record = seed_record or SeedPackRecord.objects.get(key=pack.world_key, version=pack.version)

    release = create_release_record(world=world, seed_pack=record, reason="seed_build")
    release.seed_pack_key = pack.world_key
    release.seed_version = pack.version
    release.seed_checksum = pack.checksum
    release.scenario_schema_version = pack.scenario_schema_version
    release.build_metadata_json = {
        "architecture_lock": "KX-UNIVERSES-1",
        "manifest": str(pack.manifest_path),
        "scenario_count": len(pack.scenario_paths),
    }
    release.save(update_fields=[
        "seed_pack_key", "seed_version", "seed_checksum", "scenario_schema_version",
        "build_metadata_json",
    ])
    audit(event_type="release_build_started", world=world, release=release, actor=actor)
    _record_build_progress(
        release,
        stage="preparing",
        step=1,
        steps_total=5,
        message=f"Resolved {pack.world_key}@{pack.version}; release r{release.release_number} created",
        progress_callback=progress_callback,
    )

    try:
        def provisioning_progress(stage: str, current: int, total: int, message: str) -> None:
            _record_build_progress(
                release,
                stage=stage,
                step=2,
                steps_total=5,
                message=message,
                progress_callback=progress_callback,
                stage_step=current,
                stage_steps_total=total,
            )

        provisioning = provision_release_schemas(
            release,
            progress_callback=provisioning_progress,
        )
        release.status = WorldRelease.STATUS_VALIDATING
        release.domain_migration_fingerprint = provisioning.domain_migration_fingerprint
        release.ekoh_migration_fingerprint = provisioning.auxiliary_migration_fingerprint
        release.fixture_checksum = provisioning.fixture_checksum
        release.build_metadata_json = {
            **(release.build_metadata_json or {}),
            "provisioning": provisioning.as_dict(),
        }
        release.save(update_fields=[
            "status",
            "domain_migration_fingerprint",
            "ekoh_migration_fingerprint",
            "fixture_checksum",
            "build_metadata_json",
        ])

        def import_progress(current: int, total: int, scenario_key: str) -> None:
            _record_build_progress(
                release,
                stage="importing",
                step=3,
                steps_total=5,
                message=f"Importing scenario {scenario_key}",
                progress_callback=progress_callback,
                stage_step=current,
                stage_steps_total=total,
            )

        _record_build_progress(
            release,
            stage="importing",
            step=3,
            steps_total=5,
            message="Importing World scenarios",
            progress_callback=progress_callback,
            stage_step=0,
            stage_steps_total=max(1, len(pack.scenario_paths)),
        )
        import_report = _import_pack_scenarios(
            release=release,
            pack=pack,
            actor=actor,
            progress_callback=import_progress,
        )

        _record_build_progress(
            release,
            stage="validating",
            step=4,
            steps_total=5,
            message="Validating release schemas, migrations, canaries and isolation",
            progress_callback=progress_callback,
        )
        validation = validate_release_schemas(release)
        validation["imports"] = import_report
        if not validation.get("ok"):
            raise WorldBuildError(f"World schema validation failed: {validation}")

        release.status = WorldRelease.STATUS_READY
        release.validation_report_json = validation
        release.build_finished_at = timezone.now()
        release.save(update_fields=["status", "validation_report_json", "build_finished_at"])
        _record_build_progress(
            release,
            stage="ready",
            step=5,
            steps_total=5,
            message="Release is ready for promotion",
            progress_callback=progress_callback,
        )
        audit(event_type="release_ready", world=world, release=release, actor=actor, metadata=validation)
        if promote:
            promote_release(world=world, release=release, actor=actor)
        return release
    except Exception as exc:
        # A failed provider DDL operation (notably Neon capacity errors) can make
        # the current psycopg session unusable.  Failure bookkeeping is best
        # effort only: never replace the original build exception with a second
        # "connection is closed" / transaction error.  The persisted build job
        # runner/parent orchestrator will also fail-close the job if this write
        # cannot be recorded here.
        failure_text = str(exc)
        try:
            if not connection.in_atomic_block:
                connection.close()
                connection.ensure_connection()
            release.status = WorldRelease.STATUS_FAILED
            release.build_finished_at = timezone.now()
            release.validation_report_json = {"ok": False, "error": failure_text}
            release.save(update_fields=["status", "build_finished_at", "validation_report_json"])
            try:
                _record_build_progress(
                    release,
                    stage="failed",
                    step=0,
                    steps_total=5,
                    message=failure_text,
                    progress_callback=progress_callback,
                )
            except Exception:
                pass
            try:
                audit(
                    event_type="release_build_failed",
                    world=world,
                    release=release,
                    actor=actor,
                    metadata={"error": failure_text},
                )
            except Exception:
                pass
        except Exception:
            try:
                connection.close()
            except Exception:
                pass
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
        provisioning = provision_release_schemas(release)

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
                schema=release.domain_schema,
                world_id=target_world.id,
                release_id=release.id,
                schema_kind="domain",
                seed_checksum=release.seed_checksum,
                migration_fingerprint=provisioning.domain_migration_fingerprint,
            )
            write_canary(
                schema=release.ekoh_schema,
                world_id=target_world.id,
                release_id=release.id,
                schema_kind="auxiliary",
                seed_checksum=release.seed_checksum,
                migration_fingerprint=provisioning.auxiliary_migration_fingerprint,
            )
        release.domain_migration_fingerprint = provisioning.domain_migration_fingerprint
        release.ekoh_migration_fingerprint = provisioning.auxiliary_migration_fingerprint
        release.fixture_checksum = provisioning.fixture_checksum
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
            "fixture_checksum",
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


def purge_release(*, release: WorldRelease, actor=None) -> dict:
    """Purge a non-current, unreferenced release atomically.

    The storage-critical operation is the transactional schema/control-plane
    purge.  Post-commit housekeeping (orphan bridge-user cleanup and audit) is
    deliberately best-effort: when a provider is already at its hard storage
    ceiling, those follow-up writes/cascade probes must not make a successful
    space reclaim look like a failed purge.
    """
    bridge_user_ids: list[int] = []
    warnings: list[str] = []
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

    cleaned = 0
    try:
        cleaned = cleanup_orphan_bridge_users(bridge_user_ids)
    except Exception as exc:
        # Host User deletion can traverse release-scoped reverse relations that
        # intentionally do not exist in public.  Retaining tiny orphan bridge
        # accounts is safer than undoing/reclassifying a completed schema purge.
        warnings.append(f"bridge user cleanup skipped: {exc}")
        try:
            connection.close()
        except Exception:
            pass

    metadata["bridge_users_cleaned"] = cleaned
    if warnings:
        metadata["warnings"] = list(warnings)
    try:
        audit(event_type="release_purged", world=world, actor=actor, metadata=metadata)
    except Exception as exc:
        warnings.append(f"audit skipped: {exc}")
        try:
            connection.close()
        except Exception:
            pass

    return {"bridge_users_cleaned": cleaned, "warnings": warnings}
