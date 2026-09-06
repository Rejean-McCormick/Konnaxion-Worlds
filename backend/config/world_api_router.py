"""World-scoped DRF router.

This router intentionally excludes global/control-plane APIs such as users and
admin. It reuses the canonical ViewSet registrations from ``config.api_router``
so route drift cannot fork between global-legacy and World runtime surfaces.
"""

from django.conf import settings
from rest_framework.routers import DefaultRouter, SimpleRouter

from config.api_router import router as canonical_router

WORLD_PREFIXES = (
    "ethikos/",
    "teambuilder/",
    "keenkonnect/",
    "projects",
    "kollective/",
    "konnected/",
    "kreative/",
)


def _is_world_owned(prefix: str) -> bool:
    return any(prefix == root.rstrip("/") or prefix.startswith(root) for root in WORLD_PREFIXES)


router = DefaultRouter() if settings.DEBUG else SimpleRouter()
for prefix, viewset, basename in canonical_router.registry:
    if _is_world_owned(prefix):
        router.register(prefix, viewset, basename=f"world-{basename}")

app_name = "world_api"
urlpatterns = router.urls
