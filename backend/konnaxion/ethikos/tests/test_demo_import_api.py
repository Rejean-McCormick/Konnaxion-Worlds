# backend/konnaxion/ethikos/tests/test_demo_import_api.py

import pytest
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APIClient


PREVIEW_URL = "/api/ethikos/demo-scenarios/preview/"
IMPORT_URL = "/api/ethikos/demo-scenarios/import/"
RESET_URL = "/api/ethikos/demo-scenarios/reset/"


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def regular_user(django_user_model):
    return django_user_model.objects.create_user(
        username="regular_user",
        email="regular_user@example.test",
        password="test-password",
    )


@pytest.fixture
def admin_user(django_user_model):
    return django_user_model.objects.create_superuser(
        username="admin_user",
        email="admin_user@example.test",
        password="test-password",
    )


@pytest.fixture
def sample_demo_scenario():
    return {
        "schema_version": "ethikos-demo-scenario/v3",
        "scenario_key": "public_square_demo",
        "scenario_title": "Public Square Redevelopment Demo",
        "mode": "replace_scenario",
        "metadata": {
            "description": "Demo scenario for ethiKos importer API tests.",
            "language": "en",
        },
        "actors": [
            {
                "key": "maya",
                "username": "demo_maya",
                "display_name": "Maya",
                "email": "demo_maya@example.test",
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
                "key": "public_square",
                "title": "[DEMO] How should we redesign Place des Rivières?",
                "description": "A public debate about greening, mobility, parking, and accessibility.",
                "status": "open",
                "category": "urbanism",
                "start_date": "2026-05-01",
                "end_date": "2026-05-30",
            }
        ],
        "stances": [
            {
                "topic": "public_square",
                "actor": "maya",
                "value": 2,
            }
        ],
        "arguments": [
            {
                "key": "maya_argument_1",
                "topic": "public_square",
                "actor": "maya",
                "side": "pro",
                "content": "The square should become greener while keeping access for people with reduced mobility.",
            }
        ],
        "consultations": [
            {
                "key": "public_square_vote",
                "title": "[DEMO] Preferred redevelopment scenario",
                "status": "open",
                "open_date": "2026-05-01",
                "close_date": "2026-05-30",
                "options": [
                    {
                        "key": "mixed_square",
                        "label": "Mixed public square with limited parking",
                    }
                ],
            }
        ],
        "consultation_votes": [
            {
                "consultation": "public_square_vote",
                "actor": "maya",
                "option": "mixed_square",
                "raw_value": 1,
            }
        ],
        "impact_items": [
            {
                "consultation": "public_square_vote",
                "action": "Publish preliminary design proposal",
                "status": "planned",
                "date": "2026-06-10",
            }
        ],
        "ekoh_profiles": [],
        "consultation_relevance": [],
        "topic_relevance": [],
    }


@pytest.fixture
def successful_preview_response():
    return {
        "ok": True,
        "dry_run": True,
        "scenario_key": "public_square_demo",
        "summary": {
            "actors": 1,
            "categories": 1,
            "topics": 1,
            "stances": 1,
            "arguments": 1,
            "argument_sources": 0,
            "consultations": 1,
            "consultation_votes": 1,
            "impact_items": 1,
            "ekoh_profiles": 0,
            "consultation_relevance": 0,
        },
        "created": [],
        "updated": [],
        "deleted": [],
        "warnings": [],
    }


@pytest.fixture
def successful_import_response():
    return {
        "ok": True,
        "dry_run": False,
        "scenario_key": "public_square_demo",
        "summary": {
            "actors": 1,
            "categories": 1,
            "topics": 1,
            "stances": 1,
            "arguments": 1,
            "argument_sources": 0,
            "consultations": 1,
            "consultation_votes": 1,
            "impact_items": 1,
            "ekoh_profiles": 0,
            "consultation_relevance": 0,
        },
        "created": [
            {
                "object_type": "topic",
                "object_id": 1,
                "object_label": "[DEMO] How should we redesign Place des Rivières?",
            }
        ],
        "updated": [],
        "deleted": [],
        "warnings": [],
    }


@pytest.mark.django_db
@override_settings(ETHIKOS_DEMO_IMPORTER_ENABLED=True)
def test_preview_requires_admin_user(api_client, regular_user, sample_demo_scenario):
    api_client.force_authenticate(user=regular_user)

    response = api_client.post(
        PREVIEW_URL,
        sample_demo_scenario,
        format="json",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
@override_settings(ETHIKOS_DEMO_IMPORTER_ENABLED=True)
def test_import_requires_admin_user(api_client, regular_user, sample_demo_scenario):
    api_client.force_authenticate(user=regular_user)

    response = api_client.post(
        IMPORT_URL,
        sample_demo_scenario,
        format="json",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
@override_settings(ETHIKOS_DEMO_IMPORTER_ENABLED=True)
def test_reset_requires_admin_user(api_client, regular_user):
    api_client.force_authenticate(user=regular_user)

    response = api_client.post(
        RESET_URL,
        {"scenario_key": "public_square_demo"},
        format="json",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
@override_settings(ETHIKOS_DEMO_IMPORTER_ENABLED=True)
def test_preview_returns_summary_for_valid_payload(
    api_client,
    admin_user,
    sample_demo_scenario,
    successful_preview_response,
    monkeypatch,
):
    from konnaxion.ethikos.demo_import import views

    captured = {}

    def fake_validate_and_preview_ethikos_demo_scenario(data):
        captured["data"] = data
        return successful_preview_response

    monkeypatch.setattr(
        views,
        "validate_and_preview_ethikos_demo_scenario",
        fake_validate_and_preview_ethikos_demo_scenario,
    )

    api_client.force_authenticate(user=admin_user)

    response = api_client.post(
        PREVIEW_URL,
        sample_demo_scenario,
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["ok"] is True
    assert response.data["dry_run"] is True
    assert response.data["scenario_key"] == "public_square_demo"
    assert response.data["summary"]["topics"] == 1
    assert response.data["summary"]["consultation_votes"] == 1
    assert captured["data"] == sample_demo_scenario


@pytest.mark.django_db
@override_settings(ETHIKOS_DEMO_IMPORTER_ENABLED=True)
def test_import_returns_created_summary_for_valid_payload(
    api_client,
    admin_user,
    sample_demo_scenario,
    successful_import_response,
    monkeypatch,
):
    from konnaxion.ethikos.demo_import import views

    captured = {}

    def fake_import_ethikos_demo_scenario(data, *, imported_by=None, dry_run=False):
        captured["data"] = data
        captured["imported_by"] = imported_by
        captured["dry_run"] = dry_run
        return successful_import_response

    monkeypatch.setattr(
        views,
        "import_ethikos_demo_scenario",
        fake_import_ethikos_demo_scenario,
    )

    api_client.force_authenticate(user=admin_user)

    response = api_client.post(
        IMPORT_URL,
        sample_demo_scenario,
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["ok"] is True
    assert response.data["dry_run"] is False
    assert response.data["scenario_key"] == "public_square_demo"
    assert response.data["summary"]["actors"] == 1
    assert response.data["created"][0]["object_type"] == "topic"

    assert captured["data"] == sample_demo_scenario
    assert captured["imported_by"] == admin_user
    assert captured["dry_run"] is False


@pytest.mark.django_db
@override_settings(ETHIKOS_DEMO_IMPORTER_ENABLED=True)
def test_reset_requires_scenario_key(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)

    response = api_client.post(
        RESET_URL,
        {},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["ok"] is False
    assert response.data["error"] == "scenario_key is required"


@pytest.mark.django_db
@override_settings(ETHIKOS_DEMO_IMPORTER_ENABLED=True)
def test_reset_returns_deleted_objects_for_valid_scenario_key(
    api_client,
    admin_user,
    monkeypatch,
):
    from konnaxion.ethikos.demo_import import views

    captured = {}

    def fake_reset_ethikos_demo_scenario(scenario_key, *, reset_by=None):
        captured["scenario_key"] = scenario_key
        captured["reset_by"] = reset_by
        return {
            "ok": True,
            "scenario_key": scenario_key,
            "deleted": [
                {
                    "object_type": "topic",
                    "object_id": 1,
                    "object_label": "[DEMO] How should we redesign Place des Rivières?",
                }
            ],
        }

    monkeypatch.setattr(
        views,
        "reset_ethikos_demo_scenario",
        fake_reset_ethikos_demo_scenario,
    )

    api_client.force_authenticate(user=admin_user)

    response = api_client.post(
        RESET_URL,
        {"scenario_key": "public_square_demo"},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["ok"] is True
    assert response.data["scenario_key"] == "public_square_demo"
    assert response.data["deleted"][0]["object_type"] == "topic"

    assert captured["scenario_key"] == "public_square_demo"
    assert captured["reset_by"] == admin_user


@pytest.mark.django_db
@override_settings(ETHIKOS_DEMO_IMPORTER_ENABLED=False)
def test_preview_is_blocked_when_feature_flag_is_disabled(
    api_client,
    admin_user,
    sample_demo_scenario,
):
    api_client.force_authenticate(user=admin_user)

    response = api_client.post(
        PREVIEW_URL,
        sample_demo_scenario,
        format="json",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
@override_settings(ETHIKOS_DEMO_IMPORTER_ENABLED=True)
def test_preview_accepts_v2_argument_sources(api_client, admin_user, sample_demo_scenario):
    scenario = dict(sample_demo_scenario)
    scenario["schema_version"] = "ethikos-demo-scenario/v2"
    scenario["consultation_votes"] = [
        {**vote, "weighted_value": 1.0}
        for vote in sample_demo_scenario["consultation_votes"]
    ]
    scenario["argument_sources"] = [
        {
            "key": "maya_argument_1_source",
            "argument": "maya_argument_1",
            "url": "https://example.test/public-square",
            "title": "Public square planning brief",
            "source_type": "reference",
        }
    ]

    api_client.force_authenticate(user=admin_user)
    response = api_client.post(PREVIEW_URL, scenario, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["ok"] is True
    assert response.data["summary"]["argument_sources"] == 1


@pytest.mark.django_db
@override_settings(ETHIKOS_DEMO_IMPORTER_ENABLED=True)
def test_preview_rejects_sources_on_v1(api_client, admin_user, sample_demo_scenario):
    scenario = dict(sample_demo_scenario)
    scenario["schema_version"] = "ethikos-demo-scenario/v1"
    scenario["consultation_votes"] = [
        {**vote, "weighted_value": 1.0}
        for vote in sample_demo_scenario["consultation_votes"]
    ]
    scenario["argument_sources"] = [
        {
            "key": "maya_argument_1_source",
            "argument": "maya_argument_1",
            "url": "https://example.test/public-square",
        }
    ]

    api_client.force_authenticate(user=admin_user)
    response = api_client.post(PREVIEW_URL, scenario, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
