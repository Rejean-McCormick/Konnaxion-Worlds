"""Read-only Smart Vote reading endpoints."""

from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from konnaxion.smart_vote.services.reading_service import build_ethikos_topic_reading


class EthikosTopicReadingView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, topic_id: int):
        payload = build_ethikos_topic_reading(topic_id, viewer=request.user)
        if payload is None:
            return Response(
                {
                    "detail": (
                        "No Smart Vote reading context is bound to this Ethikos topic."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(payload)
