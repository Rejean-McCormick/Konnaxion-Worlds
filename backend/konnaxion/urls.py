# FILE: backend/konnaxion/urls.py
# konnaxion/urls.py

from django.urls import path, include

urlpatterns = [
    # ...
    path("api/ethikos/", include("konnaxion.ethikos.urls")),
    # ...
]
