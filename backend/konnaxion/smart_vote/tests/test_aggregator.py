from decimal import Decimal
import uuid

import pytest
from django.contrib.auth import get_user_model

from konnaxion.ekoh.db import ekoh_smartvote_db_scope
from konnaxion.smart_vote.models import Vote, VoteModality, VoteResult
from konnaxion.smart_vote.tasks.aggregator import aggregate_votes

pytestmark = pytest.mark.django_db


def test_legacy_aggregator_is_idempotent():
    User = get_user_model()
    user_a = User.objects.create_user(username="sv_agg_a")
    user_b = User.objects.create_user(username="sv_agg_b")
    target_id = uuid.uuid4()

    with ekoh_smartvote_db_scope():
        modality = VoteModality.objects.get(name=VoteModality.APPROVAL)
        Vote.objects.create(
            user=user_a,
            target_type="consultation",
            target_id=target_id,
            modality=modality,
            raw_value=Decimal("1"),
            weighted_value=Decimal("1.2500"),
        )
        Vote.objects.create(
            user=user_b,
            target_type="consultation",
            target_id=target_id,
            modality=modality,
            raw_value=Decimal("1"),
            weighted_value=Decimal("1.7500"),
        )

    first = aggregate_votes()
    second = aggregate_votes()

    assert first == second

    with ekoh_smartvote_db_scope():
        result = VoteResult.objects.get(
            target_type="consultation",
            target_id=target_id,
        )

    assert result.sum_weighted_value == Decimal("3.0000")
    assert result.vote_count == 2
