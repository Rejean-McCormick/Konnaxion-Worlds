from django.contrib import admin

from .models import (
    SeedPackRecord, World, WorldAuditEvent, WorldBuildJob, WorldMembership, WorldPersona,
    WorldPersonaBridge, WorldRelease, WorldSnapshot,
)

admin.site.register(World)
admin.site.register(WorldRelease)
admin.site.register(WorldBuildJob)
admin.site.register(SeedPackRecord)
admin.site.register(WorldMembership)
admin.site.register(WorldPersona)
admin.site.register(WorldPersonaBridge)
admin.site.register(WorldSnapshot)
admin.site.register(WorldAuditEvent)
