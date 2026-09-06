import pytest
from django.apps import apps
from django.contrib.auth import get_user_model

from konnaxion.ekoh.db import ekoh_smartvote_db_scope

from konnaxion.ethikos.demo_import.importer import (
    import_ethikos_demo_scenario,
    reset_ethikos_demo_scenario,
)
from konnaxion.ethikos.demo_import.schema import (
    DEMO_TOPIC_TITLE_PREFIX,
    SCHEMA_VERSION,
    TRACK_OBJECT_TYPES,
)
from konnaxion.ethikos.models import (
    ArgumentSource,
    EthikosArgument,
    EthikosCategory,
    EthikosStance,
    EthikosTopic,
)
from konnaxion.ethikos.models_demo import DemoScenarioImport

pytestmark = pytest.mark.django_db
User = get_user_model()


def build_demo_payload(
    *,
    scenario_key: str = "public_square_demo",
    actor_username: str = "demo_maya",
    topic_key: str = "public_square",
    topic_title: str | None = None,
) -> dict:
    title = topic_title or f"{DEMO_TOPIC_TITLE_PREFIX} Public Square Redevelopment"
    return {
        "schema_version": SCHEMA_VERSION,
        "scenario_key": scenario_key,
        "scenario_title": "Public Square Redevelopment Demo",
        "mode": "replace_scenario",
        "metadata": {"description": "Demo data for ethiKos importer tests.", "language": "en"},
        "actors": [
            {
                "key": "maya",
                "username": actor_username,
                "display_name": "Maya",
                "email": f"{actor_username}@example.test",
                "role": "citizen",
                "is_ethikos_elite": False,
            }
        ],
        "categories": [
            {
                "key": "urbanism",
                "name": "Urbanism",
                "description": "Urban planning and public-space issues.",
            }
        ],
        "topics": [
            {
                "key": topic_key,
                "title": title,
                "description": "A public debate about greening, mobility, parking, and accessibility.",
                "status": "open",
                "category": "urbanism",
                "start_date": "2026-05-01",
                "end_date": "2026-05-30",
            }
        ],
        "stances": [{"topic": topic_key, "actor": "maya", "value": 2}],
        "arguments": [
            {
                "key": "maya_argument_1",
                "topic": topic_key,
                "actor": "maya",
                "side": "pro",
                "content": "The square should become greener while preserving accessibility.",
            }
        ],
        "argument_sources": [
            {
                "key": "maya_argument_1_source",
                "argument": "maya_argument_1",
                "url": "https://example.test/public-square",
                "title": "Public square planning brief",
                "source_type": "reference",
            }
        ],
        "consultations": [],
        "consultation_votes": [],
        "impact_items": [],
        "ekoh_profiles": [],
        "consultation_relevance": [],
        "topic_relevance": [],
        "reading_exclusions": [],
    }


def create_importing_user(username: str = "import_admin"):
    return User.objects.create_user(
        username=username,
        email=f"{username}@example.test",
        password="test-password",
    )


def _argument_user(argument):
    return getattr(argument, "user", None) or getattr(argument, "author", None)


def test_import_creates_source_facts():
    imported_by = create_importing_user()
    payload = build_demo_payload()

    result = import_ethikos_demo_scenario(payload, imported_by=imported_by, dry_run=False)

    assert result["ok"] is True
    actor = User.objects.get(username="demo_maya")
    category = EthikosCategory.objects.get(name="Urbanism")
    topic = EthikosTopic.objects.get(title="[DEMO] Public Square Redevelopment")
    stance = EthikosStance.objects.get(topic=topic, user=actor)
    argument = EthikosArgument.objects.get(topic=topic)

    assert actor.email == "demo_maya@example.test"
    assert category.description == "Urban planning and public-space issues."
    assert topic.status == "open"
    assert stance.value == 2
    assert _argument_user(argument) == actor
    assert argument.content == "The square should become greener while preserving accessibility."

    source = ArgumentSource.objects.get(argument=argument)
    assert source.url == "https://example.test/public-square"

    assert result["summary"]["ekoh_profiles"] == 0
    assert result["summary"]["consultation_relevance"] == 0
    assert result["summary"]["topic_relevance"] == 0
    assert result["summary"]["reading_exclusions"] == 0


def test_import_tracks_core_objects():
    imported_by = create_importing_user()
    result = import_ethikos_demo_scenario(
        build_demo_payload(),
        imported_by=imported_by,
        dry_run=False,
    )
    assert result["ok"] is True

    tracked_types = set(
        DemoScenarioImport.objects.filter(
            scenario_key="public_square_demo"
        ).values_list("object_type", flat=True)
    )
    for key in ("user", "category", "topic", "stance", "argument"):
        assert TRACK_OBJECT_TYPES[key] in tracked_types


def test_v3_imports_ekoh_profile_when_models_and_domain_exist():
    ExpertiseCategory = apps.get_model("ekoh", "ExpertiseCategory")
    UserExpertiseScore = apps.get_model("ekoh", "UserExpertiseScore")
    UserEthicsScore = apps.get_model("ekoh", "UserEthicsScore")

    with ekoh_smartvote_db_scope():
        category, _ = ExpertiseCategory.objects.get_or_create(
            code="0731",
            defaults={
                "name": "Architecture and town planning",
                "depth": 0,
                "path": "0731",
            },
        )

    payload = build_demo_payload()
    payload["ekoh_profiles"] = [
        {
            "actor": "maya",
            "ethics_score": 1.0,
            "expertise": [
                {
                    "domain_code": "0731",
                    "raw_score": 0.88,
                    "weighted_score": 0.91,
                }
            ],
        }
    ]

    result = import_ethikos_demo_scenario(
        payload,
        imported_by=create_importing_user(),
        dry_run=False,
    )
    assert result["ok"] is True

    actor = User.objects.get(username="demo_maya")
    assert actor.name == "Maya"
    with ekoh_smartvote_db_scope():
        score = UserExpertiseScore.objects.get(user=actor, category=category)
        assert float(score.weighted_score) == pytest.approx(0.91)
        assert float(
            UserEthicsScore.objects.get(user=actor).ethical_score
        ) == pytest.approx(1.0)

    tracked_types = set(
        DemoScenarioImport.objects.filter(
            scenario_key="public_square_demo"
        ).values_list("object_type", flat=True)
    )
    assert TRACK_OBJECT_TYPES["ekoh_expertise_score"] in tracked_types
    assert TRACK_OBJECT_TYPES["ekoh_ethics_score"] in tracked_types



def test_v3_binds_topic_relevance_to_smart_vote():
    ExpertiseCategory = apps.get_model("ekoh", "ExpertiseCategory")
    ConsultationRelevance = apps.get_model("smart_vote", "ConsultationRelevance")
    SourceConsultationBinding = apps.get_model(
        "smart_vote", "SourceConsultationBinding"
    )

    with ekoh_smartvote_db_scope():
        category, _ = ExpertiseCategory.objects.get_or_create(
            code="0731",
            defaults={
                "name": "Architecture and town planning",
                "depth": 0,
                "path": "0731",
            },
        )

    payload = build_demo_payload()
    payload["topic_relevance"] = [
        {
            "topic": "public_square",
            "domain_code": "0731",
            "weight": 1.0,
        }
    ]

    result = import_ethikos_demo_scenario(
        payload,
        imported_by=create_importing_user(),
        dry_run=False,
    )
    assert result["ok"] is True

    topic = EthikosTopic.objects.get(title="[DEMO] Public Square Redevelopment")
    with ekoh_smartvote_db_scope():
        binding = SourceConsultationBinding.objects.get(
            source_type="ethikos_topic",
            source_id=str(topic.pk),
        )
        relevance = ConsultationRelevance.objects.get(
            consultation=binding.consultation,
            category=category,
        )
    assert float(relevance.weight) == pytest.approx(1.0)

    tracked_types = set(
        DemoScenarioImport.objects.filter(
            scenario_key="public_square_demo"
        ).values_list("object_type", flat=True)
    )
    assert TRACK_OBJECT_TYPES["smart_vote_source_binding"] in tracked_types



def test_v3_persists_advisory_recusal_on_source_binding():
    ExpertiseCategory = apps.get_model("ekoh", "ExpertiseCategory")
    SourceConsultationBinding = apps.get_model(
        "smart_vote", "SourceConsultationBinding"
    )

    with ekoh_smartvote_db_scope():
        ExpertiseCategory.objects.get_or_create(
            code="0731",
            defaults={
                "name": "Architecture and town planning",
                "depth": 0,
                "path": "0731",
            },
        )

    payload = build_demo_payload()
    payload["topic_relevance"] = [
        {
            "topic": "public_square",
            "domain_code": "0731",
            "weight": 1.0,
        }
    ]
    payload["reading_exclusions"] = [
        {
            "topic": "public_square",
            "actor": "maya",
            "reason": "Voluntary recusal from the advisory reading.",
        }
    ]

    result = import_ethikos_demo_scenario(
        payload,
        imported_by=create_importing_user(),
        dry_run=False,
    )
    assert result["ok"] is True

    topic = EthikosTopic.objects.get(title="[DEMO] Public Square Redevelopment")
    actor = User.objects.get(username="demo_maya")
    with ekoh_smartvote_db_scope():
        binding = SourceConsultationBinding.objects.get(
            source_type="ethikos_topic",
            source_id=str(topic.pk),
        )
        exclusions = binding.metadata_json["advisory_exclusions"]
    assert exclusions == [
        {
            "actor_key": "maya",
            "user_id": actor.pk,
            "reason": "Voluntary recusal from the advisory reading.",
            "scope": "advisory_only",
        }
    ]

def test_dry_run_does_not_create_objects():
    imported_by = create_importing_user()
    result = import_ethikos_demo_scenario(
        build_demo_payload(),
        imported_by=imported_by,
        dry_run=True,
    )

    assert result["ok"] is True
    assert result["dry_run"] is True
    assert not User.objects.filter(username="demo_maya").exists()
    assert not EthikosTopic.objects.filter(
        title="[DEMO] Public Square Redevelopment"
    ).exists()


def test_reset_removes_tracked_topic_but_not_untracked_topic():
    imported_by = create_importing_user()
    category = EthikosCategory.objects.create(
        name="Tracked Category",
        description="tracked",
    )
    tracked_topic = EthikosTopic.objects.create(
        title="[DEMO] Tracked Topic",
        description="tracked",
        status="open",
        category=category,
        created_by=imported_by,
    )
    untracked_category = EthikosCategory.objects.create(
        name="Untracked Category",
        description="untracked",
    )
    untracked_topic = EthikosTopic.objects.create(
        title="[DEMO] Untracked Topic",
        description="untracked",
        status="open",
        category=untracked_category,
        created_by=imported_by,
    )

    DemoScenarioImport.objects.create(
        scenario_key="public_square_demo",
        object_type=TRACK_OBJECT_TYPES["topic"],
        object_id=tracked_topic.id,
        object_label=tracked_topic.title,
        imported_by=imported_by,
    )

    result = reset_ethikos_demo_scenario(
        "public_square_demo",
        reset_by=imported_by,
    )

    assert result["ok"] is True
    assert not EthikosTopic.objects.filter(id=tracked_topic.id).exists()
    assert EthikosTopic.objects.filter(id=untracked_topic.id).exists()


def test_replace_scenario_replaces_tracked_topic_and_keeps_demo_users_safe():
    imported_by = create_importing_user()

    first = build_demo_payload(topic_title="[DEMO] Old Public Square Topic")
    second = build_demo_payload(
        actor_username="demo_nadia",
        topic_key="public_square_v2",
        topic_title="[DEMO] New Public Square Topic",
    )

    assert import_ethikos_demo_scenario(first, imported_by=imported_by)["ok"] is True
    assert import_ethikos_demo_scenario(second, imported_by=imported_by)["ok"] is True

    assert not EthikosTopic.objects.filter(title="[DEMO] Old Public Square Topic").exists()
    assert EthikosTopic.objects.filter(title="[DEMO] New Public Square Topic").exists()
    # Importer intentionally does not delete demo users because cross-app cascades
    # can remove unrelated data.
    assert User.objects.filter(username="demo_maya").exists()
    assert User.objects.filter(username="demo_nadia").exists()

def test_v3_imports_explicit_ekoh_rating_visibility():
    ExpertiseCategory = apps.get_model("ekoh", "ExpertiseCategory")
    RatingVisibilitySetting = apps.get_model("ekoh", "RatingVisibilitySetting")

    with ekoh_smartvote_db_scope():
        ExpertiseCategory.objects.get_or_create(
            code="0731",
            defaults={
                "name": "Architecture and town planning",
                "depth": 0,
                "path": "0731",
            },
        )

    payload = build_demo_payload()
    payload["ekoh_profiles"] = [
        {
            "actor": "maya",
            "ethics_score": 1.0,
            "rating_visibility": "public",
            "publication_basis": "Public/demo role",
            "expertise": [
                {
                    "domain_code": "0731",
                    "raw_score": 0.88,
                    "weighted_score": 0.91,
                }
            ],
        }
    ]

    result = import_ethikos_demo_scenario(
        payload,
        imported_by=create_importing_user(),
        dry_run=False,
    )
    assert result["ok"] is True

    actor = User.objects.get(username="demo_maya")
    with ekoh_smartvote_db_scope():
        setting = RatingVisibilitySetting.objects.get(user=actor)
        assert setting.visibility == "public"
        assert setting.publication_basis == "Public/demo role"
