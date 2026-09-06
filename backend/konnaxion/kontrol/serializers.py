# FILE: backend/konnaxion/kontrol/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import AuditLog, ModerationTicket, KonsensusConfig

User = get_user_model()


class AuditLogSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source="actor.username", read_only=True)
    created = serializers.DateTimeField(source="created_at", read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            "id",
            "actor",
            "actor_username",
            "actor_name",
            "role",
            "action",
            "module",
            "target",
            "ip_address",
            "status",
            "details",
            "created",
        ]
        read_only_fields = ["id", "created", "actor_username"]


class ModerationTicketSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)
    resolved_by_username = serializers.CharField(source="resolved_by.username", read_only=True)
    created = serializers.DateTimeField(source="created_at", read_only=True)
    modified = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = ModerationTicket
        fields = [
            "id",
            "content_snippet",
            "full_content",
            "target_id",
            "target_type",
            "author",
            "author_username",
            "author_reputation_score",
            "report_reason",
            "report_count",
            "severity",
            "status",
            "resolved_by",
            "resolved_by_username",
            "resolution_note",
            "created",
            "modified",
        ]
        read_only_fields = [
            "id", 
            "created", 
            "modified", 
            "author_username", 
            "resolved_by_username"
        ]


class UserAdminSerializer(serializers.ModelSerializer):
    """
    Read-only serializer for the admin user table.
    Exposes fields needed for the /kontrol/users/all table.
    """
    joined_at = serializers.DateTimeField(source="date_joined", read_only=True)
    last_login = serializers.DateTimeField(read_only=True)
    
    # Placeholder for reputation score until that module is fully linked
    reputation_score = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "is_active",
            "is_staff",
            "is_superuser",
            "joined_at",
            "last_login",
            "reputation_score",
        ]

    def get_reputation_score(self, obj) -> int:
        # logic to fetch score from Ekoh or Trust module would go here
        return 0


class KonsensusConfigSerializer(serializers.ModelSerializer):
    """
    Serializer for the global voting configuration settings.
    """

    created = serializers.DateTimeField(source="created_at", read_only=True)
    modified = serializers.DateTimeField(source="updated_at", read_only=True)
    class Meta:
        model = KonsensusConfig
        fields = [
            "id",
            "allow_anonymous_voting",
            "auto_close_votes",
            "quorum_percentage",
            "passing_threshold",
            "default_voting_duration_days",
            "extra_settings",
            "created",
            "modified",
        ]
        read_only_fields = ["id", "created", "modified"]