# konnaxion/konnected/api_views.py
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from django.conf import settings
from django.utils import timezone
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    CertificationPath,
    Evaluation,
    KnowledgeResource,
    KnowledgeRecommendation,
    LearningProgress,
    OfflinePackage,
    PeerValidation,
    Portfolio,
    MentorProfile,
    MentorshipRequest,
    CoCreationProject,
    CoCreationContribution,
    ForumTopic,
    ForumPost,
)
from .serializers import (
    CertificationPathSerializer,
    EvaluationSerializer,
    ExamAttemptSerializer,
    KnowledgeResourceSerializer,
    KnowledgeRecommendationSerializer,
    LearningProgressSerializer,
    PeerValidationSerializer,
    PortfolioSerializer,
    OfflinePackageSerializer,
    MentorProfileSerializer,
    MentorshipRequestSerializer,
    CoCreationProjectSerializer,
    CoCreationContributionSerializer,
    ForumTopicSerializer,
    ForumPostSerializer,
)
from .tasks import build_offline_package

# ---------------------------------------------------------------------------
# Global parameters – aligned with v14 Global Parameter Reference
# ---------------------------------------------------------------------------

CERT_PASS_PERCENT: int = getattr(settings, "CERT_PASS_PERCENT", 80)
QUIZ_RETRY_COOLDOWN_MIN: int = getattr(settings, "QUIZ_RETRY_COOLDOWN_MIN", 30)


# ---------------------------------------------------------------------------
# Helper functions to centralise score / pass / cooldown logic
# ---------------------------------------------------------------------------


def _compute_score_percent(evaluation: Evaluation) -> Optional[float]:
    """
    Resolve a numeric score percentage for an evaluation.

    Prefers metadata["score_percent"] but falls back to raw_score when present.
    """
    metadata = evaluation.metadata or {}
    score_percent = metadata.get("score_percent")

    if score_percent is None and evaluation.raw_score is not None:
        try:
            score_percent = float(evaluation.raw_score)
        except (TypeError, ValueError):
            score_percent = None

    return score_percent


def _get_pass_threshold(metadata: Dict[str, Any]) -> int:
    """
    Resolve the pass percentage, falling back to the global default.
    """
    raw = metadata.get("pass_percent", CERT_PASS_PERCENT)
    try:
        return int(raw)
    except (TypeError, ValueError):
        return CERT_PASS_PERCENT


def _compute_retry_cooldown(
    evaluation: Evaluation, now: Optional[datetime] = None
) -> Tuple[bool, int, datetime]:
    """
    Compute cooldown for an evaluation.

    Returns:
        (is_cooldown_active, remaining_minutes, cooldown_ends_at)
    """
    if now is None:
        now = timezone.now()

    cooldown_delta = timedelta(minutes=QUIZ_RETRY_COOLDOWN_MIN)
    cooldown_ends_at = evaluation.created_at + cooldown_delta

    if now >= cooldown_ends_at:
        return False, 0, cooldown_ends_at

    remaining_minutes = int(
        max(0, round((cooldown_ends_at - now).total_seconds() / 60.0))
    )
    return True, remaining_minutes, cooldown_ends_at


def _generate_synthetic_exam_sessions(
    now: Optional[datetime] = None,
) -> List[Dict[str, Any]]:
    """
    Helper for generating a small synthetic exam schedule.

    v14 does not yet define a persistent ExamSession model; both the
    CertificationPathViewSet.sessions action and the Evaluation
    registration logic use this helper so that the schedule is
    consistent across endpoints.

    Returns a list of dicts with:
        id, start_at, end_at, timezone, modality, location,
        capacity, seats_remaining, registration_deadline.
    """
    if now is None:
        now = timezone.now()

    base_start = now + timedelta(days=3)
    sessions: List[Dict[str, Any]] = []
    for index in range(3):
        start = base_start + timedelta(days=7 * index)
        end = start + timedelta(hours=2)
        sessions.append(
            {
                "id": index + 1,
                "start_at": start.isoformat(),
                "end_at": end.isoformat(),
                "timezone": "UTC",
                "modality": "online",
                "location": "Remote proctored",
                "capacity": 25,
                "seats_remaining": 25,
                "registration_deadline": (start - timedelta(days=1)).isoformat(),
            }
        )
    return sessions



# ---------------------------------------------------------------------------
# KonnectED community / progress APIs backed by models already present in v14
# ---------------------------------------------------------------------------


class IsObjectAuthorOrReadOnly(permissions.BasePermission):
    """Allow public reads while restricting mutations to the row owner."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        owner = getattr(obj, "creator", None) or getattr(obj, "author", None)
        return bool(request.user.is_authenticated and owner == request.user)


class KnowledgeRecommendationViewSet(viewsets.ReadOnlyModelViewSet):
    """Return recommendations belonging to the authenticated learner only."""

    serializer_class = KnowledgeRecommendationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            KnowledgeRecommendation.objects.filter(user=self.request.user)
            .select_related("resource")
            .order_by("-recommended_at", "-created_at")
        )


class LearningProgressViewSet(viewsets.ModelViewSet):
    """Authenticated learner progress. User ownership is enforced server-side."""

    serializer_class = LearningProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            LearningProgress.objects.filter(user=self.request.user)
            .select_related("resource")
            .order_by("-updated_at")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class MentorProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """Discover active mentor profiles without exposing private account fields."""

    serializer_class = MentorProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = MentorProfile.objects.filter(is_active=True).select_related("user").order_by(
        "-is_accepting_mentees",
        "-rating",
        "display_name",
    )


class MentorshipRequestViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Create/list mentorship requests visible to the participating user."""

    serializer_class = MentorshipRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return (
            MentorshipRequest.objects.filter(mentee=user)
            .select_related("mentor", "mentor__user", "mentee")
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        serializer.save(mentee=self.request.user)


class CoCreationProjectViewSet(viewsets.ReadOnlyModelViewSet):
    """Expose existing co-creation projects without inventing ownership semantics."""

    serializer_class = CoCreationProjectSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    queryset = CoCreationProject.objects.all().order_by("-updated_at")


class CoCreationContributionViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Read contributions and allow authenticated users to add their own."""

    serializer_class = CoCreationContributionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    queryset = CoCreationContribution.objects.select_related("project", "user").all().order_by(
        "created_at"
    )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ForumTopicViewSet(viewsets.ModelViewSet):
    serializer_class = ForumTopicSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsObjectAuthorOrReadOnly]
    filterset_fields = ["category", "creator"]
    queryset = ForumTopic.objects.select_related("creator").prefetch_related("posts").all().order_by(
        "-updated_at"
    )

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)


class ForumPostViewSet(viewsets.ModelViewSet):
    serializer_class = ForumPostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsObjectAuthorOrReadOnly]
    filterset_fields = ["topic", "author"]
    queryset = ForumPost.objects.select_related("topic", "author").all().order_by("created_at")

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class KnowledgeResourceViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoints for KonnectED knowledge-library items
    (video, document, course, other).

    The model follows v14 spec:
        id, title, type, url, author, created_at, updated_at
    """

    queryset = KnowledgeResource.objects.select_related("author")
    serializer_class = KnowledgeResourceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        # Record the authenticated user as the author
        serializer.save(author=self.request.user)


# ---------------------------------------------------------------------------
#  Offline content packaging – OfflinePackage CRUD + sync
# ---------------------------------------------------------------------------


class OfflinePackageViewSet(viewsets.ModelViewSet):
    """
    CRUD + sync endpoints for offline content packages.

    Mounted under /api/ via config.api_router (prefix may be
    "konnected/knowledge/offline-packages" or similar depending on router).

    Frontend expectations (see Offline Content page helpers):
        GET    /.../offline-packages/          → list of OfflinePackage
        POST   /.../offline-packages/          → create definition
        GET    /.../offline-packages/{id}/     → retrieve
        PATCH  /.../offline-packages/{id}/     → partial update (e.g. autoSync)
        DELETE /.../offline-packages/{id}/     → delete
        POST   /.../offline-packages/{id}/sync/ → trigger build_offline_package()
    """

    serializer_class = OfflinePackageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Restrict visibility by default to packages created by the user,
        while allowing staff to see all packages.
        """
        user = self.request.user
        base_qs = OfflinePackage.objects.all().select_related("created_by")
        if not user.is_authenticated:
            return OfflinePackage.objects.none()
        if user.is_staff:
            return base_qs
        return base_qs.filter(created_by=user)

    def perform_create(self, serializer):
        """
        Ensure created_by is always set to the requesting user.
        """
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="sync")
    def sync(self, request, pk=None):
        """
        Trigger an asynchronous build of this offline package.

        The heavy lifting is done by konnected.tasks.build_offline_package,
        executed by Celery workers. This endpoint simply enqueues the task.
        """
        package = self.get_object()
        build_offline_package.delay(package.pk)

        # Optionally, we can mark the package as scheduled here; the task
        # itself will update status/progress as it runs.
        metadata_update: Dict[str, Any] = {}
        if getattr(package, "status", None) != "building":
            setattr(package, "status", "scheduled")
            metadata_update["status"] = "scheduled"

        if metadata_update:
            package.save(update_fields=["status", "updated_at"])

        return Response(
            {"detail": "Offline package sync scheduled."},
            status=status.HTTP_202_ACCEPTED,
        )


# ---------------------------------------------------------------------------
#  CertifiKation – Certification paths + exam attempts
# ---------------------------------------------------------------------------


class CertificationPathViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoints for certification / learning paths.

    Base routes (mounted under /api/):

        GET  /konnected/certifications/paths/
        POST /konnected/certifications/paths/
        GET  /konnected/certifications/paths/{id}/
        ...

    Extra actions (for Exam Registration and Exam Preparation pages):

        GET /konnected/certifications/paths/{id}/eligibility/
        GET /konnected/certifications/paths/{id}/sessions/
        GET /konnected/certifications/paths/{id}/preparation-plan/
    """

    queryset = CertificationPath.objects.all().order_by("name")
    serializer_class = CertificationPathSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @action(
        detail=True,
        methods=["get"],
        url_path="eligibility",
        permission_classes=[permissions.IsAuthenticated],
    )
    def eligibility(self, request, pk=None):
        """
        Returns a simple eligibility view for this certification path.

        Response shape matches ExamEligibility in the frontend:
            { "already_passed": bool, "cooldown_remaining_minutes": number }
        """
        path = self.get_object()
        user = request.user

        evaluations = Evaluation.objects.filter(user=user, path=path).order_by(
            "-created_at"
        )

        already_passed = False
        cooldown_remaining = 0

        last_eval = evaluations.first()
        if last_eval is not None:
            metadata = last_eval.metadata or {}
            score = _compute_score_percent(last_eval)
            pass_threshold = _get_pass_threshold(metadata)

            if score is not None and score >= pass_threshold:
                already_passed = True
            else:
                # Respect retry cooldown from the last attempt
                is_cooldown_active, remaining_minutes, _ = _compute_retry_cooldown(
                    last_eval
                )
                if is_cooldown_active:
                    cooldown_remaining = remaining_minutes

        return Response(
            {
                "already_passed": already_passed,
                "cooldown_remaining_minutes": cooldown_remaining,
            }
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="preparation-plan",
        permission_classes=[permissions.IsAuthenticated],
    )
    def preparation_plan(self, request, pk=None):
        """
        Returns a lightweight exam preparation snapshot for this path.

        Response shape matches ExamPreparationResponse used by the
        Exam Preparation page in the frontend. For v14 this endpoint
        focuses on summarising exam attempts and cooldowns; study
        modules and focus areas are returned as empty lists until
        richer learning-path models are introduced.
        """
        path = self.get_object()
        user = request.user

        evaluations = Evaluation.objects.filter(user=user, path=path).order_by(
            "-created_at"
        )
        last_eval = evaluations.first()

        if last_eval is not None:
            metadata = last_eval.metadata or {}

            score_percent = _compute_score_percent(last_eval)
            pass_percent = _get_pass_threshold(metadata)

            last_result = None
            if score_percent is not None:
                last_result = "pass" if score_percent >= pass_percent else "fail"

            attempts_used = evaluations.count()
            attempts_allowed = metadata.get("attempts_allowed")

            is_cooldown_active, _, cooldown_ends_at_dt = _compute_retry_cooldown(
                last_eval, now=timezone.now()
            )
            cooldown_ends_at = (
                cooldown_ends_at_dt.isoformat() if is_cooldown_active else None
            )

            # When evaluation registrations come from the Exam Registration page,
            # we store an ISO target_date in metadata based on the chosen session.
            target_date = metadata.get("target_date")

            exam_payload = {
                "targetDate": target_date,
                "recommendedStudyHours": metadata.get("recommended_study_hours"),
                "lastScorePercent": score_percent,
                "lastResult": last_result,
                "lastAttemptAt": last_eval.created_at.isoformat(),
                "attemptsUsed": attempts_used,
                "attemptsAllowed": attempts_allowed,
                "isCooldownActive": is_cooldown_active,
                "cooldownEndsAt": cooldown_ends_at,
                "passPercent": pass_percent,
                "retryCooldownMinutes": QUIZ_RETRY_COOLDOWN_MIN,
            }
        else:
            # No attempts yet – still return exam metadata so the UI can
            # show thresholds and cooldown policy.
            exam_payload = {
                "targetDate": None,
                "recommendedStudyHours": None,
                "lastScorePercent": None,
                "lastResult": None,
                "lastAttemptAt": None,
                "attemptsUsed": 0,
                "attemptsAllowed": None,
                "isCooldownActive": False,
                "cooldownEndsAt": None,
                "passPercent": CERT_PASS_PERCENT,
                "retryCooldownMinutes": QUIZ_RETRY_COOLDOWN_MIN,
            }

        payload = {
            "path": {
                "id": path.pk,
                "name": path.name,
                "description": path.description,
            },
            # Study modules and focus areas are intentionally empty for now.
            # A future learning-path model can populate these without
            # changing the endpoint contract.
            "exam": exam_payload,
            "overallProgressPercent": None,
            "modules": [],
            "focusAreas": [],
        }
        return Response(payload)

    @action(
        detail=True,
        methods=["get"],
        url_path="sessions",
        permission_classes=[permissions.IsAuthenticated],
    )
    def sessions(self, request, pk=None):
        """
        Returns upcoming exam sessions for this certification path.

        v14 does not yet define a persistent ExamSession model, so this
        implementation returns a small synthetic schedule based on the
        current time. You can replace this with real DB-backed sessions
        later without changing the endpoint contract.
        """
        sessions = _generate_synthetic_exam_sessions()
        return Response(sessions)


class EvaluationViewSet(viewsets.ModelViewSet):
    """
    Stores exam / assessment attempts for certification paths.

    Base routes (mounted under /api/):

        GET  /konnected/certifications/evaluations/
        POST /konnected/certifications/evaluations/
        GET  /konnected/certifications/evaluations/{id}/
        ...

    The queryset is always scoped to the authenticated user.
    """

    serializer_class = EvaluationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Evaluation.objects.none()
        return (
            Evaluation.objects.filter(user=user)
            .select_related("path", "user")
            .order_by("-created_at")
        )

    def create(self, request, *args, **kwargs):
        """
        Custom create to map the Exam Registration payload into the model.

        The frontend (Exam Registration page) typically POSTs:

            {
              "path_id":        number,
              "session_id":     number,
              "full_name":      string,
              "agreed_terms":   boolean
            }

        We map:
            - user  ← request.user
            - path  ← CertificationPath(path_id)
            - raw_score ← 0.0 (exam not taken yet)
            - metadata ← remaining booking details
        """
        user = request.user
        data = request.data

        path_id = data.get("path_id")
        if not path_id:
            return Response(
                {"detail": "path_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            path = CertificationPath.objects.get(pk=path_id)
        except CertificationPath.DoesNotExist:
            return Response(
                {"detail": "Unknown certification path."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session_id = data.get("session_id")
        target_date = None

        # Best-effort mapping of the chosen synthetic session to a target date.
        if session_id is not None:
            try:
                session_id_int = int(session_id)
            except (TypeError, ValueError):
                session_id_int = None

            if session_id_int is not None:
                for session in _generate_synthetic_exam_sessions():
                    if session["id"] == session_id_int:
                        target_date = session["start_at"]
                        break

        metadata: Dict[str, Any] = {
            "session_id": session_id,
            "full_name": data.get("full_name"),
            "agreed_terms": data.get("agreed_terms"),
            # Reasonable defaults that the dashboard and preparation page
            # can later read/override.
            "delivery_mode": "online",
            "proctored": True,
            "status": "scheduled",
        }

        if target_date is not None:
            metadata["target_date"] = target_date

        evaluation = Evaluation.objects.create(
            user=user,
            path=path,
            raw_score=0.0,
            metadata=metadata,
        )

        serializer = self.get_serializer(evaluation)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )


class PeerValidationViewSet(viewsets.ModelViewSet):
    """
    API for peer mentors to record validation decisions on evaluations.
    """

    serializer_class = PeerValidationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return PeerValidation.objects.none()
        if user.is_staff:
            return PeerValidation.objects.all().select_related("evaluation", "peer")
        return PeerValidation.objects.filter(peer=user).select_related(
            "evaluation", "peer"
        )

    def perform_create(self, serializer):
        serializer.save(peer=self.request.user)


class PortfolioViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoints for user skill portfolios (collections of KnowledgeResources).
    """

    serializer_class = PortfolioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Portfolio.objects.none()
        return Portfolio.objects.filter(user=user).prefetch_related("items")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ExamAttemptViewSet(viewsets.ViewSet):
    """
    Read-only endpoints backing the Exam Dashboard UI.

    This ViewSet does not map to a single model; instead it aggregates
    Evaluation + PeerValidation (and, optionally, certificates/portfolio)
    into ExamAttemptSerializer records.

    Mounted under /api/ as:

        GET /konnected/certifications/exam-attempts/
        GET /konnected/certifications/exam-attempts/me/
        GET /konnected/certifications/exam-attempts/{id}/
        POST /konnected/certifications/exam-attempts/{id}/appeal/
        POST /konnected/certifications/exam-attempts/{id}/retry/
    """

    permission_classes = [permissions.IsAuthenticated]

    def _build_attempt(self, evaluation: Evaluation, attempt_number: int) -> Dict[str, Any]:
        metadata = evaluation.metadata or {}
        path = evaluation.path

        score_percent = _compute_score_percent(evaluation)

        max_score = metadata.get("max_score")
        delivery_mode = metadata.get("delivery_mode", "online")
        proctored = bool(metadata.get("proctored", False))

        # Use per-evaluation pass threshold if present
        pass_threshold = _get_pass_threshold(metadata)

        status_value = metadata.get("status")
        if not status_value:
            # Derive a simple status when none is explicitly stored
            if score_percent is None or score_percent == 0:
                status_value = "scheduled"
            elif score_percent >= pass_threshold:
                status_value = "passed"
            else:
                status_value = "failed"

        peer_required = bool(metadata.get("peer_validation_required", False))

        peer_status = None
        if peer_required:
            peer_qs = PeerValidation.objects.filter(evaluation=evaluation)
            decisions = {pv.decision for pv in peer_qs}
            if "approved" in decisions:
                peer_status = "approved"
            elif "rejected" in decisions:
                peer_status = "rejected"
            elif decisions:
                peer_status = "pending"
            else:
                peer_status = "pending"

        appeal_status = metadata.get("appeal_status", "none")

        is_cooldown_active, _, next_retry_at = _compute_retry_cooldown(
            evaluation, now=timezone.now()
        )
        can_retry = status_value != "passed" and not is_cooldown_active

        certificate_id = metadata.get("certificate_id")
        certificate_url = metadata.get("certificate_url")
        portfolio_item_id = metadata.get("portfolio_item_id")
        portfolio_url = metadata.get("portfolio_url")

        return {
            "id": str(evaluation.pk),
            "certificationPathId": str(path.pk),
            "certificationPathName": path.name,
            "attemptNumber": attempt_number,
            "takenAt": evaluation.created_at,
            "deliveryMode": delivery_mode,
            "proctored": proctored,
            "scorePercent": score_percent,
            "maxScore": max_score,
            "status": status_value,
            "peerValidationRequired": peer_required,
            "peerValidationStatus": peer_status,
            "appealStatus": appeal_status,
            "certificateId": certificate_id,
            "certificateUrl": certificate_url,
            "portfolioItemId": portfolio_item_id,
            "portfolioUrl": portfolio_url,
            "canRetry": can_retry,
            # Only expose a concrete nextRetryAt while cooldown is active
            "nextRetryAt": None if can_retry else next_retry_at,
        }

    def list(self, request):
        """
        Alias for `me()` – global listing of attempts for the current user.
        """
        return self.me(request)

    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        """
        Returns all exam attempts for the authenticated user across paths.

        Response shape matches the ExamDashboard `ExamAttemptsResponse`:
            { "attempts": ExamAttempt[] }
        """
        user = request.user
        evaluations = (
            Evaluation.objects.filter(user=user)
            .select_related("path")
            .order_by("path_id", "created_at", "pk")
        )

        attempts_payload: List[Dict[str, Any]] = []
        attempt_counter_by_path: Dict[int, int] = {}

        for evaluation in evaluations:
            path_id = evaluation.path_id
            attempt_counter_by_path[path_id] = attempt_counter_by_path.get(
                path_id, 0
            ) + 1
            attempt_number = attempt_counter_by_path[path_id]
            attempts_payload.append(self._build_attempt(evaluation, attempt_number))

        serializer = ExamAttemptSerializer(attempts_payload, many=True)
        return Response({"attempts": serializer.data})

    def retrieve(self, request, pk=None):
        """
        Detailed view of a single exam attempt belonging to the current user.
        """
        user = request.user
        try:
            evaluation = Evaluation.objects.select_related("path").get(
                pk=pk, user=user
            )
        except Evaluation.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        # Compute attempt number within this path
        ordered = Evaluation.objects.filter(user=user, path=evaluation.path).order_by(
            "created_at", "pk"
        )
        attempt_number = 1
        for idx, ev in enumerate(ordered, start=1):
            if ev.pk == evaluation.pk:
                attempt_number = idx
                break

        payload = self._build_attempt(evaluation, attempt_number)
        serializer = ExamAttemptSerializer(payload)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="appeal")
    def appeal(self, request, pk=None):
        """
        Lightweight stub for opening an appeal on an evaluation.

        For v14 we simply mark the evaluation's metadata and return
        the updated attempt. A richer workflow (notifications, tasks)
        can be layered on top later.
        """
        try:
            evaluation = Evaluation.objects.get(pk=pk, user=request.user)
        except Evaluation.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        metadata = evaluation.metadata or {}
        metadata["appeal_status"] = "open"
        evaluation.metadata = metadata
        evaluation.save(update_fields=["metadata", "updated_at"])

        return self.retrieve(request, pk=pk)

    @action(detail=True, methods=["post"], url_path="retry")
    def retry(self, request, pk=None):
        """
        Helper that creates a new scheduled Evaluation for the same path,
        subject to the configured cooldown.

        This is used by the Exam Dashboard "Retry" action.
        """
        try:
            source_eval = Evaluation.objects.select_related("path").get(
                pk=pk, user=request.user
            )
        except Evaluation.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        metadata = source_eval.metadata or {}

        # Compute score_percent and pass threshold to determine if the exam is already passed
        score_percent = _compute_score_percent(source_eval)
        pass_threshold = _get_pass_threshold(metadata)

        if score_percent is not None and score_percent >= pass_threshold:
            return Response(
                {"detail": "You cannot retry an exam that has already been passed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_cooldown_active, remaining_minutes, _ = _compute_retry_cooldown(
            source_eval, now=timezone.now()
        )
        if is_cooldown_active:
            return Response(
                {
                    "detail": "Retry cooldown is still active for this exam.",
                    "cooldown_remaining_minutes": remaining_minutes,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        base_metadata = metadata
        new_metadata = {
            **base_metadata,
            "status": "scheduled",
            "is_retry": True,
        }

        new_eval = Evaluation.objects.create(
            user=request.user,
            path=source_eval.path,
            raw_score=0.0,
            metadata=new_metadata,
        )

        # Compute attempt number for the newly created evaluation
        ordered = Evaluation.objects.filter(
            user=request.user, path=source_eval.path
        ).order_by("created_at", "pk")
        attempt_number = 1
        for idx, ev in enumerate(ordered, start=1):
            if ev.pk == new_eval.pk:
                attempt_number = idx
                break

        payload = self._build_attempt(new_eval, attempt_number)
        serializer = ExamAttemptSerializer(payload)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
