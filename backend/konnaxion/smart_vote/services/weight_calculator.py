"""Contextual EkoH weight calculator used by Smart Vote readings.

Source facts remain unweighted in ethiKos/Konsultations.  This service computes
an *advisory reading weight* from:
    - the consultation relevance vector R[c,d]
    - the user's EkoH expertise vector S[u,d]
    - an optional ethics/trust multiplier E[u]

The democratic baseline is not replaced.  Every participant starts at 1.0 in
this reading and receives only a bounded contextual bonus:

    W[u,c] = 1 + min(sum_d R[c,d] * S[u,d], cap) * E[u]

New EkoH scores are normalized to 0..1.  Legacy 0..100 values are normalized
at read time so old rows do not create extreme multipliers.
"""

from __future__ import annotations

import logging
from decimal import Decimal
from functools import lru_cache
from typing import Dict

from konnaxion.ekoh.db import ekoh_smartvote_db_scope
from konnaxion.ekoh.models.config import ScoreConfiguration
from konnaxion.ekoh.models.scores import UserEthicsScore, UserExpertiseScore
from konnaxion.smart_vote.models.consultation_relevance import ConsultationRelevance
from konnaxion.worlds.runtime import get_world_runtime

LOGGER = logging.getLogger(__name__)

ONE = Decimal("1.0")
ZERO = Decimal("0.0")
HUNDRED = Decimal("100.0")


def _cache_scope() -> tuple[int, int]:
    runtime = get_world_runtime()
    return (runtime.world_id, runtime.release_id) if runtime else (0, 0)


@lru_cache(maxsize=256)
def _fetch_param_cached(scope: tuple[int, int], name: str, default: Decimal) -> Decimal:
    del scope
    obj = ScoreConfiguration.objects.filter(weight_name=name).first()
    if obj is None:
        return default
    return Decimal(obj.weight_value)


def _fetch_param(name: str, default: Decimal = ONE) -> Decimal:
    return _fetch_param_cached(_cache_scope(), name, default)


def expertise_bonus_cap() -> Decimal:
    """Maximum expertise bonus added on top of the 1.0 baseline."""
    value = _fetch_param("EKOH_MULTIPLIER_CAP", ONE)
    return max(ZERO, value)


@lru_cache(maxsize=2048)
def _relevance_vector_cached(scope: tuple[int, int], consultation_id) -> Dict[int, Decimal]:
    del scope
    rows = ConsultationRelevance.objects.filter(
        consultation_id=consultation_id
    ).values_list("category_id", "weight")
    return {
        cid: max(ZERO, min(ONE, Decimal(weight)))
        for cid, weight in rows
    }


def _relevance_vector(consultation_id) -> Dict[int, Decimal]:
    return _relevance_vector_cached(_cache_scope(), consultation_id)


def _normalise_expertise_score(value: Decimal) -> Decimal:
    """Accept current 0..1 scores and safely read legacy 0..100 rows."""
    value = max(ZERO, Decimal(value))
    if value > ONE:
        value = value / HUNDRED
    return min(ONE, value)


@lru_cache(maxsize=20_000)
def _expertise_vector_cached(scope: tuple[int, int], user_id: int) -> Dict[int, Decimal]:
    del scope
    rows = UserExpertiseScore.objects.filter(user_id=user_id).values_list(
        "category_id",
        "weighted_score",
    )
    return {
        cid: _normalise_expertise_score(Decimal(score))
        for cid, score in rows
    }


def _expertise_vector(user_id: int) -> Dict[int, Decimal]:
    return _expertise_vector_cached(_cache_scope(), user_id)


def _ethics_multiplier(user_id: int) -> Decimal:
    """Return a non-negative trust modifier; neutral is 1.0."""
    row = UserEthicsScore.objects.filter(user_id=user_id).first()
    if not row:
        return ONE
    return max(ZERO, Decimal(row.ethical_score))


def _get_expertise_alignment_core(user_id: int, consultation_id) -> Decimal:
    rel_vec = _relevance_vector(consultation_id)
    exp_vec = _expertise_vector(user_id)
    dot = sum(
        rel_vec.get(category_id, ZERO) * exp_vec.get(category_id, ZERO)
        for category_id in rel_vec
    )
    return max(ZERO, Decimal(dot)).quantize(Decimal("0.0001"))


def get_expertise_alignment(user_id: int, consultation_id) -> Decimal:
    """Return the un-capped 0..1 contextual expertise alignment."""
    with ekoh_smartvote_db_scope():
        return _get_expertise_alignment_core(user_id, consultation_id)


def get_weight(user_id: int, consultation_id) -> Decimal:
    """Return the declared Smart Vote advisory reading weight.

    This function never mutates the source ballot.  The result should be stored
    or published only as part of a declared Smart Vote reading.
    """
    with ekoh_smartvote_db_scope():
        alignment = _get_expertise_alignment_core(user_id, consultation_id)
        bonus = min(alignment, expertise_bonus_cap())
        ethics = _ethics_multiplier(user_id)
        weight = (ONE + bonus * ethics).quantize(Decimal("0.0001"))

    LOGGER.debug(
        "Smart Vote advisory weight u=%s c=%s alignment=%s bonus=%s ethics=%s => %s",
        user_id,
        consultation_id,
        alignment,
        bonus,
        ethics,
        weight,
    )
    return weight


def clear_weight_caches() -> None:
    """Clear cached relevance/expertise/config values after profile changes."""
    _fetch_param_cached.cache_clear()
    _relevance_vector_cached.cache_clear()
    _expertise_vector_cached.cache_clear()
