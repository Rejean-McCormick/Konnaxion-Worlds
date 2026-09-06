"""Legacy Smart Vote result projection.

Canonical source ballots remain source facts. Rows with ``weighted_value`` set
are treated only as legacy weighted rows and are projected into ``vote_result``.
New source ballots may leave ``weighted_value`` NULL.

The projection is rebuilt idempotently from stored legacy weighted rows. No
session-local cursor is used.
"""

from __future__ import annotations

import logging

from django.db import connection

from konnaxion.ekoh.db import ekoh_smartvote_db_scope

LOGGER = logging.getLogger(__name__)


def aggregate_votes(batch_size: int = 5_000) -> dict[str, int]:
    """Rebuild the legacy ``vote_result`` projection.

    ``batch_size`` is retained for task-call compatibility. The rebuild is
    intentionally idempotent and does not use an incremental cursor.
    """
    del batch_size

    with ekoh_smartvote_db_scope():
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO vote_result (
                    target_type,
                    target_id,
                    sum_weighted_value,
                    vote_count
                )
                SELECT
                    target_type,
                    target_id,
                    SUM(weighted_value),
                    COUNT(*)::int
                FROM vote
                WHERE weighted_value IS NOT NULL
                GROUP BY target_type, target_id
                ON CONFLICT (target_type, target_id)
                DO UPDATE SET
                    sum_weighted_value = EXCLUDED.sum_weighted_value,
                    vote_count = EXCLUDED.vote_count
                """
            )

            cursor.execute(
                """
                DELETE FROM vote_result AS result
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM vote
                    WHERE vote.weighted_value IS NOT NULL
                      AND vote.target_type = result.target_type
                      AND vote.target_id = result.target_id
                )
                """
            )

            cursor.execute(
                """
                SELECT
                    COUNT(*)::int,
                    COALESCE(SUM(vote_count), 0)::int
                FROM vote_result
                """
            )
            target_count, vote_count = cursor.fetchone()

    result = {
        "targets": int(target_count),
        "legacy_weighted_votes": int(vote_count),
    }
    LOGGER.info("Smart Vote legacy result projection rebuilt: %s", result)
    return result
