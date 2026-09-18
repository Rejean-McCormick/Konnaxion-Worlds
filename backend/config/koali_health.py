from django.db import connection
from django.http import JsonResponse


def live(_request):
    return JsonResponse({"status": "alive", "service": "konnaxion"})


def ready(_request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        return JsonResponse({"status": "ready", "database": "up"})
    except Exception as exc:
        return JsonResponse(
            {"status": "not_ready", "database": "down", "detail": str(exc)},
            status=503,
        )
