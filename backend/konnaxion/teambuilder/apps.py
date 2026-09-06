# backend/konnaxion/teambuilder/apps.py
from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _

class TeamBuilderConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "konnaxion.teambuilder"
    verbose_name = _("Team Builder")

    def ready(self):
        try:
            import konnaxion.teambuilder.signals  # noqa: F401
        except ImportError:
            pass