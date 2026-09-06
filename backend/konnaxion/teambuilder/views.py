# backend/konnaxion/teambuilder/views.py
from django.db.models import Count
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    BuilderSession,
    Team,
    Problem,
    ProblemChangeEvent,
)
from .serializers import (
    BuilderSessionSerializer,
    TeamSerializer,
    ProblemSerializer,
    ProblemChangeEventSerializer,
    ProblemSessionSummarySerializer,
)
from .logic import generate_teams_for_session


class BuilderSessionViewSet(viewsets.ModelViewSet):
    """
    CRUD for Team Builder Sessions.
    Includes a custom action to trigger the team generation algorithm.
    """
    queryset = (
        BuilderSession.objects.all()
        .select_related("problem", "created_by")
        .prefetch_related("candidates", "teams__members")
        .order_by("-created_at")
    )
    serializer_class = BuilderSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Automatically assign the logged-in user as the creator
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def generate(self, request, pk=None):
        """
        Triggers the algorithmic distribution of candidates into teams.
        POST /api/teambuilder/sessions/{id}/generate/
        """
        # Call the logic engine
        result = generate_teams_for_session(session_id=str(pk))

        if "error" in result:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        # Re-fetch the session to return the updated status and new teams
        session = self.get_object()
        serializer = self.get_serializer(session)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TeamViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only view for generated teams.
    Useful if we need to fetch a specific team's details without loading the whole session.
    """
    queryset = Team.objects.all().select_related("session").order_by("name")
    serializer_class = TeamSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["session"]


class ProblemViewSet(viewsets.ModelViewSet):
    """
    CRUD for reusable Problem templates used by Team Builder sessions.
    - List: used by the Problem library (/teambuilder/problems).
    - Retrieve: returns problem + sessions + history for detail page.
    """

    serializer_class = ProblemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Annotate usage_count from linked sessions; average_outcome can be
        # added later via additional aggregates if you store outcome scores.
        return (
            Problem.objects.all()
            .annotate(usage_count=Count("sessions"))
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        problem = serializer.save(created_by=self.request.user)
        # Record a basic "created" event for history
        ProblemChangeEvent.objects.create(
            problem=problem,
            type=ProblemChangeEvent.EventType.CREATED,
            title="Problem created",
            description=f"Problem '{problem.name}' was created.",
            changed_by=self.request.user,
        )

    def perform_update(self, serializer):
        problem = serializer.save()
        # Simple generic edit event; you can refine this later to log diffs
        ProblemChangeEvent.objects.create(
            problem=problem,
            type=ProblemChangeEvent.EventType.EDIT,
            title="Problem updated",
            description=f"Problem '{problem.name}' was updated.",
            changed_by=self.request.user,
        )

    def perform_destroy(self, instance):
        name = instance.name
        ProblemChangeEvent.objects.create(
            problem=instance,
            type=ProblemChangeEvent.EventType.OTHER,
            title="Problem deleted",
            description=f"Problem '{name}' was deleted.",
            changed_by=self.request.user,
        )
        super().perform_destroy(instance)

    def retrieve(self, request, *args, **kwargs):
        """
        Return composite payload expected by the frontend:

        {
          "problem": { ...ProblemSerializer... },
          "sessions": [ ...ProblemSessionSummarySerializer... ],
          "history": [ ...ProblemChangeEventSerializer... ]
        }
        """
        problem = self.get_object()

        # Base problem data (includes annotated usage_count)
        problem_data = self.get_serializer(problem).data

        # Sessions that reference this problem
        sessions_qs = (
            BuilderSession.objects.filter(problem=problem)
            .order_by("-created_at")
        )
        sessions_data = ProblemSessionSummarySerializer(
            sessions_qs,
            many=True,
        ).data

        # Change history / timeline
        history_qs = problem.change_events.order_by("-timestamp")
        history_data = ProblemChangeEventSerializer(
            history_qs,
            many=True,
            context=self.get_serializer_context(),
        ).data

        return Response(
            {
                "problem": problem_data,
                "sessions": sessions_data,
                "history": history_data,
            },
            status=status.HTTP_200_OK,
        )
