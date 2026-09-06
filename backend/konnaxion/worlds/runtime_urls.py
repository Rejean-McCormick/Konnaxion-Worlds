from django.urls import path

from . import api_views

app_name = "world_runtime"

urlpatterns = [
    path("runtime/", api_views.WorldRuntimeView.as_view(), name="runtime"),
    path("runtime/personas/", api_views.WorldRuntimePersonaListView.as_view(), name="personas"),
    path("runtime/view-as/", api_views.WorldViewAsView.as_view(), name="view-as"),
]
