from __future__ import annotations

import json
import socket
from dataclasses import dataclass
from typing import Any, Mapping
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings


@dataclass(frozen=True)
class DeliveryResult:
    ok: bool
    retryable: bool
    code: str
    detail: str
    receipt: dict[str, Any]


def _decode_json(raw: bytes) -> dict[str, Any]:
    if not raw:
        return {}
    try:
        value = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return {}
    return value if isinstance(value, dict) else {}


def deliver_to_orgo(envelope: Mapping[str, Any]) -> DeliveryResult:
    """Deliver one IK envelope using the configured Orgo HTTP binding."""

    url = str(getattr(settings, "IK_ORGO_INTERACTIONS_URL", "") or "").strip()
    token = str(getattr(settings, "IK_ORGO_TOKEN", "") or "").strip()
    timeout = float(getattr(settings, "IK_HTTP_TIMEOUT_SECONDS", 10.0) or 10.0)
    if not url:
        return DeliveryResult(False, False, "IK_TARGET_NOT_CONFIGURED", "IK_ORGO_INTERACTIONS_URL is empty", {})
    if not token:
        return DeliveryResult(False, False, "IK_TARGET_NOT_CONFIGURED", "IK_ORGO_TOKEN is empty", {})

    body = json.dumps(envelope, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    request = Request(
        url,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Idempotency-Key": str(envelope.get("idempotency_key") or ""),
            "X-Correlation-ID": str(envelope.get("correlation_id") or envelope.get("id") or ""),
            "X-Interaction-Kernel-Version": str(envelope.get("specversion") or ""),
        },
    )

    try:
        with urlopen(request, timeout=timeout) as response:  # noqa: S310 - deployment allowlists the URL.
            payload = _decode_json(response.read())
            status = int(getattr(response, "status", 200) or 200)
            if 200 <= status < 300:
                return DeliveryResult(True, False, "", "", payload)
            return DeliveryResult(False, status >= 500 or status == 429, f"HTTP_{status}", "unexpected response", payload)
    except HTTPError as exc:
        payload = _decode_json(exc.read())
        retryable = exc.code == 429 or 500 <= exc.code <= 599
        return DeliveryResult(False, retryable, f"HTTP_{exc.code}", str(payload or exc.reason), payload)
    except (URLError, TimeoutError, socket.timeout) as exc:
        return DeliveryResult(False, True, "IK_PROVIDER_UNAVAILABLE", str(exc), {})
