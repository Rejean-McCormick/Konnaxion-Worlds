from django.urls import path

from . import api_views

app_name = "worlds"

urlpatterns = [
    path("worlds/", api_views.WorldCollectionView.as_view(), name="world-list"),
    path("worlds/<slug:world_key>/", api_views.WorldDetailView.as_view(), name="world-detail"),
    path("worlds/<slug:world_key>/releases/", api_views.WorldReleaseListView.as_view(), name="release-list"),
    path("worlds/<slug:world_key>/releases/build/", api_views.WorldBuildReleaseView.as_view(), name="release-build"),
    path("worlds/<slug:world_key>/build-jobs/", api_views.WorldBuildJobListView.as_view(), name="build-job-list"),
    path("worlds/<slug:world_key>/build-jobs/<int:job_id>/", api_views.WorldBuildJobDetailView.as_view(), name="build-job-detail"),
    path("worlds/<slug:world_key>/releases/<int:release_id>/promote/", api_views.WorldReleasePromoteView.as_view(), name="release-promote"),
    path("worlds/<slug:world_key>/releases/<int:release_id>/purge/", api_views.WorldReleasePurgeView.as_view(), name="release-purge"),
    path("worlds/<slug:world_key>/rollback/", api_views.WorldRollbackView.as_view(), name="world-rollback"),
    path("worlds/<slug:world_key>/snapshots/", api_views.WorldSnapshotCollectionView.as_view(), name="snapshot-list"),
    path("worlds/<slug:world_key>/snapshots/<int:snapshot_id>/restore/", api_views.WorldSnapshotRestoreView.as_view(), name="snapshot-restore"),
    path("worlds/<slug:world_key>/clone/", api_views.WorldCloneView.as_view(), name="world-clone"),
    path("worlds/<slug:world_key>/archive/", api_views.WorldArchiveView.as_view(), name="world-archive"),
    path("worlds/<slug:world_key>/restore/", api_views.WorldRestoreView.as_view(), name="world-restore"),
    path("worlds/<slug:world_key>/memberships/", api_views.WorldMembershipCollectionView.as_view(), name="membership-list"),
    path("worlds/<slug:world_key>/memberships/<int:membership_id>/", api_views.WorldMembershipDetailView.as_view(), name="membership-detail"),
    path("worlds/<slug:world_key>/audit/", api_views.WorldAuditListView.as_view(), name="world-audit"),
    path("seed-packs/", api_views.SeedPackListView.as_view(), name="seed-pack-list"),
    path("health/live/", api_views.WorldLivenessView.as_view(), name="health-live"),
    path("health/ready/", api_views.WorldReadinessView.as_view(), name="health-ready"),
    path("health/registry/", api_views.WorldRegistryHealthView.as_view(), name="health-registry"),
    path("health/deep/", api_views.WorldSystemHealthView.as_view(), name="health-deep"),
    # Backward-compatible explicit-admin deep health endpoint.
    path("health/", api_views.WorldSystemHealthView.as_view(), name="health"),
]
