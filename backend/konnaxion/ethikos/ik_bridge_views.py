from __future__ import annotations

from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from konnaxion.integrations.interaction_kernel.contracts import (
    IKContractError,
    error_receipt,
    impact_publish_to_legacy_request,
    success_receipt,
)
from konnaxion.worlds.db import world_db_scope

from .orgo_bridge_contract import BridgeContractError, validate_publish_request
from .orgo_bridge_views import _authorized, _load_json, _publish, _runtime


def _bridge_failure(envelope, exc: BridgeContractError) -> JsonResponse:
    blocked = exc.code in {"WORLD_MAINTENANCE", "WORLD_NOT_READY"}
    retryable = exc.status >= 500 or exc.code in {"WORLD_MAINTENANCE", "WORLD_NOT_READY"}
    receipt = error_receipt(
        envelope,
        status="blocked" if blocked else "rejected",
        code=f"IK_{exc.code}",
        retryable=retryable,
        detail=exc.detail,
    )
    return JsonResponse(receipt, status=exc.status)


@csrf_exempt
@require_POST
def ik_interaction_ingress(request: HttpRequest, world_key: str) -> JsonResponse:
    """IK compatibility ingress for Orgo -> Konnaxion impact publication.

    The hardened legacy bridge remains the provider-owned mutation path. This
    endpoint validates/maps an IK envelope into that contract so migration is
    additive and reversible.
    """

    denied = _authorized(request)
    if denied is not None:
        return denied

    envelope = None
    try:
        envelope = _load_json(request)
        if not isinstance(envelope, dict):
            raise IKContractError("IK_INVALID_ENVELOPE", "request body must be an object")
        target = envelope.get("target") or {}
        target_world = target.get("world")
        if target_world and target_world != world_key:
            raise IKContractError(
                "IK_TARGET_NOT_FOUND",
                "target.world does not match the World-scoped ingress URL",
            )

        legacy = impact_publish_to_legacy_request(envelope)
        parsed = validate_publish_request(
            legacy,
            idempotency_header=str(envelope.get("idempotency_key") or ""),
            correlation_header=str(envelope.get("correlation_id") or envelope.get("id") or ""),
        )
        runtime = _runtime(world_key)
        with world_db_scope(runtime):
            item = _publish(
                parsed,
                world_key=runtime.world_key,
                release_number=runtime.release_number,
            )
        legacy_receipt = dict(item.receipt_json or {})
        receipt = success_receipt(
            envelope,
            external_reference=item.external_reference,
            data=legacy_receipt.get("data") or {},
        )
        return JsonResponse(receipt, status=200)
    except IKContractError as exc:
        receipt = error_receipt(
            envelope if isinstance(envelope, dict) else None,
            status="rejected",
            code=exc.code,
            retryable=False,
            detail=exc.detail,
        )
        return JsonResponse(receipt, status=400)
    except BridgeContractError as exc:
        return _bridge_failure(envelope if isinstance(envelope, dict) else None, exc)
