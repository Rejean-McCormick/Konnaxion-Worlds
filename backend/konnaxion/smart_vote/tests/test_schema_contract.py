from types import SimpleNamespace
import uuid

import pytest
from django.contrib.auth import get_user_model
from django.db import connection

from konnaxion.ekoh.db import ekoh_smartvote_db_scope
from konnaxion.smart_vote.models import Vote, VoteModality
from konnaxion.smart_vote.serializers.ballot import BallotSerializer

pytestmark = pytest.mark.django_db


def test_physical_vote_schema_matches_current_model_contract():
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT column_name, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'ekoh_smartvote'
              AND table_name = 'vote'
            """
        )
        columns = dict(cursor.fetchall())

        cursor.execute(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'ekoh_smartvote'
              AND table_name = 'vote_modality'
            """
        )
        modality_columns = {row[0] for row in cursor.fetchall()}

    assert "modality_id" in columns
    assert "modality_name" not in columns
    assert columns["weighted_value"] == "YES"
    assert {"id", "name", "parameters"} <= modality_columns


def test_source_ballot_does_not_persist_derived_weight():
    User = get_user_model()
    user = User.objects.create_user(username="sv_source_ballot")
    target_id = uuid.uuid4()

    serializer = BallotSerializer(
        data={
            "consultation": str(target_id),
            "target_id": str(target_id),
            "modality": VoteModality.APPROVAL,
            "raw_value": "1",
        },
        context={"request": SimpleNamespace(user=user)},
    )

    assert serializer.is_valid(), serializer.errors
    vote = serializer.save()

    assert vote.weighted_value is None

    with ekoh_smartvote_db_scope():
        stored = Vote.objects.get(pk=vote.pk)
    assert stored.weighted_value is None
