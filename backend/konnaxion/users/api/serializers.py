# FILE: backend/konnaxion/users/api/serializers.py
# backend/konnaxion/users/api/serializers.py

from __future__ import annotations

from urllib.parse import urlparse

from django.conf import settings
from rest_framework import serializers

from konnaxion.users.models import User


# Optional project-level override in settings.py:
# DEFAULT_AVATAR_PATH = "kreative/artworks/default_profile.png"
DEFAULT_AVATAR_PATH = getattr(
    settings, "DEFAULT_AVATAR_PATH", "kreative/artworks/default_profile.png"
)


def _is_absolute(url: str) -> bool:
    try:
        p = urlparse(url)
        return p.scheme in ("http", "https")
    except Exception:
        return False


def _join_media_url(path: str) -> str:
    """
    Join MEDIA_URL and a relative media path into a single URL string.
    Works whether MEDIA_URL is absolute (e.g. https://cdn/...) or relative (/media/).
    """
    base = (settings.MEDIA_URL or "/media/").rstrip("/")
    rel = path.lstrip("/")
    return f"{base}/{rel}"


def _safe_file_url(file_field) -> str | None:
    """
    Safely read `.url` from a Django FileField/ImageField-like object.
    Returns None when no file is associated.
    """
    if not file_field:
        return None
    try:
        return file_field.url
    except (ValueError, AttributeError):
        return None


class UserSerializer(serializers.ModelSerializer[User]):
    # Exposed to the frontend: absolute URL for the user's avatar (or default)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["username", "name", "url", "avatar_url"]
        extra_kwargs = {
            "url": {"view_name": "api:user-detail", "lookup_field": "username"},
        }

    def get_avatar_url(self, obj: User) -> str:
        """
        Resolution order:
        1. If user.profile_artwork.media_file exists, use that.
        2. Else, if a legacy ImageField `avatar` exists and has a URL, use it.
        3. Else, fall back to DEFAULT_AVATAR_PATH under MEDIA_URL.

        Always return an absolute URL when `request` is available.
        """
        request = self.context.get("request")

        # 1) New path: KreativeArtwork linked as profile picture
        artwork = getattr(obj, "profile_artwork", None)
        if artwork is not None:
            media = getattr(artwork, "media_file", None)
            url = _safe_file_url(media)
            if url:
                if _is_absolute(url):
                    return url
                return request.build_absolute_uri(url) if request else url

        # 2) Backward-compat: old direct ImageField `avatar` if it still exists
        avatar = getattr(obj, "avatar", None)
        url = _safe_file_url(avatar)
        if url:
            if _is_absolute(url):
                return url
            return request.build_absolute_uri(url) if request else url

        # 3) Default placeholder in MEDIA
        fallback_rel = _join_media_url(DEFAULT_AVATAR_PATH)
        if _is_absolute(fallback_rel):
            # MEDIA_URL might be absolute (CDN)
            return fallback_rel
        return request.build_absolute_uri(fallback_rel) if request else fallback_rel