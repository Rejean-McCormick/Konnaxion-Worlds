from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model

from konnaxion.ekoh.db import ekoh_smartvote_db_scope
from konnaxion.ekoh.models.access import RatingVisibilitySetting
from konnaxion.ekoh.models.scores import UserEthicsScore, UserExpertiseScore
from konnaxion.ekoh.models.taxonomy import ExpertiseCategory
from konnaxion.ethikos.models import EthikosCategory, EthikosStance, EthikosTopic
from konnaxion.smart_vote.models import (
    Consultation,
    ConsultationRelevance,
    SourceConsultationBinding,
)
from konnaxion.smart_vote.services.reading_service import build_ethikos_topic_reading

pytestmark = pytest.mark.django_db
User = get_user_model()


def test_ethikos_topic_reading_keeps_baseline_and_adds_expertise_lens():
    expert = User.objects.create_user(username="expert")
    citizen = User.objects.create_user(username="citizen")
    category = EthikosCategory.objects.create(name="Economy", description="")
    topic = EthikosTopic.objects.create(
        title="[DEMO] Fiscal question",
        description="Demo",
        category=category,
        created_by=expert,
        status="open",
    )
    EthikosStance.objects.create(topic=topic, user=expert, value=3)
    EthikosStance.objects.create(topic=topic, user=citizen, value=-3)

    with ekoh_smartvote_db_scope():
        domain = ExpertiseCategory.objects.create(
            code="0311",
            name="Economics",
            depth=0,
            path="0311",
        )
        UserExpertiseScore.objects.create(
            user=expert,
            category=domain,
            raw_score=Decimal("1.0"),
            weighted_score=Decimal("1.0"),
        )
        UserEthicsScore.objects.create(user=expert, ethical_score=Decimal("1.0"))
        UserEthicsScore.objects.create(user=citizen, ethical_score=Decimal("1.0"))

        consultation = Consultation.objects.create(title=topic.title)
        SourceConsultationBinding.objects.create(
            source_type="ethikos_topic",
            source_id=str(topic.pk),
            source_key="fiscal_question",
            consultation=consultation,
        )
        ConsultationRelevance.objects.create(
            consultation=consultation,
            category=domain,
            weight=Decimal("1.0"),
        )

    payload = build_ethikos_topic_reading(topic.pk)
    assert payload is not None
    assert payload["baseline"]["results_payload"]["score"] == pytest.approx(0.0)

    reading = payload["readings"][0]
    assert reading["reading_key"] == "ekoh_weighted_v1"
    assert reading["results_payload"]["score"] > 0
    assert reading["lens_hash"].startswith("sha256:")
    assert reading["snapshot_ref"].startswith("ekoh_snapshot:")


def test_declared_recusal_keeps_baseline_but_excludes_advisory_weight():
    expert = User.objects.create_user(username="recused_expert")
    citizen = User.objects.create_user(username="included_citizen")
    category = EthikosCategory.objects.create(name="Policy", description="")
    topic = EthikosTopic.objects.create(
        title="[DEMO] Recusal question",
        description="Demo",
        category=category,
        created_by=expert,
        status="open",
    )
    EthikosStance.objects.create(topic=topic, user=expert, value=3)
    EthikosStance.objects.create(topic=topic, user=citizen, value=-1)

    with ekoh_smartvote_db_scope():
        domain = ExpertiseCategory.objects.create(
            code="0312",
            name="Political sciences and civics",
            depth=0,
            path="0312",
        )
        UserExpertiseScore.objects.create(
            user=expert,
            category=domain,
            raw_score=Decimal("1.0"),
            weighted_score=Decimal("1.0"),
        )
        UserExpertiseScore.objects.create(
            user=citizen,
            category=domain,
            raw_score=Decimal("0.5"),
            weighted_score=Decimal("0.5"),
        )
        UserEthicsScore.objects.create(user=expert, ethical_score=Decimal("1.0"))
        UserEthicsScore.objects.create(user=citizen, ethical_score=Decimal("1.0"))

        consultation = Consultation.objects.create(title=topic.title)
        SourceConsultationBinding.objects.create(
            source_type="ethikos_topic",
            source_id=str(topic.pk),
            source_key="recusal_question",
            consultation=consultation,
            metadata_json={
                "advisory_exclusions": [
                    {
                        "actor_key": "recused_expert",
                        "user_id": expert.pk,
                        "reason": "Declared conflict and voluntary recusal.",
                        "scope": "advisory_only",
                    }
                ]
            },
        )
        ConsultationRelevance.objects.create(
            consultation=consultation,
            category=domain,
            weight=Decimal("1.0"),
        )

    payload = build_ethikos_topic_reading(topic.pk)
    assert payload is not None

    # Baseline keeps both source stances: (3 + -1) / 2 = 1.
    assert payload["baseline"]["results_payload"]["score"] == pytest.approx(1.0)
    assert payload["baseline"]["results_payload"]["participant_count"] == 2

    reading = payload["readings"][0]["results_payload"]
    assert reading["advisory_participant_count"] == 1
    assert reading["excluded_participant_count"] == 1
    assert reading["score"] == pytest.approx(-1.0)

    participants = {row["user_id"]: row for row in reading["participants"]}
    assert participants[expert.pk]["included_in_advisory"] is False
    assert participants[expert.pk]["advisory_weight"] == pytest.approx(0.0)
    assert participants[expert.pk]["display_name"] == "recused_expert"
    assert participants[citizen.pk]["included_in_advisory"] is True


def test_participant_breakdown_respects_ekoh_rating_disclosure():
    hidden = User.objects.create_user(username="hidden_expert")
    visible = User.objects.create_user(username="visible_citizen")
    viewer = User.objects.create_user(username="viewer")
    category = EthikosCategory.objects.create(name="Disclosure", description="")
    topic = EthikosTopic.objects.create(
        title="[DEMO] Disclosure question",
        description="Demo",
        category=category,
        created_by=hidden,
        status="open",
    )
    EthikosStance.objects.create(topic=topic, user=hidden, value=3)
    EthikosStance.objects.create(topic=topic, user=visible, value=-1)

    with ekoh_smartvote_db_scope():
        domain = ExpertiseCategory.objects.create(
            code="0613", name="Software", depth=0, path="0613"
        )
        for user, score in ((hidden, "1.0"), (visible, "0.5")):
            UserExpertiseScore.objects.create(
                user=user, category=domain, raw_score=Decimal(score), weighted_score=Decimal(score)
            )
            UserEthicsScore.objects.create(user=user, ethical_score=Decimal("1.0"))
        RatingVisibilitySetting.objects.create(user=hidden, visibility="scoped")
        RatingVisibilitySetting.objects.create(user=visible, visibility="public")

        consultation = Consultation.objects.create(title=topic.title)
        SourceConsultationBinding.objects.create(
            source_type="ethikos_topic", source_id=str(topic.pk), source_key="disclosure", consultation=consultation
        )
        ConsultationRelevance.objects.create(consultation=consultation, category=domain, weight=Decimal("1.0"))

    payload = build_ethikos_topic_reading(topic.pk, viewer=viewer)
    assert payload is not None
    result = payload["readings"][0]["results_payload"]
    assert result["participant_count"] == 2
    assert result["participant_detail_visible_count"] == 1
    assert [row["user_id"] for row in result["participants"]] == [visible.pk]
