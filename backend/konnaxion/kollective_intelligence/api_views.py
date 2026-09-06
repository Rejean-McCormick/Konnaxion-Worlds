# FILE: backend/konnaxion/kollective_intelligence/api_views.py
from rest_framework import permissions, viewsets

from .models import Vote, VoteResult
from .serializers import VoteSerializer, VoteResultSerializer


__all__ = [
    "VoteViewSet",
    "VoteResultViewSet",
]


class VoteViewSet(viewsets.ModelViewSet):
    """
    Smart-Vote endpoint for raw + weighted ballots.

    Mounted via `config/api_router.py` as:

        /api/kollective/votes/

    Behaviour:

    - GET /api/kollective/votes/
        List votes, optionally filtered by:
          * target_type
          * target_id
          * user (username)

    - POST /api/kollective/votes/
        Create a new vote. The authenticated user is always
        set as `user` on the Vote model, regardless of payload.

    The serializer exposes:

      id, user (string), target_type, target_id,
      raw_value, weighted_value, voted_at
    """

    queryset = Vote.objects.select_related("user").all()
    serializer_class = VoteSerializer
    # Allow unauthenticated GET for analytics; keep auth for writes
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        """
        Apply simple filters based on query params so the UI
        can request votes for a particular poll/target.

        Supported query params:
          - target_type
          - target_id
          - user (matches related User.username)
        """
        qs = self.queryset
        params = self.request.query_params

        target_type = params.get("target_type")
        if target_type:
            qs = qs.filter(target_type=target_type)

        target_id = params.get("target_id")
        if target_id:
            try:
                qs = qs.filter(target_id=int(target_id))
            except (TypeError, ValueError):
                # Ignore invalid target_id; return unfiltered by id
                pass

        username = params.get("user")
        if username:
            qs = qs.filter(user__username=username)

        return qs.order_by("-voted_at")

    def perform_create(self, serializer):
        """
        On creation, always associate the vote with the
        currently authenticated user.
        """
        serializer.save(user=self.request.user)


class VoteResultViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only access to aggregated vote results, if you choose
    to expose them via the same app.

    Typical usage (future/optional):

        GET /api/kollective/vote-results/?target_type=...&target_id=...

    Not currently wired in `config/api_router.py`, but available
    for easy registration later.
    """

    queryset = VoteResult.objects.all()
    serializer_class = VoteResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = self.queryset
        params = self.request.query_params

        target_type = params.get("target_type")
        if target_type:
            qs = qs.filter(target_type=target_type)

        target_id = params.get("target_id")
        if target_id:
            try:
                qs = qs.filter(target_id=int(target_id))
            except (TypeError, ValueError):
                # Ignore invalid target_id; return unfiltered by id
                pass

        return qs.order_by("target_type", "target_id")
