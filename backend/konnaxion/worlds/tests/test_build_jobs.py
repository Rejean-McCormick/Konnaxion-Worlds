from __future__ import annotations

from types import SimpleNamespace

import pytest
from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework.test import APIRequestFactory, force_authenticate

from konnaxion.worlds import api_views
from konnaxion.worlds.api_views import WorldBuildReleaseView, WorldCollectionView
from konnaxion.worlds.models import World, WorldBuildJob, WorldRelease
from konnaxion.worlds.services.build_queue import world_build_concurrency

pytestmark = pytest.mark.django_db


def test_world_build_concurrency_defaults_to_one_and_is_bounded():
    with override_settings(KONNAXION_WORLD_BUILD_CONCURRENCY=1):
        assert world_build_concurrency() == 1
    with override_settings(KONNAXION_WORLD_BUILD_CONCURRENCY=4):
        assert world_build_concurrency() == 4
    with override_settings(KONNAXION_WORLD_BUILD_CONCURRENCY=999):
        assert world_build_concurrency() == 16


def test_build_api_queues_job_without_building_release(monkeypatch):
    User = get_user_model()
    owner = User.objects.create_user(username="world-build-owner")
    world = World.objects.create(key="queued-world", title="Queued World", created_by=owner)

    pack = SimpleNamespace(
        world_key="queued-world",
        version="1.2.3",
        checksum="abc123",
        scenario_paths=("a.json", "b.json"),
    )
    record = SimpleNamespace()
    monkeypatch.setattr(api_views, "get_seed_pack", lambda key, version=None: (pack, record))

    def fake_enqueue(job):
        job.celery_task_id = "celery-test-task"
        job.save(update_fields=["celery_task_id", "updated_at"])
        return job

    monkeypatch.setattr(api_views, "enqueue_world_build_job", fake_enqueue)

    request = APIRequestFactory().post(
        "/api/control/worlds/queued-world/releases/build/",
        {"seed_pack_key": "queued-world", "seed_version": "1.2.3", "promote": False},
        format="json",
    )
    force_authenticate(request, user=owner)
    response = WorldBuildReleaseView.as_view()(request, world_key=world.key)

    assert response.status_code == 202
    assert response.data["status"] == WorldBuildJob.STATUS_QUEUED
    assert response.data["celery_task_id"] == "celery-test-task"
    assert WorldBuildJob.objects.filter(world=world).count() == 1
    assert WorldRelease.objects.filter(world=world).count() == 0

    duplicate = APIRequestFactory().post(
        "/api/control/worlds/queued-world/releases/build/",
        {"seed_pack_key": "queued-world", "seed_version": "1.2.3", "promote": False},
        format="json",
    )
    force_authenticate(duplicate, user=owner)
    duplicate_response = WorldBuildReleaseView.as_view()(duplicate, world_key=world.key)
    assert duplicate_response.status_code == 202
    assert duplicate_response.data["id"] == response.data["id"]
    assert WorldBuildJob.objects.filter(world=world).count() == 1


def test_catalog_search_remains_simple_at_120_worlds():
    World.objects.bulk_create(
        [
            World(
                key=f"catalog-{index:03d}",
                title=f"Catalog World {index:03d}",
                visibility=World.VISIBILITY_PUBLIC,
            )
            for index in range(120)
        ]
    )

    request = APIRequestFactory().get("/api/control/worlds/?q=119")
    response = WorldCollectionView.as_view()(request)

    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]["key"] == "catalog-119"


def test_build_task_transitions_persisted_job_to_ready(monkeypatch):
    from konnaxion.worlds import tasks as world_tasks

    User = get_user_model()
    owner = User.objects.create_user(username="world-task-owner")
    world = World.objects.create(key="task-world", title="Task World", created_by=owner)
    job = WorldBuildJob.objects.create(
        world=world,
        requested_by=owner,
        seed_pack_key="task-world",
        seed_version="1.0.0",
    )

    released = {"job": False, "slot": False}
    monkeypatch.setattr(world_tasks, "try_acquire_world_build_job_lock", lambda job_id: True)
    monkeypatch.setattr(world_tasks, "try_acquire_world_build_slot", lambda: 0)
    monkeypatch.setattr(
        world_tasks,
        "release_world_build_job_lock",
        lambda job_id: released.__setitem__("job", True),
    )
    monkeypatch.setattr(
        world_tasks,
        "release_world_build_slot",
        lambda slot: released.__setitem__("slot", True),
    )

    def fake_build_world_release(*, world, progress_callback=None, **kwargs):
        release = WorldRelease.objects.create(
            world=world,
            release_number=1,
            status=WorldRelease.STATUS_BUILDING,
            domain_schema="kx_w_task_world_r1",
            ekoh_schema="kx_e_task_world_r1",
            seed_pack_key="task-world",
            seed_version="1.0.0",
        )
        if progress_callback:
            progress_callback(release)
        release.status = WorldRelease.STATUS_VALIDATING
        release.save(update_fields=["status"])
        if progress_callback:
            progress_callback(release)
        release.status = WorldRelease.STATUS_READY
        release.save(update_fields=["status"])
        if progress_callback:
            progress_callback(release)
        return release

    monkeypatch.setattr(world_tasks, "build_world_release", fake_build_world_release)

    result = world_tasks.build_world_release_task.run(job.id)
    job.refresh_from_db()
    assert result["status"] == "ready"
    assert job.status == WorldBuildJob.STATUS_READY
    assert job.release_id is not None
    assert job.attempts == 1
    assert released == {"job": True, "slot": True}
