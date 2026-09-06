# backend/konnaxion/ethikos/tests/test_demo_import_schema.py

import pytest

from konnaxion.ethikos.demo_import.schema import (
    SCHEMA_VERSION,
    SCHEMA_VERSION_V1,
    SCHEMA_VERSION_V2,
    SCHEMA_VERSION_V3,
    STANCE_MAX,
    STANCE_MIN,
    validate_demo_scenario,
)


def make_valid_demo_scenario(overrides=None):
    scenario = {
        "schema_version": SCHEMA_VERSION,
        "scenario_key": "public_square_demo",
        "scenario_title": "Public Square Redevelopment Demo",
        "mode": "replace_scenario",
        "metadata": {
            "description": "Demo scenario for ethiKos importer tests.",
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
            },
            {
                "key": "samuel",
                "username": "demo_samuel",
                "display_name": "Samuel",
                "email": "demo_samuel@example.test",
                "role": "urban_planning_expert",
                "is_ethikos_elite": True,
            },
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
            {"topic": "public_square", "actor": "maya", "value": 2},
            {"topic": "public_square", "actor": "samuel", "value": 3},
        ],
        "arguments": [
            {
                "key": "maya_argument_1",
                "topic": "public_square",
                "actor": "maya",
                "side": "pro",
                "content": "The square should become greener while keeping access for people with reduced mobility.",
            },
            {
                "key": "samuel_argument_1",
                "topic": "public_square",
                "actor": "samuel",
                "side": "pro",
                "parent": "maya_argument_1",
                "content": "This can work if accessibility and emergency access are preserved.",
            },
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
        "consultations": [
            {
                "key": "public_square_vote",
                "title": "[DEMO] Preferred redevelopment scenario",
                "status": "open",
                "open_date": "2026-05-01",
                "close_date": "2026-05-30",
                "options": [
                    {"key": "green_square", "label": "Mostly green public square"},
                    {"key": "mixed_square", "label": "Mixed public square with limited parking"},
                ],
            }
        ],
        "consultation_votes": [
            {
                "consultation": "public_square_vote",
                "actor": "maya",
                "option": "mixed_square",
                "raw_value": 1,
            },
            {
                "consultation": "public_square_vote",
                "actor": "samuel",
                "option": "mixed_square",
                "raw_value": 1,
            },
        ],
        "impact_items": [
            {
                "consultation": "public_square_vote",
                "action": "Publish preliminary design proposal",
                "status": "planned",
                "date": "2026-06-10",
            }
        ],
        "ekoh_profiles": [
            {
                "actor": "maya",
                "ethics_score": 1.0,
                "expertise": [
                    {
                        "domain_code": "0314",
                        "raw_score": 0.35,
                        "weighted_score": 0.35,
                    }
                ],
            },
            {
                "actor": "samuel",
                "ethics_score": 1.0,
                "expertise": [
                    {
                        "domain_code": "0731",
                        "raw_score": 0.92,
                        "weighted_score": 0.92,
                    }
                ],
            },
        ],
        "consultation_relevance": [
            {
                "consultation": "public_square_vote",
                "domain_code": "0731",
                "weight": 0.7,
            },
            {
                "consultation": "public_square_vote",
                "domain_code": "0314",
                "weight": 0.3,
            },
        ],
        "topic_relevance": [
            {
                "topic": "public_square",
                "domain_code": "0731",
                "weight": 0.7,
            },
            {
                "topic": "public_square",
                "domain_code": "0314",
                "weight": 0.3,
            },
        ],
        "reading_exclusions": [],
    }

    if overrides:
        scenario.update(overrides)
    return scenario


def error_messages(errors):
    return [error["message"] for error in errors]


def error_paths(errors):
    return [error["path"] for error in errors]


def test_valid_demo_scenario_passes_validation():
    assert validate_demo_scenario(make_valid_demo_scenario()) == []


def test_v1_and_v2_remain_supported_for_legacy_payloads():
    for version in (SCHEMA_VERSION_V1, SCHEMA_VERSION_V2):
        scenario = make_valid_demo_scenario()
        scenario["schema_version"] = version
        scenario["ekoh_profiles"] = []
        scenario["consultation_relevance"] = []
        scenario["topic_relevance"] = []
        scenario["reading_exclusions"] = []
        if version == SCHEMA_VERSION_V1:
            scenario["argument_sources"] = []
        for vote in scenario["consultation_votes"]:
            vote["weighted_value"] = vote["raw_value"]
        assert validate_demo_scenario(scenario) == []


def test_invalid_schema_version_fails_validation():
    scenario = make_valid_demo_scenario({"schema_version": "wrong-schema-version"})
    errors = validate_demo_scenario(scenario)
    assert "schema_version" in error_paths(errors)


def test_unknown_actor_reference_fails_validation():
    scenario = make_valid_demo_scenario()
    scenario["stances"][0]["actor"] = "unknown_actor"
    assert any(
        "Unknown actor reference" in message
        for message in error_messages(validate_demo_scenario(scenario))
    )


def test_unknown_topic_reference_fails_validation():
    scenario = make_valid_demo_scenario()
    scenario["stances"][0]["topic"] = "unknown_topic"
    assert any(
        "Unknown topic reference" in message
        for message in error_messages(validate_demo_scenario(scenario))
    )


@pytest.mark.parametrize(
    "invalid_value",
    [STANCE_MIN - 1, STANCE_MAX + 1, "strongly_support", None, 1.5],
)
def test_stance_outside_allowed_range_fails_validation(invalid_value):
    scenario = make_valid_demo_scenario()
    scenario["stances"][0]["value"] = invalid_value
    assert any(
        "Stance value must be an integer from -3 to +3" in message
        for message in error_messages(validate_demo_scenario(scenario))
    )


def test_unknown_consultation_reference_fails_validation():
    scenario = make_valid_demo_scenario()
    scenario["consultation_votes"][0]["consultation"] = "unknown_consultation"
    assert any(
        "Unknown consultation reference" in message
        for message in error_messages(validate_demo_scenario(scenario))
    )


def test_unknown_category_reference_fails_validation():
    scenario = make_valid_demo_scenario()
    scenario["topics"][0]["category"] = "unknown_category"
    assert any(
        "Unknown category reference" in message
        for message in error_messages(validate_demo_scenario(scenario))
    )


def test_invalid_topic_status_fails_validation():
    scenario = make_valid_demo_scenario()
    scenario["topics"][0]["status"] = "published"
    assert any(
        "Invalid topic status" in message
        for message in error_messages(validate_demo_scenario(scenario))
    )


def test_invalid_argument_side_fails_validation():
    scenario = make_valid_demo_scenario()
    scenario["arguments"][0]["side"] = "support"
    assert any(
        "Invalid argument side" in message
        for message in error_messages(validate_demo_scenario(scenario))
    )


def test_unknown_argument_parent_reference_fails_validation():
    scenario = make_valid_demo_scenario()
    scenario["arguments"][1]["parent"] = "unknown_argument"
    assert any(
        "Unknown argument parent reference" in message
        for message in error_messages(validate_demo_scenario(scenario))
    )


def test_v3_rejects_precomputed_weighted_value():
    scenario = make_valid_demo_scenario()
    scenario["consultation_votes"][0]["weighted_value"] = 1.35
    errors = validate_demo_scenario(scenario)
    assert any("derived Smart Vote reading" in message for message in error_messages(errors))


def test_v3_requires_relevance_to_sum_to_one():
    scenario = make_valid_demo_scenario()
    scenario["consultation_relevance"][0]["weight"] = 0.6
    errors = validate_demo_scenario(scenario)
    assert any("must sum to 1.0" in message for message in error_messages(errors))



def test_v3_requires_topic_relevance_to_sum_to_one():
    scenario = make_valid_demo_scenario()
    scenario["topic_relevance"][0]["weight"] = 0.6
    errors = validate_demo_scenario(scenario)
    assert any("Relevance weights for topic" in message for message in error_messages(errors))


def test_v3_rejects_unknown_topic_relevance_reference():
    scenario = make_valid_demo_scenario()
    scenario["topic_relevance"][0]["topic"] = "missing_topic"
    errors = validate_demo_scenario(scenario)
    assert any("Unknown topic reference" in message for message in error_messages(errors))


def test_v3_rejects_out_of_range_ekoh_score():
    scenario = make_valid_demo_scenario()
    scenario["ekoh_profiles"][1]["expertise"][0]["weighted_score"] = 1.5
    errors = validate_demo_scenario(scenario)
    assert any("must be between 0.0 and 1.0" in message for message in error_messages(errors))


def test_v2_rejects_ekoh_profiles():
    scenario = make_valid_demo_scenario()
    scenario["schema_version"] = SCHEMA_VERSION_V2
    for vote in scenario["consultation_votes"]:
        vote["weighted_value"] = vote["raw_value"]
    errors = validate_demo_scenario(scenario)
    assert any("ekoh_profiles requires" in message for message in error_messages(errors))


def test_schema_constant_points_to_v3():
    assert SCHEMA_VERSION == SCHEMA_VERSION_V3

def test_v3_accepts_declared_advisory_recusal():
    scenario = make_valid_demo_scenario()
    scenario["reading_exclusions"] = [
        {
            "topic": "public_square",
            "actor": "maya",
            "reason": "Voluntary recusal from the advisory reading.",
        }
    ]
    assert validate_demo_scenario(scenario) == []


def test_v3_rejects_unknown_reading_exclusion_actor():
    scenario = make_valid_demo_scenario()
    scenario["reading_exclusions"] = [
        {
            "topic": "public_square",
            "actor": "missing_actor",
            "reason": "Voluntary recusal.",
        }
    ]
    errors = validate_demo_scenario(scenario)
    assert any("Unknown actor reference" in message for message in error_messages(errors))


def test_v2_rejects_reading_exclusions():
    scenario = make_valid_demo_scenario()
    scenario["schema_version"] = SCHEMA_VERSION_V2
    scenario["ekoh_profiles"] = []
    scenario["consultation_relevance"] = []
    scenario["topic_relevance"] = []
    scenario["reading_exclusions"] = [
        {
            "topic": "public_square",
            "actor": "maya",
            "reason": "Voluntary recusal.",
        }
    ]
    for vote in scenario["consultation_votes"]:
        vote["weighted_value"] = vote["raw_value"]
    errors = validate_demo_scenario(scenario)
    assert any("reading_exclusions requires" in message for message in error_messages(errors))


def test_v3_accepts_public_ekoh_rating_visibility():
    scenario = make_valid_demo_scenario()
    scenario["ekoh_profiles"][0]["rating_visibility"] = "public"
    scenario["ekoh_profiles"][0]["publication_basis"] = "Public accountability role"
    assert validate_demo_scenario(scenario) == []


def test_v3_rejects_unknown_ekoh_rating_visibility():
    scenario = make_valid_demo_scenario()
    scenario["ekoh_profiles"][0]["rating_visibility"] = "organisation_only"
    errors = validate_demo_scenario(scenario)
    assert "ekoh_profiles[0].rating_visibility" in error_paths(errors)
