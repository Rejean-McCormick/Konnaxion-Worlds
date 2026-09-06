# FILE: backend/konnaxion/ethikos/api_views.py
from __future__ import annotations

from typing import Optional

from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .constants import (
    ARGUMENT_SIDE_CON,
    ARGUMENT_SIDE_FILTER_VALUES,
    ARGUMENT_SIDE_NEUTRAL,
    ARGUMENT_SIDE_PRO,
    ARGUMENT_SUGGESTION_ACCEPTED,
    ARGUMENT_SUGGESTION_REJECTED,
    ARGUMENT_SUGGESTION_REVISION_REQUESTED,
    ARGUMENT_SUGGESTION_STATUS_CHOICES,
    DISCUSSION_ROLE_CHOICES,
    TOPIC_STATUS_CHOICES,
)
from .models import (
    ArgumentImpactVote,
    ArgumentSource,
    ArgumentSuggestion,
    DiscussionParticipantRole,
    DiscussionVisibilitySetting,
    EthikosArgument,
    EthikosCategory,
    EthikosStance,
    EthikosTopic,
)
from .permissions import (
    OwnerOrEthikosAdminOrReadOnly,
    OwnerOrEthikosModeratorOrReadOnly,
)
from .serializers import (
    ArgumentImpactVoteSerializer,
    ArgumentSourceSerializer,
    ArgumentSuggestionSerializer,
    DiscussionParticipantRoleSerializer,
    DiscussionVisibilitySettingSerializer,
    EthikosArgumentSerializer,
    EthikosCategorySerializer,
    EthikosStanceSerializer,
    EthikosTopicSerializer,
)


# ---- Shared helpers ---------------------------------------------------------

def _coerce_optional_int(raw: object, field_name: str) -> Optional[int]:
    """
    Convert optional query/data values to int.

    Empty values are treated as absent. Invalid non-empty values raise DRF
    validation errors instead of leaking ValueError.
    """
    if raw in (None, ""):
        return None

    try:
        return int(raw)
    except (TypeError, ValueError):
        raise ValidationError({field_name: "Must be a valid integer."})


def _copy_request_data(request):
    """
    Return a mutable copy of request.data.

    DRF may expose request.data as an immutable QueryDict for form payloads.
    """
    if hasattr(request.data, "copy"):
        return request.data.copy()
    return dict(request.data)


def _touch_topic_activity(topic: EthikosTopic) -> None:
    """
    Refresh topic.last_activity after stance/argument/Korum activity.
    """
    topic.save(update_fields=["last_activity"])


def _valid_topic_statuses() -> set[str]:
    return {choice[0] for choice in TOPIC_STATUS_CHOICES}


def _valid_suggestion_statuses() -> set[str]:
    return {choice[0] for choice in ARGUMENT_SUGGESTION_STATUS_CHOICES}


def _valid_discussion_roles() -> set[str]:
    return {choice[0] for choice in DISCUSSION_ROLE_CHOICES}


def _topic_from_argument(argument: EthikosArgument) -> EthikosTopic:
    return argument.topic


def _touch_argument_topic(argument: EthikosArgument) -> None:
    _touch_topic_activity(_topic_from_argument(argument))


# ---- Categories -------------------------------------------------------------

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only Ethikos categories.

    Canonical route:
    - /api/ethikos/categories/
    """

    queryset = EthikosCategory.objects.all().order_by("name")
    serializer_class = EthikosCategorySerializer
    permission_classes = [permissions.AllowAny]


# ---- Topics -----------------------------------------------------------------

class TopicViewSet(viewsets.ModelViewSet):
    """
    CRUD for Ethikos topics.

    Canonical route:
    - /api/ethikos/topics/

    Query params:
    - category=<id>
    - status=open|closed|archived

    Write behavior:
    - created_by is injected from request.user.
    - accepts category_id, and also accepts category as an alias for category_id.
    """

    queryset = EthikosTopic.objects.select_related(
        "created_by",
        "category",
        "expertise_category",
    )
    serializer_class = EthikosTopicSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
        OwnerOrEthikosAdminOrReadOnly,
    ]

    def get_queryset(self):
        qs = super().get_queryset()

        category_id = _coerce_optional_int(
            self.request.query_params.get("category"),
            "category",
        )
        if category_id is not None:
            qs = qs.filter(category_id=category_id)

        status_param = self.request.query_params.get("status")
        if status_param:
            if status_param not in _valid_topic_statuses():
                raise ValidationError({"status": "Invalid topic status."})
            qs = qs.filter(status=status_param)

        return qs

    def _normalized_topic_data(self, request):
        data = _copy_request_data(request)

        # Serializer accepts category_id. Kintsugi/API contract also allows
        # category as a backend-boundary alias for category_id.
        if not data.get("category_id") and data.get("category"):
            data["category_id"] = data.get("category")

        return data

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=self._normalized_topic_data(request))
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        serializer = self.get_serializer(
            instance,
            data=self._normalized_topic_data(request),
            partial=partial,
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)

    def perform_create(self, serializer) -> None:
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["get"], permission_classes=[permissions.AllowAny])
    def preview(self, request, pk=None):
        """
        Resilient topic preview for Deliberate preview drawers.

        Required behavior:
        - return topic metadata when the topic exists;
        - never return an empty shape for an existing topic;
        - tolerate related argument/stance aggregation failures.
        """
        topic = self.get_object()

        description = topic.description or ""
        preview_description = (
            description if len(description) <= 280 else f"{description[:280]}…"
        )

        stats = {
            "stance_count": 0,
            "argument_count": 0,
            "pro_count": 0,
            "con_count": 0,
            "neutral_count": 0,
            "source_count": 0,
            "impact_vote_count": 0,
            "suggestion_count": 0,
        }
        latest = []

        try:
            stance_qs = EthikosStance.objects.filter(topic=topic)
            argument_qs = EthikosArgument.objects.filter(topic=topic)
            argument_ids = argument_qs.values_list("id", flat=True)

            stats["stance_count"] = stance_qs.count()
            stats["argument_count"] = argument_qs.count()
            stats["pro_count"] = argument_qs.filter(
                side=ARGUMENT_SIDE_PRO,
            ).count()
            stats["con_count"] = argument_qs.filter(
                side=ARGUMENT_SIDE_CON,
            ).count()
            stats["neutral_count"] = argument_qs.filter(side__isnull=True).count()
            stats["source_count"] = ArgumentSource.objects.filter(
                argument_id__in=argument_ids,
                is_removed=False,
            ).count()
            stats["impact_vote_count"] = ArgumentImpactVote.objects.filter(
                argument_id__in=argument_ids,
            ).count()
            stats["suggestion_count"] = ArgumentSuggestion.objects.filter(
                topic=topic,
            ).count()

            latest = [
                {
                    "id": arg.id,
                    "user": getattr(arg.user, "username", str(arg.user)),
                    "author": getattr(arg.user, "username", str(arg.user)),
                    "content": arg.content,
                    "body": arg.content,
                    "side": arg.side,
                    "parent": arg.parent_id,
                    "created_at": arg.created_at,
                    "source_count": getattr(arg, "source_count", 0),
                    "impact_vote_count": getattr(arg, "impact_vote_count", 0),
                    "suggestion_count": getattr(arg, "suggestion_count", 0),
                }
                for arg in argument_qs.select_related("user", "parent")
                .filter(is_hidden=False)
                .annotate(
                    source_count=Count("sources", distinct=True),
                    impact_vote_count=Count("impact_votes", distinct=True),
                    suggestion_count=Count("suggested_replies", distinct=True),
                )
                .order_by("-created_at")[:5]
            ]
        except Exception:
            # The preview endpoint must still return topic metadata if the
            # topic exists. This prevents the visible "Preview / No data" state.
            latest = []

        category_name = topic.category.name if topic.category_id else None

        data = {
            "id": topic.id,
            "title": topic.title,
            "description": preview_description,
            "full_description": description,
            "category": category_name,
            "category_id": topic.category_id,
            "category_name": category_name,
            "status": topic.status,
            "total_votes": topic.total_votes,
            "created_at": topic.created_at,
            "last_activity": topic.last_activity,
            "stats": stats,
            "latest": latest,
        }

        return Response(data, status=status.HTTP_200_OK)


# ---- Stances ----------------------------------------------------------------

class StanceViewSet(viewsets.ModelViewSet):
    """
    Topic-level user stance endpoint.

    Canonical route:
    - /api/ethikos/stances/

    Query params:
    - topic=<id>

    POST is an upsert by (request.user, topic).
    """

    queryset = EthikosStance.objects.select_related("topic", "user")
    serializer_class = EthikosStanceSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
        OwnerOrEthikosAdminOrReadOnly,
    ]

    def get_queryset(self):
        qs = super().get_queryset()

        topic_id = _coerce_optional_int(
            self.request.query_params.get("topic"),
            "topic",
        )
        if topic_id is not None:
            qs = qs.filter(topic_id=topic_id)

        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        topic = serializer.validated_data.get("topic")
        value = serializer.validated_data.get("value")

        if topic is None:
            raise ValidationError({"topic": "This field is required."})
        if value is None:
            raise ValidationError({"value": "This field is required."})

        stance, created = EthikosStance.objects.update_or_create(
            user=request.user,
            topic=topic,
            defaults={"value": value},
        )

        _touch_topic_activity(topic)

        output = self.get_serializer(stance)
        return Response(
            output.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def perform_create(self, serializer) -> None:
        stance = serializer.save(user=self.request.user)
        _touch_topic_activity(stance.topic)

    def perform_update(self, serializer) -> None:
        stance = serializer.save()
        _touch_topic_activity(stance.topic)


# ---- Arguments --------------------------------------------------------------

class ArgumentViewSet(viewsets.ModelViewSet):
    """
    Threaded Ethikos argument endpoint.

    Canonical route:
    - /api/ethikos/arguments/

    Query params:
    - topic=<id>
    - parent=<id>
    - parent=null
    - side=pro|con|neutral

    This remains EthikosArgument, not Claim/KialoClaim.
    """

    queryset = EthikosArgument.objects.select_related("user", "topic", "parent")
    serializer_class = EthikosArgumentSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
        OwnerOrEthikosModeratorOrReadOnly,
    ]

    def get_queryset(self):
        qs = (
            super()
            .get_queryset()
            .annotate(
                source_count=Count("sources", distinct=True),
                impact_vote_count=Count("impact_votes", distinct=True),
                suggestion_count=Count("suggested_replies", distinct=True),
            )
        )

        topic_id = _coerce_optional_int(
            self.request.query_params.get("topic"),
            "topic",
        )
        if topic_id is not None:
            qs = qs.filter(topic_id=topic_id)

        parent_raw = self.request.query_params.get("parent")
        if parent_raw == "null":
            qs = qs.filter(parent__isnull=True)
        else:
            parent_id = _coerce_optional_int(parent_raw, "parent")
            if parent_id is not None:
                qs = qs.filter(parent_id=parent_id)

        side_param = self.request.query_params.get("side")
        if side_param:
            if side_param not in ARGUMENT_SIDE_FILTER_VALUES:
                raise ValidationError(
                    {"side": "Expected pro, con, or neutral."},
                )

            if side_param == ARGUMENT_SIDE_NEUTRAL:
                qs = qs.filter(side__isnull=True)
            else:
                qs = qs.filter(side=side_param)

        return qs

    def _normalized_argument_data(
        self,
        request,
        instance: Optional[EthikosArgument] = None,
    ):
        data = _copy_request_data(request)

        # Serializer accepts parent_id. Existing callers may send parent.
        if not data.get("parent_id") and data.get("parent"):
            data["parent_id"] = data.get("parent")

        parent_id = _coerce_optional_int(data.get("parent_id"), "parent_id")

        # Reply creation can infer topic from parent if topic was omitted.
        if parent_id is not None and not data.get("topic") and instance is None:
            parent = get_object_or_404(EthikosArgument, pk=parent_id)
            data["topic"] = parent.topic_id

        return data

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=self._normalized_argument_data(request),
        )
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        serializer = self.get_serializer(
            instance,
            data=self._normalized_argument_data(request, instance=instance),
            partial=partial,
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)

    def perform_create(self, serializer) -> None:
        argument = serializer.save(user=self.request.user)
        _touch_topic_activity(argument.topic)

    def perform_update(self, serializer) -> None:
        argument = serializer.save()
        _touch_topic_activity(argument.topic)


# ---- Korum / Argument sources ----------------------------------------------

class ArgumentSourceViewSet(viewsets.ModelViewSet):
    """
    Sources attached to EthikosArgument records.

    Canonical route:
    - /api/ethikos/argument-sources/
    """

    queryset = ArgumentSource.objects.select_related(
        "argument",
        "argument__topic",
        "created_by",
    )
    serializer_class = ArgumentSourceSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
        OwnerOrEthikosModeratorOrReadOnly,
    ]

    def get_queryset(self):
        qs = super().get_queryset()

        argument_id = _coerce_optional_int(
            self.request.query_params.get("argument"),
            "argument",
        )
        if argument_id is not None:
            qs = qs.filter(argument_id=argument_id)

        topic_id = _coerce_optional_int(
            self.request.query_params.get("topic"),
            "topic",
        )
        if topic_id is not None:
            qs = qs.filter(argument__topic_id=topic_id)

        is_removed = self.request.query_params.get("is_removed")
        if is_removed in ("true", "1"):
            qs = qs.filter(is_removed=True)
        elif is_removed in ("false", "0", None, ""):
            if is_removed in ("false", "0"):
                qs = qs.filter(is_removed=False)
        else:
            raise ValidationError({"is_removed": "Expected true or false."})

        return qs

    def perform_create(self, serializer) -> None:
        source = serializer.save(created_by=self.request.user)
        _touch_argument_topic(source.argument)

    def perform_update(self, serializer) -> None:
        source = serializer.save()
        _touch_argument_topic(source.argument)


# ---- Korum / Argument impact votes -----------------------------------------

class ArgumentImpactVoteViewSet(viewsets.ModelViewSet):
    """
    Argument-level impact votes.

    This is not EthikosStance and not a Smart Vote reading.

    Canonical route:
    - /api/ethikos/argument-impact-votes/
    """

    queryset = ArgumentImpactVote.objects.select_related(
        "argument",
        "argument__topic",
        "user",
    )
    serializer_class = ArgumentImpactVoteSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
        OwnerOrEthikosAdminOrReadOnly,
    ]

    def get_queryset(self):
        qs = super().get_queryset()

        argument_id = _coerce_optional_int(
            self.request.query_params.get("argument"),
            "argument",
        )
        if argument_id is not None:
            qs = qs.filter(argument_id=argument_id)

        topic_id = _coerce_optional_int(
            self.request.query_params.get("topic"),
            "topic",
        )
        if topic_id is not None:
            qs = qs.filter(argument__topic_id=topic_id)

        mine = self.request.query_params.get("mine")
        if mine in ("true", "1"):
            if not self.request.user.is_authenticated:
                return qs.none()
            qs = qs.filter(user=self.request.user)
        elif mine not in (None, "", "false", "0"):
            raise ValidationError({"mine": "Expected true or false."})

        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        argument = serializer.validated_data.get("argument")
        value = serializer.validated_data.get("value")

        if argument is None:
            raise ValidationError({"argument": "This field is required."})
        if value is None:
            raise ValidationError({"value": "This field is required."})

        vote, created = ArgumentImpactVote.objects.update_or_create(
            user=request.user,
            argument=argument,
            defaults={"value": value},
        )

        _touch_argument_topic(argument)

        output = self.get_serializer(vote)
        return Response(
            output.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def perform_update(self, serializer) -> None:
        vote = serializer.save()
        _touch_argument_topic(vote.argument)


# ---- Korum / Argument suggestions ------------------------------------------

class ArgumentSuggestionViewSet(viewsets.ModelViewSet):
    """
    Suggested arguments/replies.

    Suggestions are reviewed into EthikosArgument records rather than replacing
    EthikosArgument.

    Canonical route:
    - /api/ethikos/argument-suggestions/
    """

    queryset = ArgumentSuggestion.objects.select_related(
        "topic",
        "parent",
        "accepted_argument",
        "created_by",
        "reviewed_by",
    )
    serializer_class = ArgumentSuggestionSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
        OwnerOrEthikosModeratorOrReadOnly,
    ]

    def get_queryset(self):
        qs = super().get_queryset()

        topic_id = _coerce_optional_int(
            self.request.query_params.get("topic"),
            "topic",
        )
        if topic_id is not None:
            qs = qs.filter(topic_id=topic_id)

        parent_id = _coerce_optional_int(
            self.request.query_params.get("parent"),
            "parent",
        )
        if parent_id is not None:
            qs = qs.filter(parent_id=parent_id)

        status_param = self.request.query_params.get("status")
        if status_param:
            if status_param not in _valid_suggestion_statuses():
                raise ValidationError({"status": "Invalid suggestion status."})
            qs = qs.filter(status=status_param)

        mine = self.request.query_params.get("mine")
        if mine in ("true", "1"):
            if not self.request.user.is_authenticated:
                return qs.none()
            qs = qs.filter(created_by=self.request.user)
        elif mine not in (None, "", "false", "0"):
            raise ValidationError({"mine": "Expected true or false."})

        return qs

    def perform_create(self, serializer) -> None:
        suggestion = serializer.save(created_by=self.request.user)
        _touch_topic_activity(suggestion.topic)

    def perform_update(self, serializer) -> None:
        suggestion = serializer.save()
        _touch_topic_activity(suggestion.topic)

    @action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        """
        Accept a suggestion by creating an EthikosArgument from it.

        If accepted_argument already exists, return it without creating a
        duplicate argument.
        """
        suggestion = self.get_object()

        if suggestion.accepted_argument_id:
            output = self.get_serializer(suggestion)
            return Response(output.data, status=status.HTTP_200_OK)

        argument = EthikosArgument.objects.create(
            topic=suggestion.topic,
            user=request.user,
            content=suggestion.content,
            parent=suggestion.parent,
            side=None if suggestion.side == ARGUMENT_SIDE_NEUTRAL else suggestion.side,
        )

        suggestion.accepted_argument = argument
        suggestion.status = ARGUMENT_SUGGESTION_ACCEPTED
        suggestion.reviewed_by = request.user
        suggestion.reviewed_at = timezone.now()
        suggestion.save(
            update_fields=(
                "accepted_argument",
                "status",
                "reviewed_by",
                "reviewed_at",
                "updated_at",
            )
        )

        _touch_topic_activity(suggestion.topic)

        output = self.get_serializer(suggestion)
        return Response(output.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        suggestion = self.get_object()
        suggestion.status = ARGUMENT_SUGGESTION_REJECTED
        suggestion.reviewed_by = request.user
        suggestion.reviewed_at = timezone.now()
        suggestion.save(
            update_fields=(
                "status",
                "reviewed_by",
                "reviewed_at",
                "updated_at",
            )
        )

        _touch_topic_activity(suggestion.topic)

        output = self.get_serializer(suggestion)
        return Response(output.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="request-revision")
    def request_revision(self, request, pk=None):
        suggestion = self.get_object()
        suggestion.status = ARGUMENT_SUGGESTION_REVISION_REQUESTED
        suggestion.reviewed_by = request.user
        suggestion.reviewed_at = timezone.now()
        suggestion.save(
            update_fields=(
                "status",
                "reviewed_by",
                "reviewed_at",
                "updated_at",
            )
        )

        _touch_topic_activity(suggestion.topic)

        output = self.get_serializer(suggestion)
        return Response(output.data, status=status.HTTP_200_OK)


# ---- Korum / Discussion participant roles ----------------------------------

class DiscussionParticipantRoleViewSet(viewsets.ModelViewSet):
    """
    Per-topic participant role endpoint.

    Canonical route:
    - /api/ethikos/discussion-participant-roles/
    """

    queryset = DiscussionParticipantRole.objects.select_related(
        "topic",
        "user",
        "assigned_by",
    )
    serializer_class = DiscussionParticipantRoleSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
        OwnerOrEthikosAdminOrReadOnly,
    ]

    def get_queryset(self):
        qs = super().get_queryset()

        topic_id = _coerce_optional_int(
            self.request.query_params.get("topic"),
            "topic",
        )
        if topic_id is not None:
            qs = qs.filter(topic_id=topic_id)

        user_id = _coerce_optional_int(
            self.request.query_params.get("user"),
            "user",
        )
        if user_id is not None:
            qs = qs.filter(user_id=user_id)

        role_param = self.request.query_params.get("role")
        if role_param:
            if role_param not in _valid_discussion_roles():
                raise ValidationError({"role": "Invalid discussion role."})
            qs = qs.filter(role=role_param)

        return qs

    def create(self, request, *args, **kwargs):
        """
        Upsert role by (topic, user).
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        topic = serializer.validated_data.get("topic")
        user = serializer.validated_data.get("user")
        role = serializer.validated_data.get("role")

        if topic is None:
            raise ValidationError({"topic": "This field is required."})
        if user is None:
            raise ValidationError({"target_user_id": "This field is required."})
        if role is None:
            raise ValidationError({"role": "This field is required."})

        participant_role, created = DiscussionParticipantRole.objects.update_or_create(
            topic=topic,
            user=user,
            defaults={
                "role": role,
                "assigned_by": request.user,
            },
        )

        _touch_topic_activity(topic)

        output = self.get_serializer(participant_role)
        return Response(
            output.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def perform_update(self, serializer) -> None:
        participant_role = serializer.save(assigned_by=self.request.user)
        _touch_topic_activity(participant_role.topic)


# ---- Korum / Discussion visibility settings --------------------------------

class DiscussionVisibilitySettingViewSet(viewsets.ModelViewSet):
    """
    Per-topic visibility/participation setting endpoint.

    Canonical route:
    - /api/ethikos/discussion-visibility-settings/
    """

    queryset = DiscussionVisibilitySetting.objects.select_related(
        "topic",
        "changed_by",
    )
    serializer_class = DiscussionVisibilitySettingSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
        OwnerOrEthikosAdminOrReadOnly,
    ]

    def get_queryset(self):
        qs = super().get_queryset()

        topic_id = _coerce_optional_int(
            self.request.query_params.get("topic"),
            "topic",
        )
        if topic_id is not None:
            qs = qs.filter(topic_id=topic_id)

        return qs

    def create(self, request, *args, **kwargs):
        """
        Upsert visibility setting by topic.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        topic = serializer.validated_data.get("topic")
        if topic is None:
            raise ValidationError({"topic": "This field is required."})

        defaults = {
            "changed_by": request.user,
        }

        for field_name in (
            "participation_type",
            "author_visibility",
            "vote_visibility",
        ):
            if field_name in serializer.validated_data:
                defaults[field_name] = serializer.validated_data[field_name]

        setting, created = DiscussionVisibilitySetting.objects.update_or_create(
            topic=topic,
            defaults=defaults,
        )

        _touch_topic_activity(topic)

        output = self.get_serializer(setting)
        return Response(
            output.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def perform_update(self, serializer) -> None:
        setting = serializer.save(changed_by=self.request.user)
        _touch_topic_activity(setting.topic)
