"""Real, cross-sectional Smart Vote reporting over canonical Ethikos source facts.

The current data model stores one mutable EthikosStance per user/topic and does
not provide an append-only stance event log. Therefore this module deliberately
reports current state for topics created in the selected range and marks
historical trend data as unavailable instead of fabricating time series.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import timedelta
from decimal import Decimal
from typing import Any

from django.utils import timezone

from konnaxion.ekoh.db import ekoh_smartvote_db_scope
from konnaxion.ethikos.models import EthikosStance, EthikosTopic
from konnaxion.smart_vote.models import ConsultationRelevance, SourceConsultationBinding


VALID_RANGE_DAYS = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
}


def _range_days(range_key: str) -> int:
    return VALID_RANGE_DAYS.get(range_key, 30)


def _topic_binding_rows() -> list[dict[str, Any]]:
    with ekoh_smartvote_db_scope():
        return list(
            SourceConsultationBinding.objects.filter(source_type="ethikos_topic")
            .values("source_id", "consultation_id")
            .order_by("source_id")
        )


def _relevance_rows(consultation_ids: set[Any]) -> list[dict[str, Any]]:
    if not consultation_ids:
        return []

    with ekoh_smartvote_db_scope():
        return list(
            ConsultationRelevance.objects.filter(consultation_id__in=consultation_ids)
            .values(
                "consultation_id",
                "category__code",
                "category__name",
                "weight",
            )
            .order_by("category__code", "consultation_id")
        )


def build_smart_vote_report(range_key: str) -> dict[str, Any]:
    days = _range_days(range_key)
    now = timezone.now()
    since = now - timedelta(days=days)

    binding_rows = _topic_binding_rows()

    topic_to_consultation: dict[int, Any] = {}
    for row in binding_rows:
        try:
            topic_id = int(row["source_id"])
        except (TypeError, ValueError):
            continue
        topic_to_consultation[topic_id] = row["consultation_id"]

    topic_ids = set(topic_to_consultation)
    topic_rows = list(
        EthikosTopic.objects.filter(id__in=topic_ids, created_at__gte=since)
        .values("id", "status", "created_at")
        .order_by("id")
    )
    selected_topic_ids = {row["id"] for row in topic_rows}

    selected_topic_to_consultation = {
        topic_id: consultation_id
        for topic_id, consultation_id in topic_to_consultation.items()
        if topic_id in selected_topic_ids
    }
    consultation_to_topic = {
        consultation_id: topic_id
        for topic_id, consultation_id in selected_topic_to_consultation.items()
    }
    consultation_ids = set(consultation_to_topic)

    stance_rows = list(
        EthikosStance.objects.filter(topic_id__in=selected_topic_ids)
        .values("topic_id", "value")
        .order_by("topic_id", "user_id")
    )
    stances_by_topic: dict[int, list[int]] = defaultdict(list)
    for row in stance_rows:
        stances_by_topic[row["topic_id"]].append(int(row["value"]))

    relevance_rows = _relevance_rows(consultation_ids)

    domains: dict[str, dict[str, Any]] = {}
    for row in relevance_rows:
        topic_id = consultation_to_topic.get(row["consultation_id"])
        if topic_id is None:
            continue

        code = str(row["category__code"])
        name = str(row["category__name"])
        entry = domains.setdefault(
            code,
            {
                "key": code,
                "domainCode": code,
                "domain": name,
                "topicIds": set(),
                "weights": [],
            },
        )
        entry["topicIds"].add(topic_id)
        entry["weights"].append(Decimal(str(row["weight"])))

    domain_rows: list[dict[str, Any]] = []
    for code in sorted(domains):
        entry = domains[code]
        domain_topic_ids = entry["topicIds"]
        topic_count = len(domain_topic_ids)
        topics_with_stances = sum(1 for topic_id in domain_topic_ids if stances_by_topic[topic_id])
        current_stances = sum(len(stances_by_topic[topic_id]) for topic_id in domain_topic_ids)
        weights: list[Decimal] = entry["weights"]
        avg_weight = sum(weights, Decimal("0")) / Decimal(len(weights)) if weights else Decimal("0")

        domain_rows.append(
            {
                "key": entry["key"],
                "domainCode": entry["domainCode"],
                "domain": entry["domain"],
                "topics": topic_count,
                "currentStances": current_stances,
                "topicsWithStancesPct": round(
                    (topics_with_stances / topic_count) * 100,
                    1,
                )
                if topic_count
                else 0.0,
                "avgRelevancePct": round(float(avg_weight) * 100, 1),
            }
        )

    summary = {
        "linkedTopics": len(selected_topic_ids),
        "openTopics": sum(1 for row in topic_rows if row["status"] == EthikosTopic.OPEN),
        "currentStances": len(stance_rows),
        "domainsCovered": len(domain_rows),
    }

    history_reason = (
        "Historical vote trends are unavailable because the canonical Ethikos stance model "
        "stores current state (one stance per user/topic) rather than an append-only event log. "
        "No synthetic time series is generated."
    )

    return {
        "generatedAt": now.isoformat(),
        "range": {
            "key": range_key if range_key in VALID_RANGE_DAYS else "30d",
            "days": days,
            "from": since.isoformat(),
            "to": now.isoformat(),
            "semantics": "topics_created_in_range_current_stance_snapshot",
        },
        "summary": summary,
        "history": {
            "available": False,
            "reason": history_reason,
        },
        "domains": domain_rows,
        # Compatibility fields for older report consumers. Empty means unavailable,
        # not zero-valued history.
        "points": [],
        "labels": [],
        "votes": [],
        "avg_score": [],
    }
