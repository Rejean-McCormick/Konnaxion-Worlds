from django.http import JsonResponse
from django.urls import include, path


def root(_request):
    return JsonResponse({"app": "konnaxion-worlds", "ok": True})


urlpatterns = [
    path("", root),
    path("api/control/", include("konnaxion.worlds.urls")),
    path("api/w/<slug:world_key>/", include("konnaxion.worlds.runtime_urls")),
]
