# backend/konnaxion/ethikos/demo_import/serializers.py

from rest_framework import serializers

from .schema import (
    ALLOWED_ARGUMENT_SIDES,
    ALLOWED_CONSULTATION_STATUSES,
    ALLOWED_IMPORT_MODES,
    ALLOWED_TOPIC_STATUSES,
    DEFAULT_IMPORT_MODE,
    SCHEMA_VERSION_V1,
    SUPPORTED_SCHEMA_VERSIONS,
    STANCE_MAX,
    STANCE_MIN,
)


class DemoImportErrorSerializer(serializers.Serializer):
    path = serializers.CharField()
    message = serializers.CharField()


class DemoImportSummarySerializer(serializers.Serializer):
    actors = serializers.IntegerField()
    categories = serializers.IntegerField()
    topics = serializers.IntegerField()
    stances = serializers.IntegerField()
    arguments = serializers.IntegerField()
    argument_sources = serializers.IntegerField()
    consultations = serializers.IntegerField()
    consultation_votes = serializers.IntegerField()
    impact_items = serializers.IntegerField()


class DemoImportObjectSerializer(serializers.Serializer):
    object_type = serializers.CharField()
    object_id = serializers.IntegerField()
    object_label = serializers.CharField(required=False, allow_blank=True)


class DemoImportResponseSerializer(serializers.Serializer):
    ok = serializers.BooleanField()
    dry_run = serializers.BooleanField(required=False)
    scenario_key = serializers.CharField(required=False)
    summary = DemoImportSummarySerializer(required=False)
    errors = DemoImportErrorSerializer(many=True, required=False)
    warnings = serializers.ListField(
        child=serializers.DictField(),
        required=False,
    )
    created = DemoImportObjectSerializer(many=True, required=False)
    updated = DemoImportObjectSerializer(many=True, required=False)
    deleted = DemoImportObjectSerializer(many=True, required=False)


class EthikosDemoActorSerializer(serializers.Serializer):
    key = serializers.CharField(max_length=120)
    username = serializers.CharField(max_length=150)
    display_name = serializers.CharField(max_length=255)

    email = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=255,
    )
    role = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=120,
    )
    is_ethikos_elite = serializers.BooleanField(required=False, default=False)


class EthikosDemoCategorySerializer(serializers.Serializer):
    key = serializers.CharField(max_length=120)
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)


class EthikosDemoTopicSerializer(serializers.Serializer):
    key = serializers.CharField(max_length=120)
    title = serializers.CharField(max_length=255)
    status = serializers.ChoiceField(choices=sorted(ALLOWED_TOPIC_STATUSES))
    category = serializers.CharField(max_length=120)

    description = serializers.CharField(required=False, allow_blank=True)
    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)


class EthikosDemoStanceSerializer(serializers.Serializer):
    topic = serializers.CharField(max_length=120)
    actor = serializers.CharField(max_length=120)
    value = serializers.IntegerField(min_value=STANCE_MIN, max_value=STANCE_MAX)


class EthikosDemoArgumentSerializer(serializers.Serializer):
    key = serializers.CharField(max_length=120)
    topic = serializers.CharField(max_length=120)
    actor = serializers.CharField(max_length=120)
    content = serializers.CharField()

    side = serializers.ChoiceField(
        choices=[choice for choice in ALLOWED_ARGUMENT_SIDES if choice is not None],
        required=False,
        allow_null=True,
    )
    parent = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        max_length=120,
    )


class EthikosDemoArgumentSourceSerializer(serializers.Serializer):
    key = serializers.CharField(max_length=120)
    argument = serializers.CharField(max_length=120)

    url = serializers.URLField(
        required=False,
        allow_blank=True,
        allow_null=True,
        max_length=2048,
    )
    title = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=255,
    )
    excerpt = serializers.CharField(required=False, allow_blank=True)
    source_type = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=64,
    )
    citation_text = serializers.CharField(required=False, allow_blank=True)
    quote = serializers.CharField(required=False, allow_blank=True)
    note = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if not any(
            value is not None and bool(str(value).strip())
            for value in (
                attrs.get("url"),
                attrs.get("citation_text"),
                attrs.get("quote"),
                attrs.get("note"),
            )
        ):
            raise serializers.ValidationError(
                "Provide at least one of url, citation_text, quote, or note."
            )

        return attrs


class EthikosDemoConsultationOptionSerializer(serializers.Serializer):
    key = serializers.CharField(max_length=120)
    label = serializers.CharField(max_length=255)


class EthikosDemoConsultationSerializer(serializers.Serializer):
    key = serializers.CharField(max_length=120)
    title = serializers.CharField(max_length=255)
    status = serializers.ChoiceField(choices=sorted(ALLOWED_CONSULTATION_STATUSES))
    open_date = serializers.DateField()
    close_date = serializers.DateField()

    options = EthikosDemoConsultationOptionSerializer(
        many=True,
        required=False,
        default=list,
    )


class EthikosDemoConsultationVoteSerializer(serializers.Serializer):
    consultation = serializers.CharField(max_length=120)
    actor = serializers.CharField(max_length=120)
    raw_value = serializers.FloatField()
    weighted_value = serializers.FloatField()

    option = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        max_length=120,
    )


class EthikosDemoImpactItemSerializer(serializers.Serializer):
    consultation = serializers.CharField(max_length=120)
    action = serializers.CharField()
    status = serializers.CharField(max_length=120)
    date = serializers.DateField()


class BaseDemoScenarioSerializer(serializers.Serializer):
    schema_version = serializers.ChoiceField(choices=SUPPORTED_SCHEMA_VERSIONS)
    scenario_key = serializers.CharField(max_length=120)
    scenario_title = serializers.CharField(max_length=255)
    mode = serializers.ChoiceField(
        choices=sorted(ALLOWED_IMPORT_MODES),
        required=False,
        default=DEFAULT_IMPORT_MODE,
    )

    metadata = serializers.DictField(required=False, default=dict)

    actors = EthikosDemoActorSerializer(many=True, required=False, default=list)
    categories = EthikosDemoCategorySerializer(many=True, required=False, default=list)
    topics = EthikosDemoTopicSerializer(many=True, required=False, default=list)
    stances = EthikosDemoStanceSerializer(many=True, required=False, default=list)
    arguments = EthikosDemoArgumentSerializer(many=True, required=False, default=list)
    argument_sources = EthikosDemoArgumentSourceSerializer(
        many=True,
        required=False,
        default=list,
    )
    consultations = EthikosDemoConsultationSerializer(
        many=True,
        required=False,
        default=list,
    )
    consultation_votes = EthikosDemoConsultationVoteSerializer(
        many=True,
        required=False,
        default=list,
    )
    impact_items = EthikosDemoImpactItemSerializer(
        many=True,
        required=False,
        default=list,
    )

    def validate(self, attrs):
        self._validate_unique_keys(attrs)
        self._validate_references(attrs)
        self._validate_dates(attrs)
        return attrs

    def _validate_unique_keys(self, attrs):
        keyed_lists = {
            "actors": attrs.get("actors", []),
            "categories": attrs.get("categories", []),
            "topics": attrs.get("topics", []),
            "arguments": attrs.get("arguments", []),
            "argument_sources": attrs.get("argument_sources", []),
            "consultations": attrs.get("consultations", []),
        }

        for list_name, items in keyed_lists.items():
            seen = set()

            for index, item in enumerate(items):
                key = item.get("key")

                if key in seen:
                    raise serializers.ValidationError(
                        {
                            list_name: (
                                f"Duplicate key '{key}' at {list_name}[{index}]."
                            )
                        }
                    )

                seen.add(key)

    def _validate_references(self, attrs):
        actor_keys = {actor["key"] for actor in attrs.get("actors", [])}
        category_keys = {category["key"] for category in attrs.get("categories", [])}
        topic_keys = {topic["key"] for topic in attrs.get("topics", [])}
        argument_keys = {argument["key"] for argument in attrs.get("arguments", [])}
        if (
            attrs.get("schema_version") == SCHEMA_VERSION_V1
            and attrs.get("argument_sources")
        ):
            raise serializers.ValidationError(
                {
                    "argument_sources": (
                        "argument_sources requires schema_version "
                        "ethikos-demo-scenario/v2."
                    )
                }
            )

        consultation_keys = {
            consultation["key"] for consultation in attrs.get("consultations", [])
        }

        for index, topic in enumerate(attrs.get("topics", [])):
            if topic["category"] not in category_keys:
                raise serializers.ValidationError(
                    {
                        "topics": (
                            f"Unknown category '{topic['category']}' "
                            f"at topics[{index}]."
                        )
                    }
                )

        for index, stance in enumerate(attrs.get("stances", [])):
            if stance["actor"] not in actor_keys:
                raise serializers.ValidationError(
                    {
                        "stances": (
                            f"Unknown actor '{stance['actor']}' "
                            f"at stances[{index}]."
                        )
                    }
                )

            if stance["topic"] not in topic_keys:
                raise serializers.ValidationError(
                    {
                        "stances": (
                            f"Unknown topic '{stance['topic']}' "
                            f"at stances[{index}]."
                        )
                    }
                )

        for index, argument in enumerate(attrs.get("arguments", [])):
            if argument["actor"] not in actor_keys:
                raise serializers.ValidationError(
                    {
                        "arguments": (
                            f"Unknown actor '{argument['actor']}' "
                            f"at arguments[{index}]."
                        )
                    }
                )

            if argument["topic"] not in topic_keys:
                raise serializers.ValidationError(
                    {
                        "arguments": (
                            f"Unknown topic '{argument['topic']}' "
                            f"at arguments[{index}]."
                        )
                    }
                )

            parent = argument.get("parent")
            if parent and parent not in argument_keys:
                raise serializers.ValidationError(
                    {
                        "arguments": (
                            f"Unknown parent argument '{parent}' "
                            f"at arguments[{index}]."
                        )
                    }
                )

        for index, source in enumerate(attrs.get("argument_sources", [])):
            if source["argument"] not in argument_keys:
                raise serializers.ValidationError(
                    {
                        "argument_sources": (
                            f"Unknown argument '{source['argument']}' "
                            f"at argument_sources[{index}]."
                        )
                    }
                )

        for index, vote in enumerate(attrs.get("consultation_votes", [])):
            if vote["actor"] not in actor_keys:
                raise serializers.ValidationError(
                    {
                        "consultation_votes": (
                            f"Unknown actor '{vote['actor']}' "
                            f"at consultation_votes[{index}]."
                        )
                    }
                )

            if vote["consultation"] not in consultation_keys:
                raise serializers.ValidationError(
                    {
                        "consultation_votes": (
                            f"Unknown consultation '{vote['consultation']}' "
                            f"at consultation_votes[{index}]."
                        )
                    }
                )

        for index, impact_item in enumerate(attrs.get("impact_items", [])):
            if impact_item["consultation"] not in consultation_keys:
                raise serializers.ValidationError(
                    {
                        "impact_items": (
                            f"Unknown consultation '{impact_item['consultation']}' "
                            f"at impact_items[{index}]."
                        )
                    }
                )

    def _validate_dates(self, attrs):
        for index, topic in enumerate(attrs.get("topics", [])):
            start_date = topic.get("start_date")
            end_date = topic.get("end_date")

            if start_date and end_date and start_date > end_date:
                raise serializers.ValidationError(
                    {
                        "topics": (
                            f"start_date must be before end_date "
                            f"at topics[{index}]."
                        )
                    }
                )

        for index, consultation in enumerate(attrs.get("consultations", [])):
            if consultation["open_date"] > consultation["close_date"]:
                raise serializers.ValidationError(
                    {
                        "consultations": (
                            f"open_date must be before close_date "
                            f"at consultations[{index}]."
                        )
                    }
                )


class DemoScenarioPreviewSerializer(BaseDemoScenarioSerializer):
    pass


class DemoScenarioImportSerializer(BaseDemoScenarioSerializer):
    pass


class DemoScenarioResetSerializer(serializers.Serializer):
    scenario_key = serializers.CharField(max_length=120)