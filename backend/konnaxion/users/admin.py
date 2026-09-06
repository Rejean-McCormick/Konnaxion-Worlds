# FILE: backend/konnaxion/users/admin.py
# konnaxion/users/admin.py
from allauth.account.decorators import secure_admin_login
from django.conf import settings
from django.contrib import admin
from django.contrib.auth import admin as auth_admin
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from .forms import UserAdminChangeForm, UserAdminCreationForm
from .models import User

if getattr(settings, "DJANGO_ADMIN_FORCE_ALLAUTH", False):
    # Force the `admin` sign-in process to go through django‑allauth.
    admin.autodiscover()
    admin.site.login = secure_admin_login(admin.site.login)  # type: ignore[method-assign]


@admin.register(User)
class UserAdmin(auth_admin.UserAdmin):
    form = UserAdminChangeForm
    add_form = UserAdminCreationForm

    # ---- Avatar helpers (safe even if no avatar field exists yet) ----
    def _avatar_url(self, obj: User) -> str:
        """
        Resolve the best available avatar URL for this user:
        - If the user has a Kreative profile artwork, use its media_file.
        - Else, if a file field exists (avatar_file / avatar / profile_image / image), use its .url.
        - Else, if an explicit avatar_url attribute or property exists, use it.
        - Else, fall back to the default image in MEDIA: /kreative/artworks/default_profile.png.
        """
        # 0) Preferred: linked KreativeArtwork as profile picture
        artwork = getattr(obj, "profile_artwork", None)
        if artwork is not None:
            media = getattr(artwork, "media_file", None)
            if media:
                url = getattr(media, "url", None) or str(media)
                if url:
                    return url

        # 1) Common file-field names we may add later
        for fname in ("avatar_file", "avatar", "profile_image", "image"):
            f = getattr(obj, fname, None)
            if f:
                url = getattr(f, "url", None) or str(f)
                if url:
                    return url

        # 2) Optional computed/explicit URL
        candidate = getattr(obj, "avatar_url", None)
        if callable(candidate):
            try:
                candidate = candidate()
            except Exception:
                candidate = None
        if isinstance(candidate, str) and candidate:
            return candidate

        # 3) Default placeholder in MEDIA
        media_url = getattr(settings, "MEDIA_URL", "/media/")
        return f"{media_url.rstrip('/')}/kreative/artworks/default_profile.png"

    @admin.display(description=_("Avatar"))
    def thumbnail(self, obj: User) -> str:
        url = self._avatar_url(obj)
        return format_html(
            '<img src="{}" alt="avatar" style="height:32px;width:32px;'
            'border-radius:50%;object-fit:cover;vertical-align:middle;"/>',
            url,
        )

    @admin.display(description=_("Preview"))
    def avatar_preview(self, obj: User) -> str:
        url = self._avatar_url(obj)
        return format_html(
            '<img src="{}" alt="avatar preview" style="height:96px;width:96px;'
            'border-radius:50%;object-fit:cover;border:1px solid #e5e5e5;"/>',
            url,
        )

    # ---- Admin layout ----
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (_("Personal info"), {"fields": ("name", "email")}),
        (_("Profile image"), {"fields": ("avatar_preview",)}),  # read‑only preview
        (
            _("Permissions"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        (_("Important dates"), {"fields": ("last_login", "date_joined")}),
    )
    readonly_fields = ("avatar_preview",)

    list_display = ["thumbnail", "username", "name", "email", "is_staff", "is_superuser"]
    list_filter = ["is_staff", "is_superuser", "is_active", "groups"]
    search_fields = ["username", "name", "email"]
    ordering = ["username"]
