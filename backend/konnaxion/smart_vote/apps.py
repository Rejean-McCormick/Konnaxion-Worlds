# backend/konnaxion/smart_vote/apps.py

from __future__ import annotations

import logging
from django.apps import AppConfig

LOGGER = logging.getLogger(__name__)


class SmartVoteConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "konnaxion.smart_vote"
    label = "smart_vote"
    verbose_name = "Smart-Vote – Weighted Balloting"

    def ready(self) -> None:  # noqa: D401
        """
        App startup hook.

        IMPORTANT:
        Do NOT access the database here; ASGI startup is async and
        Django forbids sync DB access in this context.
        All schema creation and partition setup is handled by migrations.
        """
        LOGGER.debug("Smart-Vote app ready; DB schema handled via migrations.")
