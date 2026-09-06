# FILE: backend/config/settings/settings_addons.py
"""
EkoH / Smart-Vote integration settings.

This module is imported at the end of config/settings/base.py.
"""

import os

from celery.schedules import crontab

EKOH_INSTALLED_APPS = [
    "konnaxion.ekoh",
    "konnaxion.smart_vote",
]

EKOH_CELERY_BEAT_SCHEDULE = {
    "ekoh-score-recalc": {
        "task": "ekoh_score_recalc",
        "schedule": crontab(hour=2, minute=0),
    },
    "ekoh-contextual-analysis": {
        "task": "contextual_analysis_batch",
        "schedule": crontab(minute="*/30"),
    },
    "smartvote-vote-result-aggregator": {
        "task": "vote_result_aggregator",
        "schedule": crontab(minute="*/5"),
    },
}

EKOH_DB_SEARCH_PATH = "ekoh_smartvote,public"

KAFKA_BOOTSTRAP_SERVERS = os.getenv(
    "KAFKA_BOOTSTRAP_SERVERS",
    "localhost:9092",
)
