"""Schema contract and validation for ethiKos demo scenario imports.

The importer treats the JSON payload as demo *source facts*. EkoH profile data
and consultation-domain relevance may be supplied as context, but Smart Vote
readings are derived later and must not be supplied as canonical results.

v1  legacy core demo payload
v2  adds argument_sources
v3  adds EkoH profiles + consultation relevance and removes weighted_value
    from source consultation votes
"""

from __future__ import annotations

from collections import defaultdict
from typing import Any

SCHEMA_VERSION_V1 = "ethikos-demo-scenario/v1"
SCHEMA_VERSION_V2 = "ethikos-demo-scenario/v2"
SCHEMA_VERSION_V3 = "ethikos-demo-scenario/v3"
SCHEMA_VERSION = SCHEMA_VERSION_V3
SUPPORTED_SCHEMA_VERSIONS = (
    SCHEMA_VERSION_V1,
    SCHEMA_VERSION_V2,
    SCHEMA_VERSION_V3,
)

DEFAULT_IMPORT_MODE = "replace_scenario"
ALLOWED_IMPORT_MODES = {"replace_scenario", "append_scenario"}
FEATURE_FLAG_NAME = "ETHIKOS_DEMO_IMPORTER_ENABLED"
API_NAMESPACE = "ethikos-demo-scenarios"
API_PREVIEW_PATH = "demo-scenarios/preview/"
API_IMPORT_PATH = "demo-scenarios/import/"
API_RESET_PATH = "demo-scenarios/reset/"

DEMO_USERNAME_PREFIX = "demo_"
DEMO_TOPIC_TITLE_PREFIX = "[DEMO]"
DEMO_EMAIL_DOMAIN = "example.test"

TRACK_OBJECT_TYPES = {
    "user": "user",
    "category": "category",
    "topic": "topic",
    "stance": "stance",
    "argument": "argument",
    "consultation": "consultation",
    "consultation_vote": "consultation_vote",
    "consultation_result": "consultation_result",
    "impact_item": "impact_item",
    "ekoh_expertise_score": "ekoh_expertise_score",
    "ekoh_ethics_score": "ekoh_ethics_score",
    "smart_vote_source_binding": "smart_vote_source_binding",
}

ALLOWED_TOPIC_STATUSES = {"open", "closed", "archived"}
ALLOWED_CONSULTATION_STATUSES = {"open", "closed", "archived"}
ALLOWED_ARGUMENT_SIDES = {"pro", "con", "neutral", None}
STANCE_MIN = -3
STANCE_MAX = 3
ALLOWED_EKOH_RATING_VISIBILITY = {"public", "scoped", "private"}

JSON_ROOT_KEYS = {
    "schema_version",
    "scenario_key",
    "scenario_title",
    "mode",
    "metadata",
    "actors",
    "categories",
    "topics",
    "stances",
    "arguments",
    "argument_sources",
    "consultations",
    "consultation_votes",
    "impact_items",
    "ekoh_profiles",
    "consultation_relevance",
    "topic_relevance",
    "reading_exclusions",
}

LIST_ROOT_KEYS = {
    "actors",
    "categories",
    "topics",
    "stances",
    "arguments",
    "argument_sources",
    "consultations",
    "consultation_votes",
    "impact_items",
    "ekoh_profiles",
    "consultation_relevance",
    "topic_relevance",
    "reading_exclusions",
}

REQUIRED_ROOT_FIELDS = {"schema_version", "scenario_key", "scenario_title"}
REQUIRED_ACTOR_FIELDS = {"key", "username", "display_name"}
REQUIRED_CATEGORY_FIELDS = {"key", "name"}
REQUIRED_TOPIC_FIELDS = {"key", "title", "status", "category"}
REQUIRED_STANCE_FIELDS = {"topic", "actor", "value"}
REQUIRED_ARGUMENT_FIELDS = {"key", "topic", "actor", "content"}
REQUIRED_ARGUMENT_SOURCE_FIELDS = {"key", "argument"}
REQUIRED_CONSULTATION_FIELDS = {"key", "title", "status", "open_date", "close_date"}
REQUIRED_CONSULTATION_OPTION_FIELDS = {"key", "label"}
REQUIRED_CONSULTATION_VOTE_FIELDS_LEGACY = {
    "consultation",
    "actor",
    "raw_value",
    "weighted_value",
}
REQUIRED_CONSULTATION_VOTE_FIELDS_V3 = {"consultation", "actor", "raw_value"}
REQUIRED_IMPACT_ITEM_FIELDS = {"consultation", "action", "status", "date"}
REQUIRED_EKOH_PROFILE_FIELDS = {"actor", "expertise"}
REQUIRED_EKOH_EXPERTISE_FIELDS = {"domain_code", "weighted_score"}
REQUIRED_CONSULTATION_RELEVANCE_FIELDS = {"consultation", "domain_code", "weight"}
REQUIRED_TOPIC_RELEVANCE_FIELDS = {"topic", "domain_code", "weight"}
REQUIRED_READING_EXCLUSION_FIELDS = {"topic", "actor", "reason"}

ARGUMENT_SOURCE_MATERIAL_FIELDS = ("url", "citation_text", "quote", "note")
ARGUMENT_SOURCE_OPTIONAL_STRING_FIELDS = (
    "url",
    "title",
    "excerpt",
    "source_type",
    "citation_text",
    "quote",
    "note",
)


def validate_demo_scenario(data: dict[str, Any]) -> list[dict[str, str]]:
    errors: list[dict[str, str]] = []
    if not isinstance(data, dict):
        return [{"path": "$", "message": "Scenario payload must be a JSON object."}]

    _validate_root(data, errors)
    if errors:
        return errors

    normalized = normalize_demo_scenario(data)
    schema_version = normalized["schema_version"]

    actors = normalized["actors"]
    categories = normalized["categories"]
    topics = normalized["topics"]
    stances = normalized["stances"]
    arguments = normalized["arguments"]
    argument_sources = normalized["argument_sources"]
    consultations = normalized["consultations"]
    consultation_votes = normalized["consultation_votes"]
    impact_items = normalized["impact_items"]
    ekoh_profiles = normalized["ekoh_profiles"]
    consultation_relevance = normalized["consultation_relevance"]
    topic_relevance = normalized["topic_relevance"]
    reading_exclusions = normalized["reading_exclusions"]

    actor_keys = _collect_unique_keys(actors, "actors", errors)
    category_keys = _collect_unique_keys(categories, "categories", errors)
    topic_keys = _collect_unique_keys(topics, "topics", errors)
    argument_keys = _collect_unique_keys(arguments, "arguments", errors)
    _collect_unique_keys(argument_sources, "argument_sources", errors)
    consultation_keys = _collect_unique_keys(consultations, "consultations", errors)
    consultation_option_keys = _collect_consultation_option_keys(consultations, errors)

    _validate_actors(actors, errors)
    _validate_categories(categories, errors)
    _validate_topics(topics, category_keys, errors)
    _validate_stances(stances, actor_keys, topic_keys, errors)
    _validate_arguments(arguments, actor_keys, topic_keys, argument_keys, errors)
    _validate_argument_sources(argument_sources, argument_keys, schema_version, errors)
    _validate_consultations(consultations, errors)
    _validate_consultation_votes(
        consultation_votes,
        actor_keys,
        consultation_keys,
        consultation_option_keys,
        schema_version,
        errors,
    )
    _validate_impact_items(impact_items, consultation_keys, errors)
    _validate_ekoh_profiles(ekoh_profiles, actor_keys, schema_version, errors)
    _validate_consultation_relevance(
        consultation_relevance,
        consultation_keys,
        schema_version,
        errors,
    )
    _validate_topic_relevance(
        topic_relevance,
        topic_keys,
        schema_version,
        errors,
    )
    _validate_reading_exclusions(
        reading_exclusions,
        actor_keys,
        topic_keys,
        schema_version,
        errors,
    )
    return errors


def normalize_demo_scenario(data: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(data)
    normalized.setdefault("mode", DEFAULT_IMPORT_MODE)
    normalized.setdefault("metadata", {})
    for key in LIST_ROOT_KEYS:
        normalized.setdefault(key, [])
    return normalized


def summarize_scenario_payload(data: dict[str, Any]) -> dict[str, int]:
    normalized = normalize_demo_scenario(data)
    return {
        "actors": len(normalized["actors"]),
        "categories": len(normalized["categories"]),
        "topics": len(normalized["topics"]),
        "stances": len(normalized["stances"]),
        "arguments": len(normalized["arguments"]),
        "argument_sources": len(normalized["argument_sources"]),
        "consultations": len(normalized["consultations"]),
        "consultation_votes": len(normalized["consultation_votes"]),
        "impact_items": len(normalized["impact_items"]),
        "ekoh_profiles": len(normalized["ekoh_profiles"]),
        "consultation_relevance": len(normalized["consultation_relevance"]),
        "topic_relevance": len(normalized["topic_relevance"]),
        "reading_exclusions": len(normalized["reading_exclusions"]),
    }


def _validate_root(data: dict[str, Any], errors: list[dict[str, str]]) -> None:
    _require_fields("$", data, REQUIRED_ROOT_FIELDS, errors)
    schema_version = data.get("schema_version")
    if schema_version not in SUPPORTED_SCHEMA_VERSIONS:
        _add_error(
            errors,
            "schema_version",
            "Expected schema_version to be one of: "
            + ", ".join(SUPPORTED_SCHEMA_VERSIONS)
            + ".",
        )

    mode = data.get("mode", DEFAULT_IMPORT_MODE)
    if mode not in ALLOWED_IMPORT_MODES:
        _add_error(
            errors,
            "mode",
            f"Import mode must be one of: {sorted(ALLOWED_IMPORT_MODES)}.",
        )

    if "scenario_key" in data and not _is_non_empty_string(data.get("scenario_key")):
        _add_error(errors, "scenario_key", "scenario_key must be a non-empty string.")
    if "scenario_title" in data and not _is_non_empty_string(data.get("scenario_title")):
        _add_error(errors, "scenario_title", "scenario_title must be a non-empty string.")
    if not isinstance(data.get("metadata", {}), dict):
        _add_error(errors, "metadata", "metadata must be an object.")

    unknown = set(data) - JSON_ROOT_KEYS
    for key in sorted(unknown):
        _add_error(errors, key, f"Unknown root field: {key}.")

    for key in LIST_ROOT_KEYS:
        if not isinstance(data.get(key, []), list):
            _add_error(errors, key, f"{key} must be a list.")


def _validate_actors(actors: list[Any], errors: list[dict[str, str]]) -> None:
    for i, actor in enumerate(actors):
        path = f"actors[{i}]"
        if not _is_object(path, actor, errors):
            continue
        _require_fields(path, actor, REQUIRED_ACTOR_FIELDS, errors)
        for field in ("key", "username", "display_name"):
            if field in actor and not _is_non_empty_string(actor.get(field)):
                _add_error(
                    errors,
                    f"{path}.{field}",
                    f"{field} must be a non-empty string.",
                )
        if actor.get("email") is not None and not isinstance(actor.get("email"), str):
            _add_error(errors, f"{path}.email", "email must be a string when provided.")
        if actor.get("is_ethikos_elite") is not None and not isinstance(
            actor.get("is_ethikos_elite"), bool
        ):
            _add_error(
                errors,
                f"{path}.is_ethikos_elite",
                "is_ethikos_elite must be a boolean when provided.",
            )


def _validate_categories(categories: list[Any], errors: list[dict[str, str]]) -> None:
    for i, category in enumerate(categories):
        path = f"categories[{i}]"
        if not _is_object(path, category, errors):
            continue
        _require_fields(path, category, REQUIRED_CATEGORY_FIELDS, errors)
        for field in ("key", "name"):
            if field in category and not _is_non_empty_string(category.get(field)):
                _add_error(
                    errors,
                    f"{path}.{field}",
                    f"{field} must be a non-empty string.",
                )


def _validate_topics(
    topics: list[Any],
    category_keys: set[str],
    errors: list[dict[str, str]],
) -> None:
    for i, topic in enumerate(topics):
        path = f"topics[{i}]"
        if not _is_object(path, topic, errors):
            continue
        _require_fields(path, topic, REQUIRED_TOPIC_FIELDS, errors)
        if topic.get("status") not in ALLOWED_TOPIC_STATUSES:
            _add_error(errors, f"{path}.status", "Invalid topic status.")
        category = topic.get("category")
        if category is not None and category not in category_keys:
            _add_error(
                errors,
                f"{path}.category",
                f"Unknown category reference: {category}.",
            )
        title = topic.get("title")
        if title is not None and not _is_non_empty_string(title):
            _add_error(errors, f"{path}.title", "title must be a non-empty string.")


def _validate_stances(
    stances: list[Any],
    actor_keys: set[str],
    topic_keys: set[str],
    errors: list[dict[str, str]],
) -> None:
    for i, stance in enumerate(stances):
        path = f"stances[{i}]"
        if not _is_object(path, stance, errors):
            continue
        _require_fields(path, stance, REQUIRED_STANCE_FIELDS, errors)
        actor = stance.get("actor")
        topic = stance.get("topic")
        if actor is not None and actor not in actor_keys:
            _add_error(
                errors,
                f"{path}.actor",
                f"Unknown actor reference: {actor}.",
            )
        if topic is not None and topic not in topic_keys:
            _add_error(
                errors,
                f"{path}.topic",
                f"Unknown topic reference: {topic}.",
            )
        value = stance.get("value")
        if (
            isinstance(value, bool)
            or not isinstance(value, int)
            or not STANCE_MIN <= value <= STANCE_MAX
        ):
            _add_error(
                errors,
                f"{path}.value",
                "Stance value must be an integer from -3 to +3.",
            )


def _validate_arguments(
    arguments: list[Any],
    actor_keys: set[str],
    topic_keys: set[str],
    argument_keys: set[str],
    errors: list[dict[str, str]],
) -> None:
    for i, argument in enumerate(arguments):
        path = f"arguments[{i}]"
        if not _is_object(path, argument, errors):
            continue
        _require_fields(path, argument, REQUIRED_ARGUMENT_FIELDS, errors)
        if argument.get("actor") not in actor_keys:
            _add_error(
                errors,
                f"{path}.actor",
                f"Unknown actor reference: {argument.get('actor')}.",
            )
        if argument.get("topic") not in topic_keys:
            _add_error(
                errors,
                f"{path}.topic",
                f"Unknown topic reference: {argument.get('topic')}.",
            )
        if argument.get("side") not in ALLOWED_ARGUMENT_SIDES:
            _add_error(errors, f"{path}.side", "Invalid argument side.")
        parent = argument.get("parent")
        if parent is not None and parent not in argument_keys:
            _add_error(
                errors,
                f"{path}.parent",
                f"Unknown argument parent reference: {parent}.",
            )
        if "content" in argument and not _is_non_empty_string(argument.get("content")):
            _add_error(
                errors,
                f"{path}.content",
                "content must be a non-empty string.",
            )


def _validate_argument_sources(
    sources: list[Any],
    argument_keys: set[str],
    schema_version: str,
    errors: list[dict[str, str]],
) -> None:
    if schema_version == SCHEMA_VERSION_V1 and sources:
        _add_error(
            errors,
            "argument_sources",
            "argument_sources requires schema_version ethikos-demo-scenario/v2 or later.",
        )
        return
    for i, source in enumerate(sources):
        path = f"argument_sources[{i}]"
        if not _is_object(path, source, errors):
            continue
        _require_fields(path, source, REQUIRED_ARGUMENT_SOURCE_FIELDS, errors)
        argument = source.get("argument")
        if argument is not None and argument not in argument_keys:
            _add_error(
                errors,
                f"{path}.argument",
                f"Unknown argument reference: {argument}.",
            )
        for field in ARGUMENT_SOURCE_OPTIONAL_STRING_FIELDS:
            value = source.get(field)
            if value is not None and not isinstance(value, str):
                _add_error(
                    errors,
                    f"{path}.{field}",
                    f"{field} must be a string when provided.",
                )
        if not any(
            _is_non_empty_string(source.get(field))
            for field in ARGUMENT_SOURCE_MATERIAL_FIELDS
        ):
            _add_error(
                errors,
                path,
                "Provide at least one of url, citation_text, quote, or note.",
            )


def _validate_consultations(
    consultations: list[Any],
    errors: list[dict[str, str]],
) -> None:
    for i, consultation in enumerate(consultations):
        path = f"consultations[{i}]"
        if not _is_object(path, consultation, errors):
            continue
        _require_fields(path, consultation, REQUIRED_CONSULTATION_FIELDS, errors)
        if consultation.get("status") not in ALLOWED_CONSULTATION_STATUSES:
            _add_error(errors, f"{path}.status", "Invalid consultation status.")
        options = consultation.get("options", [])
        if not isinstance(options, list):
            _add_error(
                errors,
                f"{path}.options",
                "options must be a list when provided.",
            )
            continue
        for j, option in enumerate(options):
            option_path = f"{path}.options[{j}]"
            if not _is_object(option_path, option, errors):
                continue
            _require_fields(
                option_path,
                option,
                REQUIRED_CONSULTATION_OPTION_FIELDS,
                errors,
            )


def _validate_consultation_votes(
    votes: list[Any],
    actor_keys: set[str],
    consultation_keys: set[str],
    consultation_option_keys: dict[str, set[str]],
    schema_version: str,
    errors: list[dict[str, str]],
) -> None:
    required = (
        REQUIRED_CONSULTATION_VOTE_FIELDS_V3
        if schema_version == SCHEMA_VERSION_V3
        else REQUIRED_CONSULTATION_VOTE_FIELDS_LEGACY
    )
    for i, vote in enumerate(votes):
        path = f"consultation_votes[{i}]"
        if not _is_object(path, vote, errors):
            continue
        _require_fields(path, vote, required, errors)
        actor = vote.get("actor")
        consultation = vote.get("consultation")
        if actor is not None and actor not in actor_keys:
            _add_error(
                errors,
                f"{path}.actor",
                f"Unknown actor reference: {actor}.",
            )
        if consultation is not None and consultation not in consultation_keys:
            _add_error(
                errors,
                f"{path}.consultation",
                f"Unknown consultation reference: {consultation}.",
            )
        option = vote.get("option")
        if option is not None and consultation in consultation_option_keys:
            known = consultation_option_keys.get(str(consultation), set())
            if known and option not in known:
                _add_error(
                    errors,
                    f"{path}.option",
                    f"Unknown option reference for consultation {consultation}: {option}.",
                )
        _validate_number(vote, "raw_value", path, errors)
        if schema_version == SCHEMA_VERSION_V3:
            if "weighted_value" in vote:
                _add_error(
                    errors,
                    f"{path}.weighted_value",
                    "weighted_value is a derived Smart Vote reading and must not be supplied in v3 source votes.",
                )
        else:
            _validate_number(vote, "weighted_value", path, errors)


def _validate_impact_items(
    items: list[Any],
    consultation_keys: set[str],
    errors: list[dict[str, str]],
) -> None:
    for i, item in enumerate(items):
        path = f"impact_items[{i}]"
        if not _is_object(path, item, errors):
            continue
        _require_fields(path, item, REQUIRED_IMPACT_ITEM_FIELDS, errors)
        consultation = item.get("consultation")
        if consultation is not None and consultation not in consultation_keys:
            _add_error(
                errors,
                f"{path}.consultation",
                f"Unknown consultation reference: {consultation}.",
            )


def _validate_ekoh_profiles(
    profiles: list[Any],
    actor_keys: set[str],
    schema_version: str,
    errors: list[dict[str, str]],
) -> None:
    if schema_version != SCHEMA_VERSION_V3 and profiles:
        _add_error(
            errors,
            "ekoh_profiles",
            "ekoh_profiles requires schema_version ethikos-demo-scenario/v3.",
        )
        return

    seen_actors: set[str] = set()
    for i, profile in enumerate(profiles):
        path = f"ekoh_profiles[{i}]"
        if not _is_object(path, profile, errors):
            continue
        _require_fields(path, profile, REQUIRED_EKOH_PROFILE_FIELDS, errors)
        actor = profile.get("actor")
        if actor not in actor_keys:
            _add_error(
                errors,
                f"{path}.actor",
                f"Unknown actor reference: {actor}.",
            )
        elif actor in seen_actors:
            _add_error(
                errors,
                f"{path}.actor",
                f"Duplicate EkoH profile for actor: {actor}.",
            )
        elif isinstance(actor, str):
            seen_actors.add(actor)

        ethics = profile.get("ethics_score")
        if ethics is not None:
            _validate_bounded_number_value(
                ethics,
                0.0,
                2.0,
                f"{path}.ethics_score",
                errors,
            )

        rating_visibility = profile.get("rating_visibility")
        if rating_visibility is not None and rating_visibility not in ALLOWED_EKOH_RATING_VISIBILITY:
            _add_error(
                errors,
                f"{path}.rating_visibility",
                "rating_visibility must be one of: public, scoped, private.",
            )

        publication_basis = profile.get("publication_basis")
        if publication_basis is not None and not isinstance(publication_basis, str):
            _add_error(
                errors,
                f"{path}.publication_basis",
                "publication_basis must be a string when provided.",
            )

        expertise = profile.get("expertise")
        if not isinstance(expertise, list):
            _add_error(errors, f"{path}.expertise", "expertise must be a list.")
            continue

        seen_domains: set[str] = set()
        for j, score in enumerate(expertise):
            score_path = f"{path}.expertise[{j}]"
            if not _is_object(score_path, score, errors):
                continue
            _require_fields(
                score_path,
                score,
                REQUIRED_EKOH_EXPERTISE_FIELDS,
                errors,
            )
            code = score.get("domain_code")
            if not _is_non_empty_string(code):
                _add_error(
                    errors,
                    f"{score_path}.domain_code",
                    "domain_code must be a non-empty string.",
                )
            elif code in seen_domains:
                _add_error(
                    errors,
                    f"{score_path}.domain_code",
                    f"Duplicate domain_code in profile: {code}.",
                )
            else:
                seen_domains.add(code)

            _validate_bounded_number(
                score,
                "weighted_score",
                0.0,
                1.0,
                score_path,
                errors,
            )
            if "raw_score" in score:
                _validate_bounded_number(
                    score,
                    "raw_score",
                    0.0,
                    1.0,
                    score_path,
                    errors,
                )


def _validate_consultation_relevance(
    rows: list[Any],
    consultation_keys: set[str],
    schema_version: str,
    errors: list[dict[str, str]],
) -> None:
    if schema_version != SCHEMA_VERSION_V3 and rows:
        _add_error(
            errors,
            "consultation_relevance",
            "consultation_relevance requires schema_version ethikos-demo-scenario/v3.",
        )
        return

    totals: defaultdict[str, float] = defaultdict(float)
    seen: set[tuple[str, str]] = set()

    for i, row in enumerate(rows):
        path = f"consultation_relevance[{i}]"
        if not _is_object(path, row, errors):
            continue
        _require_fields(
            path,
            row,
            REQUIRED_CONSULTATION_RELEVANCE_FIELDS,
            errors,
        )
        consultation = row.get("consultation")
        domain_code = row.get("domain_code")

        if consultation not in consultation_keys:
            _add_error(
                errors,
                f"{path}.consultation",
                f"Unknown consultation reference: {consultation}.",
            )
        if not _is_non_empty_string(domain_code):
            _add_error(
                errors,
                f"{path}.domain_code",
                "domain_code must be a non-empty string.",
            )

        if isinstance(consultation, str) and isinstance(domain_code, str):
            pair = (consultation, domain_code)
            if pair in seen:
                _add_error(
                    errors,
                    path,
                    f"Duplicate consultation/domain relevance pair: {consultation}/{domain_code}.",
                )
            seen.add(pair)

        if _validate_bounded_number(
            row,
            "weight",
            0.0,
            1.0,
            path,
            errors,
        ) and isinstance(consultation, str):
            totals[consultation] += float(row["weight"])

        criteria = row.get("criteria")
        if criteria is not None and not isinstance(criteria, (dict, str)):
            _add_error(
                errors,
                f"{path}.criteria",
                "criteria must be an object or string when provided.",
            )

    for consultation, total in totals.items():
        if abs(total - 1.0) > 0.0001:
            _add_error(
                errors,
                "consultation_relevance",
                f"Relevance weights for consultation {consultation} must sum to 1.0; got {total:.4f}.",
            )



def _validate_topic_relevance(
    rows: list[Any],
    topic_keys: set[str],
    schema_version: str,
    errors: list[dict[str, str]],
) -> None:
    """Validate multi-domain relevance attached directly to Ethikos topics.

    This is the preferred v3 demo shape. The importer maps each source topic to
    a Smart Vote consultation through an explicit SourceConsultationBinding.
    """
    if schema_version != SCHEMA_VERSION_V3 and rows:
        _add_error(
            errors,
            "topic_relevance",
            "topic_relevance requires schema_version ethikos-demo-scenario/v3.",
        )
        return

    totals: defaultdict[str, float] = defaultdict(float)
    seen: set[tuple[str, str]] = set()

    for i, row in enumerate(rows):
        path = f"topic_relevance[{i}]"
        if not _is_object(path, row, errors):
            continue
        _require_fields(path, row, REQUIRED_TOPIC_RELEVANCE_FIELDS, errors)
        topic = row.get("topic")
        domain_code = row.get("domain_code")

        if topic not in topic_keys:
            _add_error(
                errors,
                f"{path}.topic",
                f"Unknown topic reference: {topic}.",
            )
        if not _is_non_empty_string(domain_code):
            _add_error(
                errors,
                f"{path}.domain_code",
                "domain_code must be a non-empty string.",
            )

        if isinstance(topic, str) and isinstance(domain_code, str):
            pair = (topic, domain_code)
            if pair in seen:
                _add_error(
                    errors,
                    path,
                    f"Duplicate topic/domain relevance pair: {topic}/{domain_code}.",
                )
            seen.add(pair)

        if _validate_bounded_number(
            row,
            "weight",
            0.0,
            1.0,
            path,
            errors,
        ) and isinstance(topic, str):
            totals[topic] += float(row["weight"])

        criteria = row.get("criteria")
        if criteria is not None and not isinstance(criteria, (dict, str)):
            _add_error(
                errors,
                f"{path}.criteria",
                "criteria must be an object or string when provided.",
            )

    for topic, total in totals.items():
        if abs(total - 1.0) > 0.0001:
            _add_error(
                errors,
                "topic_relevance",
                f"Relevance weights for topic {topic} must sum to 1.0; got {total:.4f}.",
            )


def _validate_reading_exclusions(
    rows: list[Any],
    actor_keys: set[str],
    topic_keys: set[str],
    schema_version: str,
    errors: list[dict[str, str]],
) -> None:
    """Validate explicit advisory-only exclusions such as voluntary recusals.

    These rows configure a Smart Vote lens. They never remove or mutate the
    canonical EthikosStance used by the baseline reading.
    """
    if schema_version != SCHEMA_VERSION_V3 and rows:
        _add_error(
            errors,
            "reading_exclusions",
            "reading_exclusions requires schema_version ethikos-demo-scenario/v3.",
        )
        return

    seen: set[tuple[str, str]] = set()

    for i, row in enumerate(rows):
        path = f"reading_exclusions[{i}]"
        if not _is_object(path, row, errors):
            continue

        _require_fields(path, row, REQUIRED_READING_EXCLUSION_FIELDS, errors)
        topic = row.get("topic")
        actor = row.get("actor")
        reason = row.get("reason")

        if topic not in topic_keys:
            _add_error(
                errors,
                f"{path}.topic",
                f"Unknown topic reference: {topic}.",
            )

        if actor not in actor_keys:
            _add_error(
                errors,
                f"{path}.actor",
                f"Unknown actor reference: {actor}.",
            )

        if not _is_non_empty_string(reason):
            _add_error(
                errors,
                f"{path}.reason",
                "reason must be a non-empty string.",
            )

        if isinstance(topic, str) and isinstance(actor, str):
            pair = (topic, actor)
            if pair in seen:
                _add_error(
                    errors,
                    path,
                    f"Duplicate reading exclusion for topic/actor: {topic}/{actor}.",
                )
            seen.add(pair)


def _collect_unique_keys(
    items: list[Any],
    collection_path: str,
    errors: list[dict[str, str]],
) -> set[str]:
    keys: set[str] = set()
    for i, item in enumerate(items):
        if not isinstance(item, dict):
            continue
        key = item.get("key")
        if key is None:
            continue
        if not _is_non_empty_string(key):
            _add_error(
                errors,
                f"{collection_path}[{i}].key",
                "key must be a non-empty string.",
            )
            continue
        if key in keys:
            _add_error(
                errors,
                f"{collection_path}[{i}].key",
                f"Duplicate key: {key}.",
            )
        keys.add(key)
    return keys


def _collect_consultation_option_keys(
    consultations: list[Any],
    errors: list[dict[str, str]],
) -> dict[str, set[str]]:
    result: dict[str, set[str]] = {}
    for i, consultation in enumerate(consultations):
        if not isinstance(consultation, dict) or not isinstance(
            consultation.get("key"), str
        ):
            continue
        keys: set[str] = set()
        for j, option in enumerate(consultation.get("options", []) or []):
            if not isinstance(option, dict):
                continue
            key = option.get("key")
            if isinstance(key, str):
                if key in keys:
                    _add_error(
                        errors,
                        f"consultations[{i}].options[{j}].key",
                        f"Duplicate option key: {key}.",
                    )
                keys.add(key)
        result[consultation["key"]] = keys
    return result


def _require_fields(
    path: str,
    obj: dict[str, Any],
    required: set[str],
    errors: list[dict[str, str]],
) -> None:
    for field in sorted(required):
        if field not in obj:
            _add_error(
                errors,
                f"{path}.{field}",
                f"Missing required field: {field}.",
            )


def _is_object(
    path: str,
    value: Any,
    errors: list[dict[str, str]],
) -> bool:
    if isinstance(value, dict):
        return True
    _add_error(errors, path, "Expected an object.")
    return False


def _is_non_empty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _validate_number(
    obj: dict[str, Any],
    field: str,
    path: str,
    errors: list[dict[str, str]],
) -> bool:
    value = obj.get(field)
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        _add_error(
            errors,
            f"{path}.{field}",
            f"{field} must be a number.",
        )
        return False
    return True


def _validate_bounded_number(
    obj: dict[str, Any],
    field: str,
    minimum: float,
    maximum: float,
    path: str,
    errors: list[dict[str, str]],
) -> bool:
    value = obj.get(field)
    return _validate_bounded_number_value(
        value,
        minimum,
        maximum,
        f"{path}.{field}",
        errors,
    )


def _validate_bounded_number_value(
    value: Any,
    minimum: float,
    maximum: float,
    path: str,
    errors: list[dict[str, str]],
) -> bool:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        _add_error(
            errors,
            path,
            f"Value must be a number between {minimum} and {maximum}.",
        )
        return False
    if not minimum <= float(value) <= maximum:
        _add_error(
            errors,
            path,
            f"Value must be between {minimum} and {maximum}.",
        )
        return False
    return True


def _add_error(errors: list[dict[str, str]], path: str, message: str) -> None:
    errors.append({"path": path, "message": message})