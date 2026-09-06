# FILE: backend/konnaxion/kreative/admin.py
# template for konnaxion/<app>/admin.py
from django.contrib import admin
from django.apps import apps

app_config = apps.get_app_config(__name__.split(".")[-2])  # resolves to the app name
for model in app_config.get_models():
    if not admin.site.is_registered(model):
        admin.site.register(model)
