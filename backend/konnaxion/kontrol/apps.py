# FILE: backend/konnaxion/kontrol/apps.py
from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class KontrolConfig(AppConfig):
    name = "konnaxion.kontrol"
    verbose_name = _("Kontrol (Admin & Moderation)")

    def ready(self):
        try:
            import konnaxion.kontrol.signals  # noqa: F401
        except ImportError:
            pass