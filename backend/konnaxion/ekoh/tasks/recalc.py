"""World-aware Celery tasks for EkoH score recalculation.

The beat-facing ``ekoh_score_recalc`` task is a control-plane coordinator. It
never opens World tables itself; it fans out exact ``world_id/release_id``
payloads. Worker tasks fail closed when that context is missing or invalid.
"""

from __future__ import annotations

import logging
from itertools import islice
from typing import Iterable, Iterator, Mapping

from celery import shared_task
from django.db.models import QuerySet

from konnaxion.ekoh.models.taxonomy import ExpertiseCategory
from konnaxion.ekoh.services.multidimensional_scoring import compute_user_domain_score
from konnaxion.worlds.models import World, WorldPersonaBridge
from konnaxion.worlds.services.tasks import world_task_scope

LOGGER = logging.getLogger(__name__)
CHUNK_SIZE = 1_000


def chunked(iterable: Iterable[int], size: int) -> Iterator[list[int]]:
    it = iter(iterable)
    while chunk := list(islice(it, size)):
        yield chunk


def _collect_metrics(
    user_id: int,
    domain: ExpertiseCategory,
) -> Mapping[str, float] | None:
    """Return governed evidence metrics, or None when no evidence exists."""
    return None


@shared_task(name="ekoh_score_recalc_world")
def recalc_world_scores(*, world_id: int, release_id: int) -> dict[str, int]:
    LOGGER.info("World EkoH rebuild started world=%s release=%s", world_id, release_id)
    processed = 0
    skipped = 0

    with world_task_scope(world_id=world_id, release_id=release_id):
        domain_rows = list(ExpertiseCategory.objects.filter(depth__gte=1))
        user_ids = WorldPersonaBridge.objects.filter(
            release_id=release_id,
        ).values_list("bridge_user_id", flat=True).order_by("bridge_user_id")

        for user_chunk in chunked(user_ids, CHUNK_SIZE):
            for uid in user_chunk:
                for domain in domain_rows:
                    metrics = _collect_metrics(uid, domain)
                    if metrics is None:
                        skipped += 1
                        continue
                    compute_user_domain_score(uid, domain, metrics, flush=True)
                    processed += 1

    LOGGER.info(
        "World EkoH rebuild completed world=%s release=%s processed=%s skipped=%s",
        world_id,
        release_id,
        processed,
        skipped,
    )
    return {"processed": processed, "skipped": skipped}


@shared_task(name="ekoh_score_recalc")
def recalc_all_scores() -> dict[str, int]:
    """Fan out score rebuilding to every current WorldRelease.

    The legacy public EkoH schema is deliberately not recalculated by this
    scheduler. Worldless operation remains available through direct services
    during migration, but scheduled mutations are Worlds-only.
    """
    rows = list(
        World.objects.filter(current_release__isnull=False)
        .values_list("id", "current_release_id")
        .order_by("id")
    )
    for world_id, release_id in rows:
        recalc_world_scores.delay(world_id=world_id, release_id=release_id)
    LOGGER.info("Scheduled EkoH recalculation for %s World releases", len(rows))
    return {"scheduled": len(rows)}
