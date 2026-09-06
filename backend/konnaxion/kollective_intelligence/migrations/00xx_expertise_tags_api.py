# FILE: backend/konnaxion/kollective_intelligence/migrations/00xx_expertise_tags_api.py
from django.db import migrations

# Baseline expertise 'tags' that will be exposed via the expertise-tags API.
# For now we only persist the human-readable name on ExpertiseCategory.
EXPERTISE_TAGS = [
    # key, label, description
    (
        "frontend",
        "Frontend Development",
        "React, TypeScript, modern component patterns and design systems.",
    ),
    (
        "backend",
        "Backend Development",
        "APIs, microservices, Node.js / Python, data modelling & reliability.",
    ),
    (
        "uiux",
        "UI/UX Design",
        "User journeys, wireframes, interactive prototypes, design systems.",
    ),
    (
        "data-science",
        "Data Science",
        "Exploratory analysis, ML models, dashboards, decision support.",
    ),
    (
        "devops",
        "DevOps",
        "CI/CD, observability, infrastructure-as-code, cloud environments.",
    ),
    (
        "mobile",
        "Mobile Development",
        "Native & cross-platform apps, performance and offline patterns.",
    ),
    (
        "qa",
        "QA",
        "Testing strategy, automation, regression & release quality.",
    ),
    (
        "pm",
        "Project Management",
        "Roadmapping, stakeholder alignment, agile delivery and rituals.",
    ),
]


def forwards_create_expertise_tags(apps, schema_editor):
    """
    Seed baseline expertise categories used by:
    - Ekoh reputation / expertise weights
    - KeenKonnect matching
    - Smart Vote weighting

    We only persist the `.name` (label) on ExpertiseCategory so this
    migration remains compatible even if the model is later extended.
    """
    ExpertiseCategory = apps.get_model(
        "kollective_intelligence", "ExpertiseCategory"
    )

    for _key, label, _description in EXPERTISE_TAGS:
        # Use label as the canonical category name for now.
        ExpertiseCategory.objects.get_or_create(name=label)


def backwards_delete_expertise_tags(apps, schema_editor):
    """
    Reverse operation: remove categories whose names match the labels defined
    in this migration.
    """
    ExpertiseCategory = apps.get_model(
        "kollective_intelligence", "ExpertiseCategory"
    )

    labels = [label for _key, label, _desc in EXPERTISE_TAGS]
    ExpertiseCategory.objects.filter(name__in=labels).delete()


class Migration(migrations.Migration):

    # When you rename this file to a real migration (e.g. 0002_expertise_tags_api.py),
    # keep the dependency pointing to the initial schema migration.
    dependencies = [
        ("kollective_intelligence", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(
            forwards_create_expertise_tags,
            backwards_delete_expertise_tags,
        ),
    ]
