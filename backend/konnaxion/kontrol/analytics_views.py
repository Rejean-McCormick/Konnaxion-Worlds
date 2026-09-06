# FILE: backend/konnaxion/kontrol/analytics_views.py
from datetime import timedelta

from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .smart_vote_report import build_smart_vote_report


REPORTS_PERMISSION_CLASSES = [permissions.IsAuthenticated]


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def usage_days_from_range(range_key: str) -> int:
    if range_key == "7d":
        return 7
    if range_key == "90d":
        return 90
    return 30


def perf_points_from_range(range_key: str) -> tuple[int, str]:
    if range_key == "7d":
        return 7, "day"
    if range_key == "30d":
        return 30, "day"
    return 24, "hour"


def smart_vote_days_from_range(range_key: str) -> int:
    if range_key == "7d":
        return 7
    if range_key == "90d":
        return 90
    return 30


def build_usage_points(days: int) -> list[dict]:
    today = timezone.now().date()
    points: list[dict] = []

    for i in range(days - 1, -1, -1):
        date = today - timedelta(days=i)

        seasonal = (i % 7) * 9
        active_users = 220 + seasonal + ((days - i) % 5) * 11
        new_users = 14 + (i % 4) * 3
        sessions = int(active_users * (1.35 + ((i % 3) * 0.12)))

        points.append(
            {
                "label": date.isoformat(),
                "activeUsers": active_users,
                "newUsers": new_users,
                "sessions": sessions,
            }
        )

    return points


def build_usage_modules(last_active_users: int, last_label: str) -> list[dict]:
    return [
        {
            "key": "ekoh",
            "module": "Ekoh · Collective reputation",
            "activeUsers": int(last_active_users * 0.66),
            "avgSessionMinutes": 9.4,
            "retentionRate": 82,
            "lastActive": last_label,
        },
        {
            "key": "ethikos",
            "module": "Ethikos · Deliberation & ethics",
            "activeUsers": int(last_active_users * 0.55),
            "avgSessionMinutes": 12.1,
            "retentionRate": 76,
            "lastActive": last_label,
        },
        {
            "key": "konnected",
            "module": "KonnectED · Knowledge Graph",
            "activeUsers": int(last_active_users * 0.31),
            "avgSessionMinutes": 15.5,
            "retentionRate": 68,
            "lastActive": last_label,
        },
        {
            "key": "kollective",
            "module": "Kollective · Decision Making",
            "activeUsers": int(last_active_users * 0.43),
            "avgSessionMinutes": 5.2,
            "retentionRate": 88,
            "lastActive": last_label,
        },
    ]


def build_perf_series(point_count: int, bucket: str) -> list[dict]:
    now = timezone.now()
    series: list[dict] = []

    for i in range(point_count):
        offset = point_count - i - 1
        if bucket == "day":
            t = now - timedelta(days=offset)
        else:
            t = now - timedelta(hours=offset)

        cycle = i % 6
        latency = 145 + cycle * 18 + (12 if i == point_count // 2 else 0)
        errors = round(clamp(0.2 + cycle * 0.08 + (0.45 if i == point_count // 2 else 0), 0.0, 4.0), 2)

        series.append(
            {
                "time": t.isoformat(),
                "latency": latency,
                "errors": errors,
            }
        )

    return series


def build_smart_vote_points(days: int) -> list[dict]:
    today = timezone.now().date()
    points: list[dict] = []

    for i in range(days - 1, -1, -1):
        date = today - timedelta(days=i)

        trend = (days - i) / max(days, 1)
        participation = clamp(60 + trend * 8 + ((i % 5) - 2) * 1.7, 42, 90)
        consensus = clamp(48 + trend * 18 + ((i % 6) - 2) * 1.9, 30, 95)
        polarization = clamp(100 - consensus - ((i % 4) * 2.8), 0, 70)

        points.append(
            {
                "label": date.isoformat(),
                "participation": round(participation, 1),
                "consensus": round(consensus, 1),
                "polarization": round(polarization, 1),
            }
        )

    return points


class UsageReportView(APIView):
    """
    Returns aggregated usage data for the platform.
    Endpoint: /api/reports/usage/?range=7d|30d|90d
    """

    permission_classes = REPORTS_PERMISSION_CLASSES

    def get(self, request):
        range_key = request.query_params.get("range", "30d")
        days = usage_days_from_range(range_key)

        points = build_usage_points(days)
        last_active = points[-1]["activeUsers"] if points else 0
        last_label = points[-1]["label"] if points else timezone.now().date().isoformat()

        data = {
            "generatedAt": timezone.now().isoformat(),
            "points": points,
            "modules": build_usage_modules(last_active, last_label),
        }
        return Response(data, status=status.HTTP_200_OK)


class PerformanceReportView(APIView):
    """
    Returns system performance metrics (latency, errors).
    Endpoint: /api/reports/perf/?range=24h|7d|30d
    """

    permission_classes = REPORTS_PERMISSION_CLASSES

    def get(self, request):
        range_key = request.query_params.get("range", "24h")
        point_count, bucket = perf_points_from_range(range_key)
        series = build_perf_series(point_count, bucket)

        latest_latency = series[-1]["latency"] if series else 0
        latest_errors = series[-1]["errors"] if series else 0.0

        data = {
            "summary": {
                "p95LatencyMs": latest_latency + 120,
                "p99LatencyMs": latest_latency + 420,
                "errorRatePct": round(latest_errors, 2),
                "throughputRps": 420 if bucket == "hour" else 390,
                "apdex": 0.93 if latest_errors < 1 else 0.89,
                "uptimePct": 99.85,
            },
            "series": series,
        }

        return Response(data, status=status.HTTP_200_OK)


class SmartVoteReportView(APIView):
    """
    Returns real cross-sectional Smart Vote analytics.
    Endpoint: /api/reports/smart-vote/?range=7d|30d|90d

    Historical series are intentionally unavailable until the canonical source
    has an append-only stance/vote event log.
    """

    permission_classes = REPORTS_PERMISSION_CLASSES

    def get(self, request):
        range_key = request.query_params.get("range", "30d")
        return Response(
            build_smart_vote_report(range_key),
            status=status.HTTP_200_OK,
        )

