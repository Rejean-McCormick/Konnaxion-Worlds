from __future__ import annotations

import json
import os
import secrets
from typing import Any

from django.db import IntegrityError, transaction
from django.db.models import Q
from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from konnaxion.worlds.db import world_db_scope
from konnaxion.worlds.models import World, WorldRelease
from konnaxion.worlds.resolver import runtime_from_release

from .models import OrgoImpactPublication
from .orgo_bridge_contract import (
    BridgeContractError,
    build_success_receipt,
    publication_payload_hash,
    validate_publish_request,
)


_TOKEN_ENV = "ORGO_KONNAXION_BRIDGE_TOKEN"


def _json_error(code: str, detail: str, *, status: int) -> JsonResponse:
    return JsonResponse({"ok": False, "error": {"code": code, "detail": detail}}, status=status)


def _authorized(request: HttpRequest) -> JsonResponse | None:
    configured = os.environ.get(_TOKEN_ENV, "")
    if len(configured) < 16:
        return _json_error(
            "BRIDGE_UNCONFIGURED",
            f"{_TOKEN_ENV} is not configured",
            status=503,
        )
    header = request.headers.get("Authorization", "")
    prefix = "Bearer "
    supplied = header[len(prefix) :] if header.startswith(prefix) else ""
    if not supplied or not secrets.compare_digest(supplied, configured):
        return _json_error("UNAUTHORIZED", "invalid bridge bearer token", status=401)
    return None


def _runtime(world_key: str):
    try:
        world = World.objects.select_related("current_release").get(key=world_key)
    except World.DoesNotExist as exc:
        raise BridgeContractError("WORLD_NOT_FOUND", 404, f"unknown World: {world_key}") from exc

    if world.status == World.STATUS_ARCHIVED:
        raise BridgeContractError("WORLD_NOT_FOUND", 404, f"World {world_key} is archived")
    if world.status == World.STATUS_MAINTENANCE:
        raise BridgeContractError("WORLD_MAINTENANCE", 503, f"World {world_key} is in maintenance")

    release = world.current_release
    if release is None:
        raise BridgeContractError("WORLD_NOT_READY", 409, f"World {world_key} has no current release")
    if release.world_id != world.id or release.status != WorldRelease.STATUS_CURRENT:
        raise BridgeContractError(
            "WORLD_NOT_READY",
            409,
            f"World {world_key} current release is not CURRENT",
        )
    return runtime_from_release(release)


def _load_json(request: HttpRequest) -> Any:
    if len(request.body) > 256_000:
        raise BridgeContractError("REQUEST_TOO_LARGE", 413, "request body exceeds 256 KB")
    try:
        return json.loads(request.body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise BridgeContractError("INVALID_JSON", 400, "request body must be valid UTF-8 JSON") from exc


def _existing_publication(parsed: dict[str, Any], payload_hash: str):
    candidates = list(
        OrgoImpactPublication.objects.select_for_update().filter(
            Q(operation_id=parsed["operation_id"])
            | Q(idempotency_key=parsed["idempotency_key"])
            | Q(external_reference=parsed["external_reference"])
        )
    )
    if not candidates:
        return None
    for item in candidates:
        if item.payload_hash != payload_hash:
            raise BridgeContractError(
                "IDEMPOTENCY_CONFLICT",
                409,
                "an existing operation/artifact uses the same durable identity with different content",
            )
    # Any matching durable identity with the same provider-owned payload is a replay.
    return candidates[0]


def _publish(parsed: dict[str, Any], *, world_key: str, release_number: int):
    payload_hash = publication_payload_hash(parsed)
    existing = _existing_publication(parsed, payload_hash)
    if existing is not None:
        return existing

    input_data = parsed["input"]
    try:
        # Inner atomic creates a savepoint so a uniqueness race can be recovered
        # without breaking the outer World transaction.
        with transaction.atomic():
            item = OrgoImpactPublication.objects.create(
                operation_id=parsed["operation_id"],
                organization_id=parsed["organization_id"],
                idempotency_key=parsed["idempotency_key"],
                correlation_id=parsed["correlation_id"],
                subject_type=parsed["subject"]["type"],
                subject_id=parsed["subject"]["id"],
                artifact_type=parsed["artifact_type"],
                external_reference=parsed["external_reference"],
                checkpoint=str(input_data.get("checkpoint") or "")[:80],
                demo_id=str(input_data.get("demo_id") or "")[:160],
                epistemic_status=str(input_data.get("epistemic_status") or "")[:80],
                payload_hash=payload_hash,
                request_json=parsed,
                receipt_json={},
            )
    except IntegrityError:
        # Concurrent at-least-once delivery: resolve to the durable winner.
        existing = _existing_publication(parsed, payload_hash)
        if existing is None:
            raise
        return existing

    receipt = build_success_receipt(
        external_reference=item.external_reference,
        impact_id=item.id,
        world_key=world_key,
        release_number=release_number,
        input_data=input_data,
    )
    item.receipt_json = receipt
    item.save(update_fields=["receipt_json", "updated_at"])
    return item


@require_GET
def orgo_bridge_health(request: HttpRequest) -> JsonResponse:
    denied = _authorized(request)
    if denied is not None:
        return denied
    worlds = [
        {
            "key": world.key,
            "title": world.title,
            "status": world.status,
            "release": world.current_release.release_number if world.current_release else None,
        }
        for world in World.objects.select_related("current_release")
        .exclude(status=World.STATUS_ARCHIVED)
        .order_by("key")
    ]
    return JsonResponse({"ok": True, "bridge": "orgo-konnaxion-impact/v1", "worlds": worlds})


@csrf_exempt
@require_POST
def orgo_bridge_publish(request: HttpRequest, world_key: str) -> JsonResponse:
    denied = _authorized(request)
    if denied is not None:
        return denied
    try:
        runtime = _runtime(world_key)
        parsed = validate_publish_request(
            _load_json(request),
            idempotency_header=request.headers.get("Idempotency-Key"),
            correlation_header=request.headers.get("X-Correlation-ID"),
        )
        with world_db_scope(runtime):
            item = _publish(
                parsed,
                world_key=runtime.world_key,
                release_number=runtime.release_number,
            )
            receipt = dict(item.receipt_json or {})
            if not receipt:
                receipt = build_success_receipt(
                    external_reference=item.external_reference,
                    impact_id=item.id,
                    world_key=runtime.world_key,
                    release_number=runtime.release_number,
                    input_data=item.request_json.get("input", {}),
                )
                item.receipt_json = receipt
                item.save(update_fields=["receipt_json", "updated_at"])
        return JsonResponse(receipt)
    except BridgeContractError as exc:
        return _json_error(exc.code, exc.detail, status=exc.status)


@require_GET
def orgo_bridge_impacts(request: HttpRequest, world_key: str) -> JsonResponse:
    denied = _authorized(request)
    if denied is not None:
        return denied
    try:
        runtime = _runtime(world_key)
        external_reference = (request.GET.get("external_reference") or "").strip()
        with world_db_scope(runtime):
            queryset = OrgoImpactPublication.objects.all()
            if external_reference:
                queryset = queryset.filter(external_reference=external_reference)
            rows = list(queryset.order_by("-published_at")[:50])
        return JsonResponse(
            {
                "ok": True,
                "world_key": runtime.world_key,
                "release": runtime.release_number,
                "count": len(rows),
                "items": [
                    {
                        "id": str(item.id),
                        "external_reference": item.external_reference,
                        "status": item.status,
                        "checkpoint": item.checkpoint,
                        "demo_id": item.demo_id,
                        "correlation_id": item.correlation_id,
                        "published_at": item.published_at.isoformat(),
                        "receipt": item.receipt_json,
                    }
                    for item in rows
                ],
            }
        )
    except BridgeContractError as exc:
        return _json_error(exc.code, exc.detail, status=exc.status)
