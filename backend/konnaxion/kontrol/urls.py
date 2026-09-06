# FILE: backend/konnaxion/kontrol/urls.py
from django.urls import path

from .analytics_views import (
    UsageReportView,
    PerformanceReportView,
    SmartVoteReportView,
)

app_name = "kontrol"

urlpatterns = [
    # ------------------------------------------------------------------
    # Analytics & Reporting Endpoints
    # Called by the frontend charts at /reports/*
    # ------------------------------------------------------------------
    path("reports/usage/", UsageReportView.as_view(), name="report-usage"),
    path("reports/perf/", PerformanceReportView.as_view(), name="report-perf"),
    path("reports/smart-vote/", SmartVoteReportView.as_view(), name="report-smart-vote"),
]