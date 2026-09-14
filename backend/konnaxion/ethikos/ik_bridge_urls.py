from django.urls import path

from .ik_bridge_views import ik_interaction_ingress

app_name = "interaction_kernel_bridge"

urlpatterns = [
    path("<slug:world_key>/interactions/", ik_interaction_ingress, name="interactions"),
]
