# backend/konnaxion/ethikos/demo_import/urls.py

from django.urls import path

from .views import (
    EthikosDemoScenarioImportView,
    EthikosDemoScenarioPreviewView,
    EthikosDemoScenarioResetView,
)

app_name = "ethikos_demo_import"

urlpatterns = [
    path(
        "demo-scenarios/preview/",
        EthikosDemoScenarioPreviewView.as_view(),
        name="preview",
    ),
    path(
        "demo-scenarios/preview",
        EthikosDemoScenarioPreviewView.as_view(),
        name="preview-no-slash",
    ),
    path(
        "demo-scenarios/import/",
        EthikosDemoScenarioImportView.as_view(),
        name="import",
    ),
    path(
        "demo-scenarios/import",
        EthikosDemoScenarioImportView.as_view(),
        name="import-no-slash",
    ),
    path(
        "demo-scenarios/reset/",
        EthikosDemoScenarioResetView.as_view(),
        name="reset",
    ),
    path(
        "demo-scenarios/reset",
        EthikosDemoScenarioResetView.as_view(),
        name="reset-no-slash",
    ),
]