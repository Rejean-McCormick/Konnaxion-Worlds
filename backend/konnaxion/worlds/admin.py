from django.contrib import admin

from .models import (
    SeedPackRecord,
    Universe,
    UniverseMembership,
    World,
    WorldAuditEvent,
    WorldBuildJob,
    WorldMembership,
    WorldPersona,
    WorldPersonaBridge,
    WorldPublication,
    WorldRelation,
    WorldRelease,
    WorldSnapshot,
    WorldSubscription,
)

for model in (
    Universe, UniverseMembership,
    World, WorldRelease, WorldBuildJob, SeedPackRecord, WorldMembership,
    WorldPersona, WorldPersonaBridge, WorldSnapshot, WorldAuditEvent,
    WorldRelation, WorldPublication, WorldSubscription,
):
    admin.site.register(model)
