# backend/konnaxion/ethikos/demo_import/views.py

from django.conf import settings
from rest_framework import permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from .importer import (
    import_ethikos_demo_scenario,
    reset_ethikos_demo_scenario,
    validate_and_preview_ethikos_demo_scenario,
)
from .schema import FEATURE_FLAG_NAME
from .serializers import DemoScenarioResetSerializer


def ensure_demo_importer_enabled() -> None:
    """
    Feature gate for the ethiKos Demo Importer.

    Required setting:
        ETHIKOS_DEMO_IMPORTER_ENABLED = True
    """
    if not getattr(settings, FEATURE_FLAG_NAME, False):
        raise PermissionDenied("Ethikos Demo Importer is disabled.")


def response_for_import_result(result: dict) -> Response:
    """
    Return a consistent HTTP response for importer service results.
    """
    response_status = (
        status.HTTP_200_OK
        if result.get("ok")
        else status.HTTP_400_BAD_REQUEST
    )

    return Response(result, status=response_status)


class EthikosDemoScenarioPreviewView(APIView):
    """
    Validate and summarize a demo scenario JSON without writing to the database.

    POST /api/ethikos/demo-scenarios/preview/
    """

    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        ensure_demo_importer_enabled()

        result = validate_and_preview_ethikos_demo_scenario(request.data)

        return response_for_import_result(result)


class EthikosDemoScenarioImportView(APIView):
    """
    Import a demo scenario JSON into ethiKos.

    POST /api/ethikos/demo-scenarios/import/
    """

    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        ensure_demo_importer_enabled()

        result = import_ethikos_demo_scenario(
            request.data,
            imported_by=request.user,
            dry_run=False,
        )

        return response_for_import_result(result)


class EthikosDemoScenarioResetView(APIView):
    """
    Delete all objects previously imported for one demo scenario.

    POST /api/ethikos/demo-scenarios/reset/

    Expected payload:
        {
            "scenario_key": "public_square_demo"
        }
    """

    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        ensure_demo_importer_enabled()

        serializer = DemoScenarioResetSerializer(data=request.data)
        if not serializer.is_valid():
            scenario_errors = serializer.errors.get("scenario_key")
            if scenario_errors:
                return Response(
                    {
                        "ok": False,
                        "error": "scenario_key is required",
                        "errors": serializer.errors,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response(
                {
                    "ok": False,
                    "error": "Invalid reset payload",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = reset_ethikos_demo_scenario(
            serializer.validated_data["scenario_key"],
            reset_by=request.user,
        )

        return response_for_import_result(result)
