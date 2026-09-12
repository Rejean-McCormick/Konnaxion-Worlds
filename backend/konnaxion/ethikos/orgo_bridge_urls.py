from django.urls import path

from .orgo_bridge_views import (
    orgo_bridge_health,
    orgo_bridge_impacts,
    orgo_bridge_publish,
)

app_name = "orgo_konnaxion_bridge"

urlpatterns = [
    path("health/", orgo_bridge_health, name="health"),
    path("<slug:world_key>/publish/", orgo_bridge_publish, name="publish"),
    path("<slug:world_key>/impacts/", orgo_bridge_impacts, name="impacts"),
]
