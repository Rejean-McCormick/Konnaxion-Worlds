"""
URL router for the Ekoh app.
Import this in the project-level urls:

    path("api/v1/ekoh/", include("konnaxion.ekoh.urls"))
"""

from django.urls import path

from konnaxion.ekoh.views.profile import ProfileView

app_name = "ekoh"

urlpatterns = [
    path("profile/<int:uid>/", ProfileView.as_view(), name="profile"),
]
