# FILE: backend/konnaxion/keenkonnect/serializers.py
from rest_framework import serializers
from .models import Project, ProjectResource, ProjectTask, ProjectMessage, ProjectTeam, ProjectRating, Tag

# Exported classes for import elsewhere
__all__ = [
    "ProjectSerializer",
    "ProjectResourceSerializer",
    "ProjectTaskSerializer",
    "ProjectMessageSerializer",
    "ProjectTeamSerializer",
    "ProjectRatingSerializer",
    "TagSerializer",
]

class ProjectSerializer(serializers.ModelSerializer):
    """Serializer for collaborative Project objects."""
    # Display creator username/string, read-only (set in view)
    creator = serializers.StringRelatedField(read_only=True)
    # We include tags as primary key list (many-to-many). They will appear as a list of tag IDs.
    # created_at and updated_at are auto timestamps, set read-only
    class Meta:
        model = Project
        fields = "__all__"
        read_only_fields = ("creator", "created_at", "updated_at")

class ProjectResourceSerializer(serializers.ModelSerializer):
    """Serializer for ProjectResource (documents/files linked to a project)."""
    # Show uploader as string, assign in view on create
    uploaded_by = serializers.StringRelatedField(read_only=True)
    class Meta:
        model = ProjectResource
        fields = "__all__"
        read_only_fields = ("id", "uploaded_by", "uploaded_at", "version", "converted_path")

class ProjectTaskSerializer(serializers.ModelSerializer):
    """Serializer for a ProjectTask (to-do or milestone in a project)."""
    # Show assignee username if present
    assignee = serializers.StringRelatedField(read_only=True)
    class Meta:
        model = ProjectTask
        fields = "__all__"
        read_only_fields = ("id", "created_at")  # creator implicitly the project owner, created_at auto

class ProjectMessageSerializer(serializers.ModelSerializer):
    """Serializer for a ProjectMessage (chat message in a project thread)."""
    # Show author username, assign in view
    author = serializers.StringRelatedField(read_only=True)
    class Meta:
        model = ProjectMessage
        fields = "__all__"
        read_only_fields = ("id", "author", "created_at")

class ProjectTeamSerializer(serializers.ModelSerializer):
    """Serializer for ProjectTeam (project membership with role)."""

    user = serializers.StringRelatedField(read_only=True)
    project = serializers.StringRelatedField(read_only=True)
    user_id = serializers.IntegerField(read_only=True)
    project_id = serializers.IntegerField(read_only=True)
    project_title = serializers.CharField(source="project.title", read_only=True)

    class Meta:
        model = ProjectTeam
        fields = "__all__"
        read_only_fields = (
            "id",
            "user",
            "user_id",
            "project",
            "project_id",
            "project_title",
            "joined_at",
        )

class ProjectRatingSerializer(serializers.ModelSerializer):
    """Serializer for ProjectRating (user rating/upvote on a project)."""
    # Show rater username, assign in view
    user = serializers.StringRelatedField(read_only=True)
    class Meta:
        model = ProjectRating
        fields = "__all__"
        read_only_fields = ("id", "user", "created_at")

class TagSerializer(serializers.ModelSerializer):
    """Serializer for Tag (keyword) objects."""
    class Meta:
        model = Tag
        fields = "__all__"
        # All fields (id and name) are included; name is unique. No special read_only needed.
