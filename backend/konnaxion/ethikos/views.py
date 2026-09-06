# FILE: backend/konnaxion/ethikos/views.py

# Create your views here.
# konnaxion/ethikos/api_views.py

from rest_framework import viewsets, permissions, mixins
from .models import EthikosTopic, EthikosStance, EthikosArgument
from .serializers import (
    EthikosTopicSerializer, EthikosStanceSerializer, EthikosArgumentSerializer
)

class TopicViewSet(viewsets.ModelViewSet):
    queryset = EthikosTopic.objects.all()
    serializer_class = EthikosTopicSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class StanceViewSet(mixins.CreateModelMixin,
                    mixins.UpdateModelMixin,
                    mixins.RetrieveModelMixin,
                    mixins.ListModelMixin,
                    viewsets.GenericViewSet):
    queryset = EthikosStance.objects.all()
    serializer_class = EthikosStanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        # List stances for the current topic or user
        topic_id = self.request.query_params.get("topic")
        qs = super().get_queryset()
        if topic_id:
            qs = qs.filter(topic_id=topic_id)
        return qs

class ArgumentViewSet(viewsets.ModelViewSet):
    queryset = EthikosArgument.objects.all()
    serializer_class = EthikosArgumentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
