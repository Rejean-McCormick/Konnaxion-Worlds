# konnaxion/ekoh/apps.py
"""
Ekoh Django-app configuration.

– Declares the app label `konnaxion.ekoh`.
– All schema / partition DDL is handled in migrations; we deliberately
  avoid any database access here, because `ready()` runs in ASGI
  (async) contexts where synchronous DB calls are forbidden.
"""

import logging
from django.apps import AppConfig

LOGGER = logging.getLogger(__name__)

EKOH_SCHEMA = "ekoh_smartvote"


class EkohConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "konnaxion.ekoh"
    verbose_name = "EkoH – Expertise & Ethics"

    def ready(self) -> None:
        """
        Lightweight startup hook.

        Intentionally does NOT touch the database; this keeps it safe
        under ASGI/uvicorn where `ready()` may be called from an async
        context.
        """
        try:
            # Optional: ensure model module is imported for signals, etc.
            from . import models  # noqa: F401
        except Exception:
            # Log but do not block app startup.
            LOGGER.exception("EkoH app failed to import models during ready().")
