# FILE: backend/config/urls.py

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.urls import include, path
from django.views import defaults as default_views
from django.views.generic import TemplateView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path("", TemplateView.as_view(template_name="pages/home.html"), name="home"),
    path("about/", TemplateView.as_view(template_name="pages/about.html"), name="about"),
    # Django Admin
    path(settings.ADMIN_URL, admin.site.urls),
    # User management (non-API)
    path("users/", include(("konnaxion.users.urls", "users"), namespace="users")),
    path("accounts/", include("allauth.urls")),
    # Media
    *static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT),
]

if settings.DEBUG:
    # Static file serving in dev when using Gunicorn + Uvicorn
    urlpatterns += staticfiles_urlpatterns()

# API URLS
urlpatterns += [
    # ------------------------------------------------------------------
    # Konnaxion Worlds — control plane (global, unscoped)
    # ------------------------------------------------------------------
    path("api/control/", include("konnaxion.worlds.urls")),

    # Orgo -> Konnaxion provider bridge (service-token authenticated).
    # The endpoint resolves/pins the target World internally; it is deliberately
    # outside /api/w/... because WorldRouteMiddleware authenticates human access
    # before DRF/provider authentication runs.
    path(
        "api/integrations/orgo/konnaxion/",
        include("konnaxion.ethikos.orgo_bridge_urls"),
    ),
    # Interaction Kernel compatibility ingress. It maps IK envelopes into
    # the existing provider-owned Orgo impact bridge contract.
    path(
        "api/integrations/ik/konnaxion/",
        include("konnaxion.ethikos.ik_bridge_urls"),
    ),

    # ------------------------------------------------------------------
    # Konnaxion Worlds — runtime scope
    # Middleware pins these routes to one immutable WorldRelease.
    # ------------------------------------------------------------------
    path("api/w/<slug:world_key>/", include("konnaxion.worlds.runtime_urls")),
    path("api/w/<slug:world_key>/", include("config.world_api_router")),
    path("api/w/<slug:world_key>/ethikos/", include("konnaxion.ethikos.demo_import.urls")),
    path("api/w/<slug:world_key>/v1/ekoh/", include("konnaxion.ekoh.urls")),
    path("api/w/<slug:world_key>/v1/smart-vote/", include("konnaxion.smart_vote.urls")),
    path("api/w/<slug:world_key>/", include("konnaxion.kontrol.urls", namespace="world-kontrol")),
    path(
        "api/w/<slug:world_key>/deliberate/",
        include(("konnaxion.ethikos.urls", "world_deliberate"), namespace="world-deliberate"),
    ),
    path(
        "api/w/<slug:world_key>/deliberate/elite/",
        include(("konnaxion.ethikos.urls", "world_deliberate_elite"), namespace="world-deliberate-elite"),
    ),

    # Base API (DRF routers)
    # [NOTE] This router handles:
    # - /api/admin/users (UserAdminViewSet)
    # - /api/admin/moderation (ModerationTicketViewSet)
    # - /api/admin/audit-log (AuditLogViewSet)
    path("api/", include("config.api_router")),

    # ------------------------------------------------------------------
    # ethiKos Demo Importer
    #   /api/ethikos/demo-scenarios/preview/
    #   /api/ethikos/demo-scenarios/import/
    #   /api/ethikos/demo-scenarios/reset/
    # ------------------------------------------------------------------
    path("api/ethikos/", include("konnaxion.ethikos.demo_import.urls")),

    # Auth token (DRF)
    path("api/auth-token/", obtain_auth_token, name="obtain_auth_token"),

    # OpenAPI schema & docs
    path("api/schema/", SpectacularAPIView.as_view(), name="api-schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="api-schema"), name="api-docs"),

    # ------------------------------------------------------------------
    # Ekoh – expertise & ethics profiles
    #   /api/v1/ekoh/profile/<uid>/
    # ------------------------------------------------------------------
    path("api/v1/ekoh/", include("konnaxion.ekoh.urls")),

    # ------------------------------------------------------------------
    # Smart-Vote – weighted balloting
    #   /api/v1/smart-vote/cast/
    # ------------------------------------------------------------------
    path("api/v1/smart-vote/", include("konnaxion.smart_vote.urls")),

    # ------------------------------------------------------------------
    # Analytics / Reports Endpoints
    # [UPDATED] Delegated to konnaxion.kontrol.urls
    # Handles: /api/reports/usage, /api/reports/perf, /api/reports/smart-vote
    # ------------------------------------------------------------------
    path("api/", include("konnaxion.kontrol.urls", namespace="kontrol")),

    # ------------------------------------------------------------------
    # Compat FE aliases: map "deliberate" to existing Ethikos endpoints.
    # Gives /api/deliberate/topics|stances|arguments and
    #       /api/deliberate/elite/topics|stances|arguments
    # ------------------------------------------------------------------
    path(
        "api/deliberate/",
        include(("konnaxion.ethikos.urls", "deliberate"), namespace="deliberate"),
    ),
    path(
        "api/deliberate/elite/",
        include(
            ("konnaxion.ethikos.urls", "deliberate_elite"),
            namespace="deliberate_elite",
        ),
    ),
]

if settings.DEBUG:
    # Debug error pages
    urlpatterns += [
        path("400/", default_views.bad_request, kwargs={"exception": Exception("Bad Request!")}),
        path("403/", default_views.permission_denied, kwargs={"exception": Exception("Permission Denied")}),
        path("404/", default_views.page_not_found, kwargs={"exception": Exception("Page not Found")}),
        path("500/", default_views.server_error),
    ]
    if "debug_toolbar" in settings.INSTALLED_APPS:
        import debug_toolbar

        urlpatterns = [path("__debug__/", include(debug_toolbar.urls)), *urlpatterns]