# FILE: backend/konnaxion/ethikos/urls.py
"""App-local DRF routes for ethiKos.

Kintsugi Wave 1 foundation rules:
- keep canonical ethiKos API resources under /api/ethikos/
- do not introduce /api/kintsugi/, /api/kialo/, /api/korum/, etc.
- register slice-specific ViewSets only when the corresponding ViewSet exists
  in konnaxion.ethikos.api_views.
"""

from __future__ import annotations

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import api_views


router = DefaultRouter()


def register_required(route: str, viewset_name: str, basename: str) -> None:
    """Register a required stable ethiKos route.

    Required routes are part of the current canonical ethiKos API surface and
    should fail loudly if their ViewSet is missing.
    """

    viewset = getattr(api_views, viewset_name)
    router.register(route, viewset, basename=basename)


def register_optional(route: str, viewset_name: str, basename: str) -> None:
    """Register an additive ethiKos route only if its ViewSet exists.

    This keeps the URL module safe while Wave 1 slices are added incrementally.
    """

    viewset = getattr(api_views, viewset_name, None)
    if viewset is not None:
        router.register(route, viewset, basename=basename)


# Stable current ethiKos API surface.
register_required("topics", "TopicViewSet", basename="ethikos-topic")
register_required("stances", "StanceViewSet", basename="ethikos-stance")
register_required("arguments", "ArgumentViewSet", basename="ethikos-argument")

# Existing optional category surface.
register_optional("categories", "CategoryViewSet", basename="ethikos-category")


urlpatterns = [
    path("", include("konnaxion.ethikos.demo_import.urls")),
    *router.urls,
]