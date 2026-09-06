"""
POST /smart-vote/cast   → creates one Vote row
"""

from rest_framework.generics import CreateAPIView
from rest_framework.permissions import IsAuthenticated

from konnaxion.smart_vote.serializers.ballot import BallotSerializer


class CastBallotView(CreateAPIView):
    serializer_class = BallotSerializer
    permission_classes = [IsAuthenticated]
