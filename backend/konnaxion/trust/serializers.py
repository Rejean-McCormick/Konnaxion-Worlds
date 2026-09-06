# backend/konnaxion/trust/serializers.py

from __future__ import annotations

from typing import Any, Optional

from rest_framework import serializers

from .models import Credential

__all__ = ["CredentialSerializer"]


class CredentialSerializer(serializers.ModelSerializer):
    """
    Serializer for user-submitted real-world credentials used in the Trust module.

    It matches the frontend credential shape used by:
      - frontend/services/trust.ts
      - frontend/app/ethikos/trust/credentials/page.tsx

    Response shape:
      - id
      - title
      - issuer
      - issuedAt
      - url
      - status
      - notes

    Write-only input:
      - file
    """

    # Frontend expects camelCase `issuedAt`, mapped to model field `issued_at`.
    issuedAt = serializers.DateTimeField(
        source="issued_at",
        required=False,
        allow_null=True,
        format=None,  # keep ISO 8601 output
    )

    # Frontend uploads under `file`; internally we map it to the model alias
    # `document`, which resolves to the real FileField (`file`) during create().
    file = serializers.FileField(
        write_only=True,
        required=False,
        source="document",
    )

    # Read-only computed fields for the frontend table / drawer.
    url = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    notes = serializers.CharField(
        read_only=True,
        allow_blank=True,
        allow_null=True,
    )

    class Meta:
        model = Credential
        fields = (
            "id",
            "title",
            "issuer",
            "issuedAt",
            "url",
            "status",
            "notes",
            "file",
        )
        read_only_fields = (
            "id",
            "url",
            "status",
            "notes",
        )
        extra_kwargs = {
            "title": {"required": False, "allow_blank": True},
            "issuer": {"required": False, "allow_blank": True},
        }

    # ------------------------------------------------------------------
    # Validation
    # ------------------------------------------------------------------

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        """
        Enforce upload requirements on create while remaining permissive for updates.
        """
        if self.instance is None and not attrs.get("document"):
            raise serializers.ValidationError(
                {"file": ["This field is required."]}
            )
        return attrs

    # ------------------------------------------------------------------
    # Creation
    # ------------------------------------------------------------------

    def create(self, validated_data: dict[str, Any]) -> Credential:
        """
        Create a new Credential attached to the authenticated user.

        Behaviour:
        - `file` is required on create.
        - `title` defaults to a cleaned-up filename when omitted.
        - `issuer` is optional.
        - `issued_at` is optional and may be null.
        - `status` starts as Pending.
        - `notes` starts with the model's default pending-review message.
        """
        request = self.context.get("request")
        user = getattr(request, "user", None)

        if user is None or not getattr(user, "is_authenticated", False):
            raise serializers.ValidationError(
                {
                    "non_field_errors": [
                        "Authentication required to upload credentials."
                    ]
                }
            )

        # Because `file` is declared with source="document",
        # the validated key here is `document`.
        document = validated_data.pop("document", None)
        if document is None:
            raise serializers.ValidationError(
                {"file": ["This field is required."]}
            )

        raw_title = validated_data.get("title")
        title: Optional[str] = raw_title.strip() if isinstance(raw_title, str) else None
        if not title:
            filename = getattr(document, "name", "") or ""
            base = filename.rsplit(".", 1)[0]
            base = base.replace("_", " ").replace("-", " ").strip()
            title = base or "Untitled credential"

        raw_issuer = validated_data.get("issuer")
        issuer = raw_issuer.strip() if isinstance(raw_issuer, str) else ""
        issued_at = validated_data.get("issued_at")

        status_enum = getattr(Credential, "Status", None)
        if status_enum is not None and hasattr(status_enum, "PENDING"):
            status_value = status_enum.PENDING
        elif hasattr(Credential, "STATUS_PENDING"):
            status_value = getattr(Credential, "STATUS_PENDING")
        else:
            status_value = "Pending"

        default_notes = getattr(
            Credential,
            "DEFAULT_PENDING_NOTES",
            "Awaiting manual verification",
        )

        return Credential.objects.create(
            user=user,
            title=title,
            issuer=issuer,
            issued_at=issued_at,
            file=document,
            status=status_value,
            notes=default_notes,
        )

    # ------------------------------------------------------------------
    # Computed fields
    # ------------------------------------------------------------------

    def get_url(self, obj: Credential) -> Optional[str]:
        """
        Return an absolute URL to the uploaded document, if available.
        """
        file_field = getattr(obj, "document", None) or getattr(obj, "file", None)
        if not file_field:
            return None

        try:
            relative_url = file_field.url
        except Exception:
            return None

        request = self.context.get("request")
        if request is not None:
            return request.build_absolute_uri(relative_url)
        return relative_url

    def get_status(self, obj: Credential) -> Optional[str]:
        """
        Return a human-friendly review status string for the UI.
        """
        display = getattr(obj, "get_status_display", None)
        if callable(display):
            return display()

        raw = getattr(obj, "status", None)
        if isinstance(raw, str):
            return raw.replace("_", " ").title()
        return raw