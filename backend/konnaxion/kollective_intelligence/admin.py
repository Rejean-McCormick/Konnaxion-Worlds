# FILE: backend/konnaxion/kollective_intelligence/admin.py
from django.contrib import admin
from .models import ExpertiseCategory

@admin.register(ExpertiseCategory)
class ExpertiseCategoryAdmin(admin.ModelAdmin):
    search_fields = ("name",)
    list_display = ("name",)
    list_per_page = 30

# Register any other models generically if not already registered
from django.apps import apps
app_config = apps.get_app_config(__name__.split(".")[-2])
for model in app_config.get_models():
    if not admin.site.is_registered(model):
        admin.site.register(model)
