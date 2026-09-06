"""World-aware Celery entrypoints for Smart Vote."""

from __future__ import annotations

from celery import shared_task

from konnaxion.worlds.models import World
from konnaxion.worlds.services.tasks import world_task_scope

from .aggregator import aggregate_votes


@shared_task(name="vote_result_aggregator_world")
def vote_result_aggregator_world(*, world_id: int, release_id: int, batch_size: int = 5_000) -> dict[str, int]:
    with world_task_scope(world_id=world_id, release_id=release_id):
        return aggregate_votes(batch_size=batch_size)


def _fanout(batch_size: int) -> dict[str, int]:
    rows = list(
        World.objects.filter(current_release__isnull=False)
        .values_list("id", "current_release_id")
        .order_by("id")
    )
    for world_id, release_id in rows:
        vote_result_aggregator_world.delay(
            world_id=world_id,
            release_id=release_id,
            batch_size=batch_size,
        )
    return {"scheduled": len(rows)}


@shared_task(name="vote_result_aggregator")
def vote_result_aggregator(batch_size: int = 5_000) -> dict[str, int]:
    return _fanout(batch_size)


@shared_task(name="vote_aggregate")
def vote_aggregate(batch_size: int = 5_000) -> dict[str, int]:
    """Backward-compatible Celery Beat alias, now World-aware."""
    return _fanout(batch_size)


__all__ = [
    "vote_result_aggregator",
    "vote_result_aggregator_world",
    "vote_aggregate",
]
