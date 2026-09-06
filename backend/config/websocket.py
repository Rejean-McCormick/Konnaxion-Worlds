# FILE: backend/config/websocket.py
import json
from datetime import datetime, timedelta, timezone
from typing import Any

REPORTS_WS_PATH = "/ws/reports/custom"
SUPPORTED_METRICS = {"smart-vote", "usage", "perf"}
SUPPORTED_GROUP_BY = {"day", "week"}


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _send_json(send, payload: dict[str, Any]) -> None:
    await send(
        {
            "type": "websocket.send",
            "text": json.dumps(payload, separators=(",", ":"), default=str),
        }
    )


def _coerce_text(event: dict[str, Any]) -> str | None:
    text = event.get("text")
    if text is not None:
        return text

    raw = event.get("bytes")
    if raw is None:
        return None

    try:
        return raw.decode("utf-8")
    except UnicodeDecodeError:
        return None


def _normalize_request(payload: dict[str, Any]) -> dict[str, Any]:
    metric = payload.get("metric")
    if metric not in SUPPORTED_METRICS:
        metric = "smart-vote"

    group_by = payload.get("group_by")
    if group_by not in SUPPORTED_GROUP_BY:
        group_by = "day"

    include_raw = bool(payload.get("include_raw_samples", False))

    range_payload = payload.get("range")
    if not isinstance(range_payload, dict):
        range_payload = {}

    return {
        "metric": metric,
        "group_by": group_by,
        "include_raw_samples": include_raw,
        "range": {
            "from": range_payload.get("from"),
            "to": range_payload.get("to"),
        },
    }


def _build_preview_samples(request_payload: dict[str, Any]) -> list[dict[str, Any]]:
    metric = request_payload["metric"]
    include_raw = request_payload["include_raw_samples"]

    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)

    if metric == "smart-vote":
        values = [42, 47, 51, 49, 55]
        metric_key = "avg_score"
    elif metric == "usage":
        values = [120, 136, 149, 162, 171]
        metric_key = "active_users"
    else:  # perf
        values = [280, 265, 250, 242, 238]
        metric_key = "p95_latency_ms"

    samples: list[dict[str, Any]] = []
    for index, value in enumerate(values):
        ts = (now - timedelta(days=(len(values) - 1 - index))).isoformat()
        sample: dict[str, Any] = {
            "ts": ts,
            "label": f"P{index + 1}",
            "metrics": {metric_key: value},
        }

        if include_raw:
            sample["raw"] = {
                "metric": metric,
                "group_by": request_payload["group_by"],
                "source": "backend.config.websocket.preview",
                "position": index,
            }

        samples.append(sample)

    return samples


def _build_summary(
    request_payload: dict[str, Any],
    samples: list[dict[str, Any]],
) -> dict[str, Any]:
    metric = request_payload["metric"]

    if metric == "smart-vote":
        aggregates = {
            "total_votes": 1250,
            "avg_score": round(
                sum(sample["metrics"]["avg_score"] for sample in samples) / len(samples),
                2,
            ),
        }
    elif metric == "usage":
        aggregates = {
            "active_users": samples[-1]["metrics"]["active_users"],
            "sample_total": sum(sample["metrics"]["active_users"] for sample in samples),
        }
    else:
        aggregates = {
            "p95_latency_ms": samples[-1]["metrics"]["p95_latency_ms"],
            "best_latency_ms": min(
                sample["metrics"]["p95_latency_ms"] for sample in samples
            ),
        }

    return {
        "queryId": f'{metric}:{request_payload["group_by"]}',
        "sampleCount": len(samples),
        "durationMs": 5,
        "aggregates": aggregates,
        "meta": {
            "metric": metric,
            "group_by": request_payload["group_by"],
            "range": request_payload["range"],
            "preview": True,
        },
    }


async def websocket_application(scope, receive, send):
    path = scope.get("path", "")
    accepted = False

    while True:
        event = await receive()
        event_type = event.get("type")

        if event_type == "websocket.connect":
            if path != REPORTS_WS_PATH:
                await send({"type": "websocket.close", "code": 4404})
                return

            await send({"type": "websocket.accept"})
            accepted = True

            await _send_json(
                send,
                {
                    "kind": "connected",
                    "at": _iso_now(),
                    "path": path,
                },
            )
            continue

        if event_type == "websocket.disconnect":
            return

        if event_type != "websocket.receive" or not accepted:
            continue

        text = _coerce_text(event)
        if text is None:
            await _send_json(
                send,
                {
                    "kind": "error",
                    "at": _iso_now(),
                    "error": {
                        "code": "UNSUPPORTED_FRAME",
                        "message": "Only text websocket frames are supported.",
                    },
                },
            )
            continue

        if text == "ping":
            await send({"type": "websocket.send", "text": "pong!"})
            await _send_json(
                send,
                {
                    "kind": "keepalive",
                    "at": _iso_now(),
                    "payload": {"path": path},
                },
            )
            continue

        try:
            payload = json.loads(text)
        except json.JSONDecodeError:
            await _send_json(
                send,
                {
                    "kind": "error",
                    "at": _iso_now(),
                    "error": {
                        "code": "INVALID_JSON",
                        "message": "Expected JSON payload or the literal 'ping'.",
                    },
                },
            )
            continue

        if not isinstance(payload, dict):
            await _send_json(
                send,
                {
                    "kind": "error",
                    "at": _iso_now(),
                    "error": {
                        "code": "INVALID_PAYLOAD",
                        "message": "Expected a JSON object payload.",
                    },
                },
            )
            continue

        request_payload = _normalize_request(payload)
        samples = _build_preview_samples(request_payload)
        summary = _build_summary(request_payload, samples)

        await _send_json(
            send,
            {
                "kind": "summary",
                "at": _iso_now(),
                "summary": summary,
            },
        )

        for sample in samples:
            await _send_json(
                send,
                {
                    "kind": "sample",
                    "at": sample["ts"],
                    "sample": sample,
                },
            )