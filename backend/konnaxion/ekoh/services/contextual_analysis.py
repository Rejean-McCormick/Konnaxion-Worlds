"""Contextual EkoH analysis intake.

AI-assisted analysis may classify evidence and propose domain context, but it
must not silently alter a person's canonical EkoH expertise score.  Verified
credentials, reviewed contributions, or an explicit human/governance action
must perform the actual score update.

This service therefore records an explainable analysis event only.
"""

from __future__ import annotations

import logging
import uuid
from typing import Any, Mapping

from django.db import transaction

from konnaxion.ekoh.db import set_local_ekoh_smartvote_search_path
from konnaxion.ekoh.models.audit import ContextAnalysisLog

LOGGER = logging.getLogger(__name__)


def analyse_entity(
    *,
    user_id: int,
    entity_type: str,
    entity_id: uuid.UUID,
    domain_code: str,
    input_metadata: Mapping[str, Any] | None = None,
) -> None:
    """Record a non-authoritative contextual analysis event.

    No UserExpertiseScore mutation occurs here. Callers that later verify the
    evidence can pass it through the canonical EkoH scoring/update path.
    """
    metadata = dict(input_metadata or {})
    metadata.update(
        {
            "user_id": user_id,
            "domain_code": domain_code,
            "analysis_status": "proposed_not_applied",
        }
    )

    with transaction.atomic():
        set_local_ekoh_smartvote_search_path()
        ContextAnalysisLog.objects.create(
            entity_type=entity_type,
            entity_id=entity_id,
            field="contextual_analysis",
            input_metadata=metadata,
            adjustments_applied={
                "score_changed": False,
                "reason": "AI/context analysis is non-authoritative by default.",
            },
        )

    LOGGER.debug(
        "Context analysis recorded without score mutation: user=%s %s=%s domain=%s",
        user_id,
        entity_type,
        entity_id,
        domain_code,
    )
