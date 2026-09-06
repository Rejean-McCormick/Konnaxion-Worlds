"""World-aware Celery entry point for contextual EkoH analysis."""

import logging

from celery import shared_task

from konnaxion.worlds.models import World
from konnaxion.worlds.services.tasks import world_task_scope

LOGGER = logging.getLogger(__name__)


@shared_task(name="contextual_analysis_world")
def contextual_analysis_world(*, world_id: int, release_id: int) -> dict[str, int]:
    """Governed World task placeholder; does not fabricate evidence."""
    with world_task_scope(world_id=world_id, release_id=release_id):
        LOGGER.info(
            "Contextual analysis skipped world=%s release=%s: no governed collector configured.",
            world_id,
            release_id,
        )
    return {"processed": 0}


@shared_task(name="contextual_analysis_batch")
def contextual_analysis_batch() -> dict[str, int]:
    rows = list(
        World.objects.filter(current_release__isnull=False)
        .values_list("id", "current_release_id")
        .order_by("id")
    )
    for world_id, release_id in rows:
        contextual_analysis_world.delay(world_id=world_id, release_id=release_id)
    return {"scheduled": len(rows)}
