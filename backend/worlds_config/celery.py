import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "worlds_config.settings")

app = Celery("konnaxion_worlds")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
