# FILE: backend/config/celery_app.py
# config/celery_app.py

import os
import logging.config

from celery import Celery
from celery.signals import setup_logging

# Set the default Django settings module for the 'celery' program.
# This will only be used if DJANGO_SETTINGS_MODULE is not already set
# in the environment (e.g. by your process manager).
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")

# Name of the Celery app (can be your Django project or any name you prefer)
app = Celery("konnaxion")

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix in Django settings.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()


@setup_logging.connect
def configure_logging(*args, **kwargs) -> None:
    """
    Configure Celery logging using Django's LOGGING setting.
    This prevents Celery from overriding Django's logging configuration.
    """
    from django.conf import settings

    logging.config.dictConfig(settings.LOGGING)


@app.task(bind=True)
def debug_task(self):
    """
    Simple debug task to verify Celery is working.
    You can call this with: debug_task.delay()
    """
    print(f"Request: {self.request!r}")
