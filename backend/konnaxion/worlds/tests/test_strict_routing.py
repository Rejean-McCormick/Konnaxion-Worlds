from __future__ import annotations

from django.test import RequestFactory, override_settings

from konnaxion.worlds.middleware import WorldRouteMiddleware, _requires_world_route
from konnaxion.worlds.services.health import strict_world_routing_enabled


def test_world_owned_legacy_api_boundaries_are_fail_closed():
    for path in (
        "/api/ethikos/topics/",
        "/api/deliberate/topics/",
        "/api/teambuilder/sessions/",
        "/api/keenkonnect/projects/",
        "/api/projects/",
        "/api/konnected/resources/",
        "/api/kreative/artworks/",
        "/api/kollective/votes/",
        "/api/v1/ekoh/profile/1/",
        "/api/v1/smart-vote/cast/",
        "/api/reports/perf/",
        "/api/admin/moderation/",
        "/api/admin/konsensus-config/",
    ):
        assert _requires_world_route(path), path

    for path in (
        "/api/control/worlds/",
        "/api/users/",
        "/api/admin/users/",
        "/api/admin/audit-log/",
        "/api/schema/",
        "/api/docs/",
        "/api/integrations/ik/konnaxion/",
        "/api/projects-old/",
    ):
        assert not _requires_world_route(path), path


def test_middleware_rejects_unscoped_world_owned_api_when_strict():
    reached = {"value": False}

    def app(_request):
        reached["value"] = True
        raise AssertionError("strict routing must reject before the view")

    request = RequestFactory().get("/api/projects/")
    with override_settings(KONNAXION_WORLDS_ENFORCE_SCOPED_API=True):
        response = WorldRouteMiddleware(app)(request)

    assert response.status_code == 400
    assert response.json()["error"] == "WORLD_REQUIRED"
    assert reached["value"] is False


def test_global_api_remains_unscoped_when_strict():
    def app(_request):
        from django.http import JsonResponse

        return JsonResponse({"ok": True})

    request = RequestFactory().get("/api/admin/users/")
    with override_settings(KONNAXION_WORLDS_ENFORCE_SCOPED_API=True):
        response = WorldRouteMiddleware(app)(request)

    assert response.status_code == 200
    assert response.json() == {"ok": True}


def test_health_uses_same_setting_as_middleware():
    with override_settings(KONNAXION_WORLDS_ENFORCE_SCOPED_API=True):
        assert strict_world_routing_enabled() is True
    with override_settings(KONNAXION_WORLDS_ENFORCE_SCOPED_API=False):
        assert strict_world_routing_enabled() is False
