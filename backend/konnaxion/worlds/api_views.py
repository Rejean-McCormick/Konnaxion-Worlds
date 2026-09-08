from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db.models import Exists, OuterRef, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    SeedPackRecord,
    World,
    WorldAuditEvent,
    WorldBuildJob,
    WorldMembership,
    WorldPersona,
    WorldPersonaBridge,
    WorldRelease,
    WorldSnapshot,
)
from .serializers import (
    SeedPackRecordSerializer,
    WorldAuditEventSerializer,
    WorldBuildJobSerializer,
    WorldMembershipSerializer,
    WorldPersonaSerializer,
    WorldReleaseSerializer,
    WorldSerializer,
    WorldSnapshotSerializer,
)
from .resolver import can_manage_world
from .services.audit import audit
from .services.build_queue import enqueue_world_build_job
from .services.builder import (
    WorldBuildError,
    clone_release_state,
    promote_release,
    purge_release,
)
from .services.health import world_liveness, world_readiness, world_registry_health, world_system_health
from .services.seed_packs import SeedPackError, discover_seed_packs, get_seed_pack
from .services.schema import validate_release_schemas
from .services.snapshots import create_snapshot, restore_snapshot

User = get_user_model()


def _visible_worlds(user):
    qs = World.objects.select_related("current_release").exclude(status=World.STATUS_ARCHIVED)
    if user and user.is_authenticated:
        if user.is_staff or user.is_superuser:
            return qs
        manage_memberships = WorldMembership.objects.filter(
            world_id=OuterRef("pk"),
            user=user,
            is_active=True,
            role__in=(WorldMembership.ROLE_OWNER, WorldMembership.ROLE_MAINTAINER),
        )
        return (
            qs.filter(
                Q(visibility=World.VISIBILITY_PUBLIC)
                | Q(created_by=user)
                | Q(memberships__user=user, memberships__is_active=True)
            )
            .annotate(can_manage_membership=Exists(manage_memberships))
            .distinct()
        )
    return qs.filter(visibility=World.VISIBILITY_PUBLIC)


def _get_world(key: str) -> World:
    return World.objects.select_related("current_release").get(key=key)


def _can_manage(user, world: World) -> bool:
    return can_manage_world(user, world)


def _manage_or_403(request, world: World):
    if not _can_manage(request.user, world):
        return Response({"error": "WORLD_ACCESS_DENIED"}, status=status.HTTP_403_FORBIDDEN)
    return None


def _request_bool(value, *, default: bool = False) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    normalized = str(value).strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off", ""}:
        return False
    return default


class WorldCollectionView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        worlds = _visible_worlds(request.user)
        query = str(request.query_params.get("q") or "").strip()
        if query:
            worlds = worlds.filter(Q(key__icontains=query) | Q(title__icontains=query))
        requested_status = str(request.query_params.get("status") or "").strip().lower()
        if requested_status in dict(World.STATUS_CHOICES):
            worlds = worlds.filter(status=requested_status)
        return Response(WorldSerializer(worlds, many=True, context={"request": request}).data)

    def post(self, request):
        if not request.user.is_authenticated or not request.user.is_staff:
            return Response({"error": "WORLD_ACCESS_DENIED"}, status=403)
        serializer = WorldSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        world = serializer.save(created_by=request.user)
        WorldMembership.objects.get_or_create(
            world=world,
            user=request.user,
            defaults={"role": WorldMembership.ROLE_OWNER},
        )
        audit(event_type="world_created", world=world, actor=request.user)
        return Response(WorldSerializer(world, context={"request": request}).data, status=201)


class WorldDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, world_key: str):
        try:
            world = _visible_worlds(request.user).get(key=world_key)
        except World.DoesNotExist:
            return Response({"error": "WORLD_NOT_FOUND"}, status=404)
        return Response(WorldSerializer(world, context={"request": request}).data)

    def patch(self, request, world_key: str):
        try:
            world = _get_world(world_key)
        except World.DoesNotExist:
            return Response({"error": "WORLD_NOT_FOUND"}, status=404)
        denied = _manage_or_403(request, world)
        if denied:
            return denied
        serializer = WorldSerializer(world, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        audit(event_type="world_updated", world=world, actor=request.user, metadata={"fields": list(request.data.keys())})
        return Response(serializer.data)


class SeedPackListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({"error": "WORLD_ACCESS_DENIED"}, status=403)
        try:
            discover_seed_packs(persist=True)
        except SeedPackError as exc:
            return Response({"error": "WORLD_SEED_INVALID", "detail": str(exc)}, status=400)
        records = SeedPackRecord.objects.all().order_by("key", "-version")
        return Response(SeedPackRecordSerializer(records, many=True).data)


class WorldBuildReleaseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, world_key: str):
        try:
            world = _get_world(world_key)
        except World.DoesNotExist:
            return Response({"error": "WORLD_NOT_FOUND"}, status=404)
        denied = _manage_or_403(request, world)
        if denied:
            return denied
        if world.status == World.STATUS_ARCHIVED:
            return Response({"error": "WORLD_ARCHIVED"}, status=409)

        seed_key = str(request.data.get("seed_pack_key") or "").strip().lower()
        if not seed_key:
            return Response({"error": "seed_pack_key is required"}, status=400)
        seed_version = str(request.data.get("seed_version") or "").strip() or None

        # Validate/resolve the requested pack before creating a persistent queue job.
        # The expensive schema/migration/import work still happens only in Celery.
        try:
            pack, _record = get_seed_pack(seed_key, seed_version)
        except SeedPackError as exc:
            return Response({"error": "WORLD_SEED_INVALID", "detail": str(exc)}, status=400)

        promote_after_build = _request_bool(request.data.get("promote"))
        existing_job = world.build_jobs.filter(
            status__in=(
                WorldBuildJob.STATUS_QUEUED,
                WorldBuildJob.STATUS_BUILDING,
                WorldBuildJob.STATUS_VALIDATING,
            ),
            seed_pack_key=pack.world_key,
            seed_version=pack.version,
            promote_after_build=promote_after_build,
        ).first()
        if existing_job is not None:
            return Response(
                WorldBuildJobSerializer(existing_job).data,
                status=status.HTTP_202_ACCEPTED,
            )

        job = WorldBuildJob.objects.create(
            world=world,
            requested_by=request.user,
            seed_pack_key=pack.world_key,
            seed_version=pack.version,
            promote_after_build=promote_after_build,
            metadata_json={
                "architecture_lock": "KX-WORLDS-1",
                "seed_checksum": pack.checksum,
                "scenario_count": len(pack.scenario_paths),
            },
        )
        audit(
            event_type="release_build_job_queued",
            world=world,
            actor=request.user,
            metadata={"build_job_id": job.id, "seed": f"{pack.world_key}@{pack.version}"},
        )
        try:
            enqueue_world_build_job(job)
        except Exception as exc:
            job.status = WorldBuildJob.STATUS_FAILED
            job.error_text = str(exc)
            job.finished_at = timezone.now()
            job.save(update_fields=["status", "error_text", "finished_at", "updated_at"])
            audit(
                event_type="release_build_job_failed",
                world=world,
                actor=request.user,
                metadata={"build_job_id": job.id, "error": str(exc), "stage": "enqueue"},
            )
            return Response(
                {
                    "error": "WORLD_BUILD_QUEUE_UNAVAILABLE",
                    "detail": str(exc),
                    "job": WorldBuildJobSerializer(job).data,
                },
                status=503,
            )

        return Response(WorldBuildJobSerializer(job).data, status=status.HTTP_202_ACCEPTED)


class WorldBuildJobListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, world_key: str):
        try:
            world = _get_world(world_key)
        except World.DoesNotExist:
            return Response({"error": "WORLD_NOT_FOUND"}, status=404)
        denied = _manage_or_403(request, world)
        if denied:
            return denied
        jobs = world.build_jobs.select_related("release", "requested_by")[:200]
        return Response(WorldBuildJobSerializer(jobs, many=True).data)


class WorldBuildJobDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, world_key: str, job_id: int):
        try:
            world = _get_world(world_key)
            job = world.build_jobs.select_related("release", "requested_by").get(pk=job_id)
        except (World.DoesNotExist, WorldBuildJob.DoesNotExist):
            return Response({"error": "WORLD_BUILD_JOB_NOT_FOUND"}, status=404)
        denied = _manage_or_403(request, world)
        if denied:
            return denied
        return Response(WorldBuildJobSerializer(job).data)


class WorldReleasePromoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, world_key: str, release_id: int):
        try:
            world = _get_world(world_key)
            release = world.releases.get(pk=release_id)
        except (World.DoesNotExist, WorldRelease.DoesNotExist):
            return Response({"error": "WORLD_RELEASE_MISMATCH"}, status=404)
        denied = _manage_or_403(request, world)
        if denied:
            return denied
        try:
            promote_release(world=world, release=release, actor=request.user)
        except WorldBuildError as exc:
            return Response({"error": "WORLD_RELEASE_NOT_READY", "detail": str(exc)}, status=400)
        return Response(WorldReleaseSerializer(release).data)


class WorldReleaseListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, world_key: str):
        try:
            world = _get_world(world_key)
        except World.DoesNotExist:
            return Response({"error": "WORLD_NOT_FOUND"}, status=404)
        denied = _manage_or_403(request, world)
        if denied:
            return denied
        return Response(WorldReleaseSerializer(world.releases.all(), many=True).data)


class WorldRollbackView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, world_key: str):
        try:
            world = _get_world(world_key)
            source = world.releases.get(pk=int(request.data.get("release_id")))
        except (World.DoesNotExist, WorldRelease.DoesNotExist, TypeError, ValueError):
            return Response({"error": "WORLD_RELEASE_MISMATCH"}, status=404)
        denied = _manage_or_403(request, world)
        if denied:
            return denied
        try:
            restored = clone_release_state(
                source=source,
                target_world=world,
                actor=request.user,
                reason="rollback",
                target_status=WorldRelease.STATUS_READY,
            )
            promote_release(world=world, release=restored, actor=request.user)
        except WorldBuildError as exc:
            return Response({"error": "WORLD_BUILD_FAILED", "detail": str(exc)}, status=400)
        audit(
            event_type="release_rollback",
            world=world,
            release=restored,
            actor=request.user,
            metadata={"source_release_id": source.id},
        )
        return Response(WorldReleaseSerializer(restored).data, status=201)


class WorldSnapshotCollectionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, world_key: str):
        try:
            world = _get_world(world_key)
        except World.DoesNotExist:
            return Response({"error": "WORLD_NOT_FOUND"}, status=404)
        denied = _manage_or_403(request, world)
        if denied:
            return denied
        return Response(WorldSnapshotSerializer(world.snapshots.all(), many=True).data)

    def post(self, request, world_key: str):
        try:
            world = _get_world(world_key)
        except World.DoesNotExist:
            return Response({"error": "WORLD_NOT_FOUND"}, status=404)
        denied = _manage_or_403(request, world)
        if denied:
            return denied
        label = str(request.data.get("label") or "snapshot")
        try:
            snapshot = create_snapshot(world=world, label=label, actor=request.user)
        except (ValueError, WorldBuildError) as exc:
            return Response({"error": "WORLD_SNAPSHOT_FAILED", "detail": str(exc)}, status=400)
        return Response(WorldSnapshotSerializer(snapshot).data, status=201)


class WorldSnapshotRestoreView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, world_key: str, snapshot_id: int):
        try:
            world = _get_world(world_key)
            snapshot = world.snapshots.get(pk=snapshot_id)
        except (World.DoesNotExist, WorldSnapshot.DoesNotExist):
            return Response({"error": "WORLD_SNAPSHOT_NOT_FOUND"}, status=404)
        denied = _manage_or_403(request, world)
        if denied:
            return denied
        try:
            restored = restore_snapshot(
                snapshot=snapshot,
                actor=request.user,
                promote=bool(request.data.get("promote", False)),
            )
        except (ValueError, WorldBuildError) as exc:
            return Response({"error": "WORLD_SNAPSHOT_RESTORE_FAILED", "detail": str(exc)}, status=400)
        return Response(WorldReleaseSerializer(restored).data, status=201)


class WorldCloneView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, world_key: str):
        try:
            source_world = _get_world(world_key)
        except World.DoesNotExist:
            return Response({"error": "WORLD_NOT_FOUND"}, status=404)
        denied = _manage_or_403(request, source_world)
        if denied:
            return denied
        if source_world.current_release is None:
            return Response({"error": "WORLD_RELEASE_NOT_READY"}, status=400)
        target_key = str(request.data.get("target_key") or "").strip()
        title = str(request.data.get("title") or target_key).strip()
        if not target_key:
            return Response({"error": "target_key is required"}, status=400)
        normalized_target_key = target_key.lower()
        if World.objects.filter(key=normalized_target_key).exists():
            return Response({"error": "WORLD_ALREADY_EXISTS"}, status=409)
        target = World(
            key=normalized_target_key,
            title=title,
            description=str(request.data.get("description") or source_world.description),
            visibility=request.data.get("visibility") or source_world.visibility,
            created_by=request.user,
            parent_world=source_world,
        )
        try:
            target.full_clean()
            target.save()
        except ValidationError as exc:
            return Response(
                {"error": "WORLD_INVALID", "detail": exc.message_dict},
                status=400,
            )
        WorldMembership.objects.create(
            world=target, user=request.user, role=WorldMembership.ROLE_OWNER
        )
        try:
            release = clone_release_state(
                source=source_world.current_release,
                target_world=target,
                actor=request.user,
                reason="fork",
            )
            promote_release(world=target, release=release, actor=request.user)
        except Exception:
            target.status = World.STATUS_MAINTENANCE
            target.save(update_fields=["status"])
            raise
        audit(
            event_type="world_cloned",
            world=target,
            release=release,
            actor=request.user,
            metadata={"source_world_id": source_world.id},
        )
        return Response(WorldSerializer(target, context={"request": request}).data, status=201)


class WorldArchiveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, world_key: str):
        try:
            world = _get_world(world_key)
        except World.DoesNotExist:
            return Response({"error": "WORLD_NOT_FOUND"}, status=404)
        denied = _manage_or_403(request, world)
        if denied:
            return denied
        world.status = World.STATUS_ARCHIVED
        world.archived_at = timezone.now()
        world.save(update_fields=["status", "archived_at", "updated_at"])
        audit(event_type="world_archived", world=world, actor=request.user)
        return Response(status=204)


class WorldRestoreView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, world_key: str):
        try:
            world = _get_world(world_key)
        except World.DoesNotExist:
            return Response({"error": "WORLD_NOT_FOUND"}, status=404)
        denied = _manage_or_403(request, world)
        if denied:
            return denied
        if world.status != World.STATUS_ARCHIVED:
            return Response({"error": "WORLD_NOT_ARCHIVED"}, status=409)

        release = world.current_release
        if release is None or release.status != WorldRelease.STATUS_CURRENT:
            world.status = World.STATUS_MAINTENANCE
            world.archived_at = None
            world.save(update_fields=["status", "archived_at", "updated_at"])
            audit(event_type="world_restored_to_maintenance", world=world, actor=request.user)
            return Response(WorldSerializer(world, context={"request": request}).data, status=200)

        validation = validate_release_schemas(release)
        world.status = World.STATUS_ACTIVE if validation.get("ok") else World.STATUS_MAINTENANCE
        world.archived_at = None
        world.save(update_fields=["status", "archived_at", "updated_at"])
        audit(
            event_type="world_restored", world=world, release=release, actor=request.user,
            metadata={"schema_validation_ok": bool(validation.get("ok"))},
        )
        response_status = 200 if validation.get("ok") else 409
        return Response(
            {
                "world": WorldSerializer(world, context={"request": request}).data,
                "validation": validation,
            },
            status=response_status,
        )


class WorldReleasePurgeView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, world_key: str, release_id: int):
        try:
            world = _get_world(world_key)
            release = world.releases.get(pk=release_id)
        except (World.DoesNotExist, WorldRelease.DoesNotExist):
            return Response({"error": "WORLD_RELEASE_MISMATCH"}, status=404)
        denied = _manage_or_403(request, world)
        if denied:
            return denied
        try:
            purge_release(release=release, actor=request.user)
        except WorldBuildError as exc:
            return Response({"error": "WORLD_PURGE_REFUSED", "detail": str(exc)}, status=409)
        return Response(status=204)


class WorldMembershipCollectionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, world_key: str):
        try:
            world = _get_world(world_key)
        except World.DoesNotExist:
            return Response({"error": "WORLD_NOT_FOUND"}, status=404)
        denied = _manage_or_403(request, world)
        if denied:
            return denied
        memberships = world.memberships.select_related("user").order_by("user__username")
        return Response(WorldMembershipSerializer(memberships, many=True).data)

    def post(self, request, world_key: str):
        try:
            world = _get_world(world_key)
        except World.DoesNotExist:
            return Response({"error": "WORLD_NOT_FOUND"}, status=404)
        denied = _manage_or_403(request, world)
        if denied:
            return denied
        user_id = request.data.get("user_id")
        username = request.data.get("username")
        try:
            user = User.objects.get(pk=user_id) if user_id else User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "USER_NOT_FOUND"}, status=404)
        role = str(request.data.get("role") or WorldMembership.ROLE_VIEWER)
        valid_roles = {value for value, _ in WorldMembership.ROLE_CHOICES}
        if role not in valid_roles:
            return Response({"error": "WORLD_ROLE_INVALID"}, status=400)
        existing = WorldMembership.objects.filter(world=world, user=user).first()
        if (
            existing
            and existing.is_active
            and existing.role == WorldMembership.ROLE_OWNER
            and role != WorldMembership.ROLE_OWNER
            and not WorldMembership.objects.filter(
                world=world, is_active=True, role=WorldMembership.ROLE_OWNER
            ).exclude(pk=existing.pk).exists()
        ):
            return Response({"error": "WORLD_LAST_OWNER_REQUIRED"}, status=409)
        membership, created = WorldMembership.objects.update_or_create(
            world=world,
            user=user,
            defaults={"role": role, "is_active": True},
        )
        audit(
            event_type="world_membership_upserted",
            world=world,
            actor=request.user,
            metadata={"user_id": user.id, "role": role},
        )
        return Response(WorldMembershipSerializer(membership).data, status=201 if created else 200)


class WorldMembershipDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, world_key: str, membership_id: int):
        try:
            world = _get_world(world_key)
            membership = world.memberships.get(pk=membership_id)
        except (World.DoesNotExist, WorldMembership.DoesNotExist):
            return Response({"error": "WORLD_MEMBERSHIP_NOT_FOUND"}, status=404)
        denied = _manage_or_403(request, world)
        if denied:
            return denied
        if membership.user_id == world.created_by_id:
            return Response({"error": "WORLD_OWNER_MEMBERSHIP_REQUIRED"}, status=409)
        if (
            membership.is_active
            and membership.role == WorldMembership.ROLE_OWNER
            and not WorldMembership.objects.filter(
                world=world, is_active=True, role=WorldMembership.ROLE_OWNER
            ).exclude(pk=membership.pk).exists()
        ):
            return Response({"error": "WORLD_LAST_OWNER_REQUIRED"}, status=409)
        user_id = membership.user_id
        membership.delete()
        audit(
            event_type="world_membership_removed",
            world=world,
            actor=request.user,
            metadata={"user_id": user_id},
        )
        return Response(status=204)


class WorldAuditListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, world_key: str):
        try:
            world = _get_world(world_key)
        except World.DoesNotExist:
            return Response({"error": "WORLD_NOT_FOUND"}, status=404)
        denied = _manage_or_403(request, world)
        if denied:
            return denied
        events = world.audit_events.select_related("actor")[:500]
        return Response(WorldAuditEventSerializer(events, many=True).data)


class WorldLivenessView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(world_liveness())


class WorldReadinessView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        report = world_readiness()
        return Response(report, status=200 if report.get("ok") else 503)


class WorldRegistryHealthView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response({"error": "WORLD_ACCESS_DENIED"}, status=403)
        report = world_registry_health()
        return Response(report, status=200 if report.get("ok") else 503)


class WorldSystemHealthView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response({"error": "WORLD_ACCESS_DENIED"}, status=403)
        report = world_system_health()
        return Response(report, status=200 if report.get("ok") else 503)


class WorldRuntimeView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, world_key: str):
        runtime = request.world_runtime
        world = World.objects.get(pk=runtime.world_id)
        release = WorldRelease.objects.get(pk=runtime.release_id)
        persona = getattr(request, "world_persona", None)
        return Response({
            "architecture_lock": "KX-WORLDS-1",
            "world": {"id": world.id, "key": world.key, "title": world.title},
            "release": {
                "id": release.id,
                "number": release.release_number,
                "dirty": release.is_dirty,
            },
            "view_as": None if persona is None else {
                "persona_id": persona.id,
                "display_name": persona.display_name,
            },
        })


class WorldRuntimePersonaListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, world_key: str):
        runtime = request.world_runtime
        persona_ids = WorldPersonaBridge.objects.filter(
            release_id=runtime.release_id
        ).values_list("persona_id", flat=True)
        personas = WorldPersona.objects.filter(pk__in=persona_ids)
        return Response(WorldPersonaSerializer(personas, many=True).data)


class WorldViewAsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, world_key: str):
        runtime = request.world_runtime
        persona_id = request.data.get("persona_id")
        state = dict(request.session.get("konnaxion_world_view_as", {}))
        if persona_id in (None, "", False):
            state.pop(str(runtime.world_id), None)
            request.session["konnaxion_world_view_as"] = state
            audit(
                event_type="view_as_stopped",
                world_id=runtime.world_id,
                release_id=runtime.release_id,
                actor=request.user,
            )
            return Response({"persona_id": None})
        try:
            bridge = WorldPersonaBridge.objects.select_related("persona").get(
                release_id=runtime.release_id,
                persona_id=int(persona_id),
            )
        except (WorldPersonaBridge.DoesNotExist, TypeError, ValueError):
            return Response({"error": "WORLD_PERSONA_NOT_FOUND"}, status=404)
        state[str(runtime.world_id)] = bridge.persona_id
        request.session["konnaxion_world_view_as"] = state
        audit(
            event_type="view_as_started",
            world_id=runtime.world_id,
            release_id=runtime.release_id,
            actor=request.user,
            metadata={"persona_id": bridge.persona_id},
        )
        return Response({"persona_id": bridge.persona_id, "display_name": bridge.display_name})
