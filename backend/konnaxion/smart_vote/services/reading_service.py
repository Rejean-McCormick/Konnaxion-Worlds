"""Declared Smart Vote readings over canonical Ethikos topic stances."""

from __future__ import annotations

import hashlib
import json
from decimal import Decimal
from typing import Any

from django.utils import timezone

from konnaxion.ekoh.db import ekoh_smartvote_db_scope
from konnaxion.ekoh.models.scores import UserEthicsScore, UserExpertiseScore
from konnaxion.ekoh.services.rating_access import resolve_rating_access
from konnaxion.ethikos.models import EthikosStance
from konnaxion.smart_vote.models import (
    ConsultationRelevance,
    SourceConsultationBinding,
)
from konnaxion.smart_vote.services.weight_calculator import (
    get_expertise_alignment,
    get_weight,
)

READING_KEY = "ekoh_weighted_v1"
READING_METHOD = "weighted_average"
READING_VERSION = "v1"
SOURCE_TYPE_ETHIKOS_TOPIC = "ethikos_topic"


def _decimal(value: Any) -> Decimal:
    return Decimal(str(value))


def _normalise_score(value: Decimal) -> Decimal:
    value = max(Decimal("0"), _decimal(value))
    if value > 1:
        value = value / Decimal("100")
    return min(Decimal("1"), value)


def _hash_payload(payload: Any) -> str:
    canonical = json.dumps(
        payload,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
        default=str,
    ).encode("utf-8")
    return "sha256:" + hashlib.sha256(canonical).hexdigest()


def _stance_bucket(value: Decimal) -> str:
    if value > 0:
        return "support"
    if value < 0:
        return "oppose"
    return "neutral"


def _count_distribution(values: list[Decimal]) -> dict[str, Any]:
    counts = {"support": 0, "neutral": 0, "oppose": 0}
    for value in values:
        counts[_stance_bucket(value)] += 1

    total = len(values)
    return {
        "support_count": counts["support"],
        "neutral_count": counts["neutral"],
        "oppose_count": counts["oppose"],
        "support_share": counts["support"] / total if total else 0.0,
        "neutral_share": counts["neutral"] / total if total else 0.0,
        "oppose_share": counts["oppose"] / total if total else 0.0,
    }


def _weighted_distribution(
    bucket_weights: dict[str, Decimal],
    total_weight: Decimal,
) -> dict[str, float]:
    if total_weight <= 0:
        return {
            "support_share": 0.0,
            "neutral_share": 0.0,
            "oppose_share": 0.0,
        }

    return {
        "support_share": float(bucket_weights["support"] / total_weight),
        "neutral_share": float(bucket_weights["neutral"] / total_weight),
        "oppose_share": float(bucket_weights["oppose"] / total_weight),
    }


def _normalise_advisory_exclusions(binding) -> list[dict[str, Any]]:
    metadata = binding.metadata_json or {}
    raw = metadata.get("advisory_exclusions", [])
    if not isinstance(raw, list):
        return []

    rows: list[dict[str, Any]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        try:
            user_id = int(item.get("user_id"))
        except (TypeError, ValueError):
            continue

        rows.append(
            {
                "actor_key": str(item.get("actor_key") or ""),
                "user_id": user_id,
                "reason": str(item.get("reason") or "Declared advisory exclusion."),
                "scope": "advisory_only",
            }
        )

    return rows


def build_ethikos_topic_reading(topic_id: int, *, viewer=None) -> dict[str, Any] | None:
    """Compute a declared reading inside the EkoH/Smart Vote DB schema scope."""
    with ekoh_smartvote_db_scope():
        return _build_ethikos_topic_reading(topic_id, viewer=viewer)


def _build_ethikos_topic_reading(topic_id: int, *, viewer=None) -> dict[str, Any] | None:
    """Compute baseline + one declared EkoH advisory reading for a topic.

    Source stances remain canonical and are always included in the baseline.
    Explicit advisory-only exclusions (for example a voluntary recusal) are
    lens configuration stored on the source binding. They do not delete or
    mutate the underlying EthikosStance.
    """
    binding = (
        SourceConsultationBinding.objects.select_related("consultation")
        .filter(source_type=SOURCE_TYPE_ETHIKOS_TOPIC, source_id=str(topic_id))
        .first()
    )
    if binding is None:
        return None

    consultation = binding.consultation
    relevance_rows = list(
        ConsultationRelevance.objects.select_related("category")
        .filter(consultation=consultation)
        .order_by("category__code")
    )
    stances = list(
        EthikosStance.objects.select_related("user")
        .filter(topic_id=topic_id)
        .order_by("user_id")
    )
    advisory_exclusions = _normalise_advisory_exclusions(binding)
    exclusion_by_user_id = {
        row["user_id"]: row for row in advisory_exclusions
    }

    relevance_payload = [
        {
            "domain_code": row.category.code,
            "domain_name": row.category.name,
            "weight": float(row.weight),
            "criteria": row.criteria_json,
        }
        for row in relevance_rows
    ]
    lens_payload = {
        "reading_key": READING_KEY,
        "method": READING_METHOD,
        "version": READING_VERSION,
        "formula": "1 + min(dot(topic_relevance, expertise), cap) * ethics",
        "source_type": SOURCE_TYPE_ETHIKOS_TOPIC,
        "source_id": str(topic_id),
        "domains": relevance_payload,
        "advisory_exclusions": advisory_exclusions,
    }
    lens_hash = _hash_payload(lens_payload)

    values = [_decimal(stance.value) for stance in stances]
    baseline_score = (
        sum(values, Decimal("0")) / Decimal(len(values)) if values else Decimal("0")
    )
    baseline_distribution = _count_distribution(values)

    relevant_category_ids = [row.category_id for row in relevance_rows]
    expertise_rows = UserExpertiseScore.objects.filter(
        user_id__in=[stance.user_id for stance in stances],
        category_id__in=relevant_category_ids,
    ).values_list("user_id", "category_id", "weighted_score")
    expertise_by_user: dict[int, dict[int, Decimal]] = {}
    for user_id, category_id, score in expertise_rows:
        expertise_by_user.setdefault(user_id, {})[category_id] = _normalise_score(
            _decimal(score)
        )

    ethics_rows = UserEthicsScore.objects.filter(
        user_id__in=[stance.user_id for stance in stances]
    ).values_list("user_id", "ethical_score")
    ethics_by_user = {user_id: _decimal(score) for user_id, score in ethics_rows}

    snapshot_payload = []
    participant_payload = []
    weighted_sum = Decimal("0")
    total_weight = Decimal("0")
    alignment_sum = Decimal("0")
    covered_participants = 0
    advisory_participant_count = 0
    bucket_weights = {
        "support": Decimal("0"),
        "neutral": Decimal("0"),
        "oppose": Decimal("0"),
    }

    for stance in stances:
        alignment = get_expertise_alignment(stance.user_id, consultation.pk)
        excluded = stance.user_id in exclusion_by_user_id
        source_weight = get_weight(stance.user_id, consultation.pk)
        reading_weight = Decimal("0") if excluded else source_weight
        stance_value = _decimal(stance.value)
        ethics = ethics_by_user.get(stance.user_id, Decimal("1.0"))

        if not excluded:
            weighted_sum += stance_value * reading_weight
            total_weight += reading_weight
            alignment_sum += alignment
            advisory_participant_count += 1
            if alignment > 0:
                covered_participants += 1
            bucket_weights[_stance_bucket(stance_value)] += reading_weight

        domain_scores = expertise_by_user.get(stance.user_id, {})
        exclusion = exclusion_by_user_id.get(stance.user_id)
        display_name = (getattr(stance.user, "name", "") or "").strip()
        if not display_name:
            full_name = (stance.user.get_full_name() or "").strip()
            # Konnaxion's custom User disables first_name/last_name. Django's
            # inherited get_full_name() can therefore yield the literal "None None".
            if full_name and all(part.casefold() != "none" for part in full_name.split()):
                display_name = full_name
        if not display_name:
            display_name = stance.user.username

        rating_access = resolve_rating_access(viewer=viewer, subject=stance.user)
        if rating_access.allowed:
            participant_payload.append(
                {
                    "user_id": stance.user_id,
                    "display_name": display_name,
                    "stance_value": int(stance.value),
                    "expertise_alignment": float(alignment),
                    "advisory_weight": float(reading_weight),
                    "included_in_advisory": not excluded,
                    "exclusion_reason": exclusion["reason"] if exclusion else None,
                    "rating_access": rating_access.as_dict(),
                }
            )

        snapshot_payload.append(
            {
                "user_id": stance.user_id,
                "ethics": str(ethics),
                "expertise": {
                    str(category_id): str(domain_scores.get(category_id, Decimal("0")))
                    for category_id in relevant_category_ids
                },
                "included_in_advisory": not excluded,
                "exclusion_reason": exclusion["reason"] if exclusion else None,
            }
        )

    reading_score = (
        weighted_sum / total_weight if total_weight > 0 else baseline_score
    )
    average_alignment = (
        alignment_sum / Decimal(advisory_participant_count)
        if advisory_participant_count
        else Decimal("0")
    )
    expertise_coverage = (
        Decimal(covered_participants) / Decimal(advisory_participant_count)
        if advisory_participant_count
        else Decimal("0")
    )

    snapshot_ref = "ekoh_snapshot:" + _hash_payload(snapshot_payload).split(":", 1)[1]
    computed_at = timezone.now().isoformat()

    return {
        "target_type": SOURCE_TYPE_ETHIKOS_TOPIC,
        "target_id": str(topic_id),
        "smart_vote_consultation_id": str(consultation.pk),
        "baseline": {
            "reading_key": "baseline",
            "lens_hash": None,
            "snapshot_ref": None,
            "computed_at": computed_at,
            "results_payload": {
                "score": float(baseline_score),
                "participant_count": len(stances),
                **baseline_distribution,
            },
        },
        "readings": [
            {
                "reading_key": READING_KEY,
                "method": READING_METHOD,
                "version": READING_VERSION,
                "lens_hash": lens_hash,
                "snapshot_ref": snapshot_ref,
                "computed_at": computed_at,
                "results_payload": {
                    "score": float(reading_score),
                    "participant_count": len(stances),
                    "advisory_participant_count": advisory_participant_count,
                    "excluded_participant_count": len(stances)
                    - advisory_participant_count,
                    "total_advisory_weight": float(total_weight),
                    "average_expertise_alignment": float(average_alignment),
                    "expertise_coverage": float(expertise_coverage),
                    "domains": relevance_payload,
                    "participant_detail_visible_count": len(participant_payload),
                    "participants": participant_payload,
                    **_weighted_distribution(bucket_weights, total_weight),
                },
            }
        ],
    }
