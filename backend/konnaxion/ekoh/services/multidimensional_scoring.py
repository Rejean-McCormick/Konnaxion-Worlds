"""EkoH multidimensional scoring.

This service converts evidence metrics for one user/domain into a normalized
0..1 expertise score.  It does not compute voting power; Smart Vote consumes
these scores later in a declared contextual reading.

Inputs are expected on either a 0..1 or 0..100 scale.  Each axis is normalized
independently and then combined using runtime RAW_WEIGHT_* configuration.
"""

from __future__ import annotations

import logging
from decimal import Decimal
from functools import lru_cache
from typing import Mapping

from konnaxion.ekoh.db import ekoh_smartvote_db_scope
from konnaxion.ekoh.models.config import ScoreConfiguration
from konnaxion.ekoh.models.scores import UserExpertiseScore
from konnaxion.ekoh.models.taxonomy import ExpertiseCategory
from konnaxion.worlds.runtime import get_world_runtime

LOGGER = logging.getLogger(__name__)

AXES = ("quality", "expertise", "frequency")
ZERO = Decimal("0")
ONE = Decimal("1")
HUNDRED = Decimal("100")


def _cache_scope() -> tuple[int, int]:
    runtime = get_world_runtime()
    return (runtime.world_id, runtime.release_id) if runtime else (0, 0)


@lru_cache(maxsize=128)
def _weights_cache(scope: tuple[int, int]) -> Mapping[str, Decimal]:
    del scope
    rows = (
        ScoreConfiguration.objects.filter(weight_name__startswith="RAW_WEIGHT_")
        .values_list("weight_name", "weight_value")
    )
    return {name: Decimal(value) for name, value in rows}


def get_raw_weights(force_refresh: bool = False) -> Mapping[str, Decimal]:
    if force_refresh:
        _weights_cache.cache_clear()
    return _weights_cache(_cache_scope())


def _normalise_metric(value: Decimal | int | float | str) -> Decimal:
    """Normalize a metric to 0..1 while tolerating legacy 0..100 inputs."""
    numeric = Decimal(str(value))
    numeric = max(ZERO, numeric)
    if numeric > ONE:
        numeric = numeric / HUNDRED
    return min(ONE, numeric)


def _normalised_axis_weights() -> Mapping[str, Decimal]:
    configured = get_raw_weights()
    values = {
        axis: max(ZERO, Decimal(configured.get(f"RAW_WEIGHT_{axis.upper()}", ZERO)))
        for axis in AXES
    }
    total = sum(values.values(), ZERO)
    if total <= ZERO:
        equal = ONE / Decimal(len(AXES))
        return {axis: equal for axis in AXES}
    return {axis: value / total for axis, value in values.items()}


def compute_user_domain_score(
    user_id: int,
    domain: ExpertiseCategory,
    metrics: Mapping[str, Decimal],
    *,
    flush: bool = True,
) -> Decimal:
    """Compute a normalized EkoH score inside the dedicated DB schema scope."""
    with ekoh_smartvote_db_scope():
        return _compute_user_domain_score_core(
            user_id, domain, metrics, flush=flush
        )


def _compute_user_domain_score_core(
    user_id: int,
    domain: ExpertiseCategory,
    metrics: Mapping[str, Decimal],
    *,
    flush: bool = True,
) -> Decimal:
    """Compute normalized EkoH expertise for one user and one domain.

    Required metrics:
      quality    evidence quality / peer validation
      expertise  demonstrated knowledge / credentials / work
      frequency  recency or sustained relevant participation

    Returns a Decimal in 0..1.  Lack of expertise never creates negative merit.
    """
    missing = [axis for axis in AXES if axis not in metrics]
    if missing:
        raise ValueError(f"Missing metric(s): {', '.join(missing)}")

    normalized = {axis: _normalise_metric(metrics[axis]) for axis in AXES}
    axis_weights = _normalised_axis_weights()

    score = sum(
        axis_weights[axis] * normalized[axis]
        for axis in AXES
    ).quantize(Decimal("0.0001"))

    if flush:
        # raw_score remains an explainable aggregate of normalized evidence
        # axes; weighted_score is the canonical normalized domain score.
        raw_score = sum(normalized.values(), ZERO).quantize(Decimal("0.0001"))
        UserExpertiseScore.objects.update_or_create(
            user_id=user_id,
            category=domain,
            defaults={
                "raw_score": raw_score,
                "weighted_score": score,
            },
        )

    LOGGER.debug(
        "EkoH domain score user=%s domain=%s metrics=%s normalized=%s score=%s",
        user_id,
        getattr(domain, "code", domain),
        dict(metrics),
        normalized,
        score,
    )
    return score
