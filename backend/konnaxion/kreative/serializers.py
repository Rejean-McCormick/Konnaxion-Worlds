# FILE: backend/konnaxion/kreative/serializers.py
from rest_framework import serializers
from .models import KreativeArtwork, Gallery, CollabSession, TraditionEntry, Tag

__all__ = [
    "KreativeArtworkSerializer",
    "GallerySerializer",
    "CollabSessionSerializer",
    "TraditionEntrySerializer",
    "TagSerializer",
]

class TagSerializer(serializers.ModelSerializer):
    """Serializer for Tag (artwork/tagging keyword)."""
    class Meta:
        model = Tag
        fields = "__all__"

class KreativeArtworkSerializer(serializers.ModelSerializer):
    """Serializer for KreativeArtwork (a creative artwork uploaded by a user)."""
    artist = serializers.StringRelatedField(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    media_url = serializers.SerializerMethodField()

    def get_media_url(self, obj):
        media_file = getattr(obj, "media_file", None)
        if not media_file or not getattr(media_file, "name", ""):
            return None

        try:
            if not media_file.storage.exists(media_file.name):
                return None
            url = media_file.url
        except (OSError, ValueError):
            return None

        request = self.context.get("request")
        return request.build_absolute_uri(url) if request else url

    class Meta:
        model = KreativeArtwork
        fields = "__all__"
        read_only_fields = ("id", "artist", "created_at", "media_url")

class GallerySerializer(serializers.ModelSerializer):
    """Serializer for Gallery (a curated collection of artworks)."""
    created_by = serializers.StringRelatedField(read_only=True)
    # List artworks in the gallery with their details (read-only for output).
    artworks = KreativeArtworkSerializer(many=True, read_only=True)
    class Meta:
        model = Gallery
        fields = "__all__"
        read_only_fields = ("id", "created_by", "created_at")

class CollabSessionSerializer(serializers.ModelSerializer):
    """Serializer for CollabSession (real-time collaboration session for creatives)."""
    host = serializers.StringRelatedField(read_only=True)
    final_artwork = serializers.PrimaryKeyRelatedField(queryset=KreativeArtwork.objects.all(), allow_null=True, required=False)
    class Meta:
        model = CollabSession
        fields = "__all__"
        read_only_fields = ("id", "host", "started_at", "ended_at")

class TraditionEntrySerializer(serializers.ModelSerializer):
    """Serializer for TraditionEntry (cultural heritage submission for preservation)."""
    submitted_by = serializers.StringRelatedField(read_only=True)
    approved_by = serializers.StringRelatedField(read_only=True)
    class Meta:
        model = TraditionEntry
        fields = "__all__"
        read_only_fields = ("id", "submitted_by", "submitted_at", "approved", "approved_by", "approved_at")
