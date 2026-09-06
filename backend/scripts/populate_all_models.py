# FILE: backend/scripts/populate_all_models.py
# -*- coding: utf-8 -*-
"""
Populate the Konnaxion v14 database with a small demo dataset.

Usage (inside the django container):

    python manage.py runscript populate_all_models
"""

import random
from decimal import Decimal
from datetime import timedelta

from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from faker import Faker

from konnaxion.kollective_intelligence.models import (
    ExpertiseCategory,
    UserExpertiseScore,
    UserEthicsScore,
    ScoreConfiguration,
    ConfidentialitySetting,
    VoteModality,
    Vote,
    EmergingExpert,
    VoteResult,
    IntegrationMapping,
)
from konnaxion.ethikos.models import (
    EthikosCategory,
    EthikosTopic,
    EthikosArgument,
    EthikosStance,
)
from konnaxion.keenkonnect.models import (
    Project,
    ProjectResource,
    ProjectTask,
    ProjectTeam,
    ProjectRating,
    ProjectMessage,
    Tag as ProjectTag,
)
from konnaxion.konnected.models import (
    KnowledgeResource,
    KnowledgeRecommendation,
    LearningProgress,
    ForumTopic,
    ForumPost,
    CoCreationProject,
    CoCreationContribution,
)
from konnaxion.kreative.models import (
    Tag as KreativeTag,
    KreativeArtwork,
    ArtworkTag,
    Gallery,
    GalleryArtwork,
    TraditionEntry,
)

faker = Faker()
User = get_user_model()


def dummy_file(name="dummy.txt", content=b"dummy content"):
    """Return a simple in-memory file for FileField / ImageField."""
    return ContentFile(content, name)


# ---------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------
def ensure_users(min_count=10):
    users = list(User.objects.all())
    to_create = max(0, min_count - len(users))
    created = []

    for _ in range(to_create):
        username = faker.unique.user_name()
        email = faker.safe_email()
        user = User.objects.create_user(
            username=username,
            email=email,
            password="password123",
            name=faker.name(),
        )
        created.append(user)

    users = list(User.objects.all())
    print(f"[users] total={len(users)} (created {len(created)})")
    return users


# ---------------------------------------------------------------------
# Kollective Intelligence (EkoH + SmartVote)
# ---------------------------------------------------------------------
def populate_kollective(users):
    # Expertise categories
    cat_names = ["Democracy", "Climate", "Economy"]
    cats = []
    for name in cat_names:
        cat, _ = ExpertiseCategory.objects.get_or_create(name=name)
        cats.append(cat)
    print(f"[kollective] ExpertiseCategory count={ExpertiseCategory.objects.count()}")

    # UserExpertiseScore (3 combos user/category)
    for i in range(3):
        u = users[i % len(users)]
        c = cats[i % len(cats)]
        obj, created = UserExpertiseScore.objects.get_or_create(
            user=u,
            category=c,
            defaults={
                "raw_score": Decimal("10.0") + i,
                "weighted_score": Decimal("9.5") + i,
            },
        )
    print(f"[kollective] UserExpertiseScore count={UserExpertiseScore.objects.count()}")

    # UserEthicsScore (OneToOne PK)
    for i, u in enumerate(users[:3]):
        UserEthicsScore.objects.update_or_create(
            user=u,
            defaults={"ethical_score": Decimal("0.80") + Decimal("0.10") * i},
        )
    print(f"[kollective] UserEthicsScore count={UserEthicsScore.objects.count()}")

    # ConfidentialitySetting (OneToOne PK)
    levels = [c[0] for c in ConfidentialitySetting.LEVEL_CHOICES]
    for i, u in enumerate(users[:3]):
        ConfidentialitySetting.objects.update_or_create(
            user=u,
            defaults={"level": levels[i % len(levels)]},
        )
    print(f"[kollective] ConfidentialitySetting count={ConfidentialitySetting.objects.count()}")

    # ScoreConfiguration
    confs = [
        ("ekoh_base", Decimal("1.000"), None),
        ("debate_weight", Decimal("0.750"), "ethikos"),
        ("project_weight", Decimal("0.600"), "project"),
    ]
    for name, value, field in confs:
        ScoreConfiguration.objects.get_or_create(
            weight_name=name,
            field=field,
            defaults={"weight_value": value},
        )
    print(f"[kollective] ScoreConfiguration count={ScoreConfiguration.objects.count()}")

    # VoteModality
    modes = [
        ("approval", {"min": 0, "max": 1}),
        ("rating", {"min": 1, "max": 5}),
        ("ranking", {"style": "borda"}),
    ]
    for name, params in modes:
        VoteModality.objects.get_or_create(
            name=name,
            defaults={"parameters": params},
        )
    print(f"[kollective] VoteModality count={VoteModality.objects.count()}")

    # IntegrationMapping (just 3 generic mappings)
    mappings = [
        ("ethikos", "topic", {"target": "EthikosTopic"}),
        ("keenkonnect", "project", {"target": "Project"}),
        ("konnected", "resource", {"target": "KnowledgeResource"}),
    ]
    for module_name, context_type, details in mappings:
        IntegrationMapping.objects.get_or_create(
            module_name=module_name,
            context_type=context_type,
            defaults={"mapping_details": details},
        )
    print(f"[kollective] IntegrationMapping count={IntegrationMapping.objects.count()}")

    # EmergingExpert (flag three users)
    for i, u in enumerate(users[:3]):
        EmergingExpert.objects.get_or_create(
            user=u,
            defaults={
                "detection_date": timezone.now().date() - timedelta(days=i),
                "score_delta": Decimal("5.0") + i,
            },
        )
    print(f"[kollective] EmergingExpert count={EmergingExpert.objects.count()}")


# ---------------------------------------------------------------------
# ethiKos
# ---------------------------------------------------------------------
def populate_ethikos(users):
    # Categories
    names = ["Politics", "Ethics", "Education"]
    eth_cats = []
    for n in names:
        c, _ = EthikosCategory.objects.get_or_create(
            name=n,
            defaults={"description": f"Discussions about {n.lower()}."},
        )
        eth_cats.append(c)
    print(f"[ethikos] EthikosCategory count={EthikosCategory.objects.count()}")

    # Topics
    topics = []
    for i in range(3):
        cat = eth_cats[i % len(eth_cats)]
        creator = users[i % len(users)]
        t = EthikosTopic.objects.create(
            title=faker.sentence(nb_words=6),
            description=faker.paragraph(nb_sentences=3),
            category=cat,
            created_by=creator,
        )
        topics.append(t)
    print(f"[ethikos] EthikosTopic count={EthikosTopic.objects.count()}")

    # Stances and arguments
    for t in topics:
        for u in users[:3]:
            EthikosStance.objects.get_or_create(
                user=u,
                topic=t,
                defaults={"value": random.randint(-3, 3)},
            )
            EthikosArgument.objects.create(
                topic=t,
                user=u,
                content=faker.paragraph(nb_sentences=2),
                side=random.choice(
                    [EthikosArgument.PRO, EthikosArgument.CON, None]
                ),
            )
    print(f"[ethikos] EthikosStance count={EthikosStance.objects.count()}")
    print(f"[ethikos] EthikosArgument count={EthikosArgument.objects.count()}")

    # Link some SmartVote votes to ethikos topics
    for t in topics:
        for u in users[:2]:
            Vote.objects.get_or_create(
                user=u,
                target_type="ethikos_topic",
                target_id=t.id,
                defaults={
                    "raw_value": Decimal("1.0"),
                    "weighted_value": Decimal("1.0"),
                },
            )
    print(f"[kollective] Vote count={Vote.objects.count()}")

    # Aggregate simple VoteResult for first topic
    if topics:
        VoteResult.objects.get_or_create(
            target_type="ethikos_topic",
            target_id=topics[0].id,
            defaults={
                "sum_weighted_value": Decimal("3.0"),
                "vote_count": 3,
            },
        )
        print(f"[kollective] VoteResult count={VoteResult.objects.count()}")


# ---------------------------------------------------------------------
# KeenKonnect
# ---------------------------------------------------------------------
def populate_keenkonnect(users):
    # Tags
    tag_names = ["climate", "education", "health"]
    kk_tags = []
    for name in tag_names:
        t, _ = ProjectTag.objects.get_or_create(name=name)
        kk_tags.append(t)
    print(f"[keenkonnect] Tag count={ProjectTag.objects.count()}")

    # Projects
    projects = []
    for i in range(3):
        creator = users[i % len(users)]
        p = Project.objects.create(
            title=faker.sentence(nb_words=4),
            description=faker.paragraph(nb_sentences=3),
            category=random.choice(["Civic", "STEM", "Arts"]),
            creator=creator,
            status=Project.Status.IDEA,
        )
        p.tags.add(*kk_tags)
        projects.append(p)
    print(f"[keenkonnect] Project count={Project.objects.count()}")

    # ProjectResource (only URL, no file)
    for p in projects:
        ProjectResource.objects.create(
            project=p,
            title="Project overview",
            description="External documentation link.",
            external_url=faker.url(),
            file_type=ProjectResource.FileType.DOC,
            uploaded_by=random.choice(users),
        )
    print(f"[keenkonnect] ProjectResource count={ProjectResource.objects.count()}")

    # Tasks
    for p in projects:
        for status in [
            ProjectTask.TaskStatus.TODO,
            ProjectTask.TaskStatus.IN_PROGRESS,
            ProjectTask.TaskStatus.DONE,
        ]:
            ProjectTask.objects.create(
                project=p,
                title=f"{status} task for {p.title}",
                description=faker.sentence(),
                status=status,
                assignee=random.choice(users),
                order=random.randint(0, 10),
            )
    print(f"[keenkonnect] ProjectTask count={ProjectTask.objects.count()}")

    # Team
    for p in projects:
        owner = p.creator
        ProjectTeam.objects.get_or_create(
            project=p,
            user=owner,
            defaults={"role": ProjectTeam.Role.OWNER},
        )
        collaborator = random.choice(users)
        ProjectTeam.objects.get_or_create(
            project=p,
            user=collaborator,
            defaults={"role": ProjectTeam.Role.COLLABORATOR},
        )
    print(f"[keenkonnect] ProjectTeam count={ProjectTeam.objects.count()}")

    # Ratings and messages
    for p in projects:
        for u in users[:3]:
            ProjectRating.objects.get_or_create(
                project=p,
                user=u,
                defaults={"value": random.choice([1, -1])},
            )
            ProjectMessage.objects.create(
                project=p,
                author=u,
                content=f"Message from {u.username} on {p.title}",
            )
    print(f"[keenkonnect] ProjectRating count={ProjectRating.objects.count()}")
    print(f"[keenkonnect] ProjectMessage count={ProjectMessage.objects.count()}")


# ---------------------------------------------------------------------
# KonnectED
# ---------------------------------------------------------------------
def populate_konnected(users):
    # Knowledge resources
    resources = []
    types = [c[0] for c in KnowledgeResource.ResourceType.choices]
    for _ in range(3):
        r = KnowledgeResource.objects.create(
            title=faker.sentence(nb_words=5),
            type=random.choice(types),
            url=faker.url(),
            author=random.choice(users),
        )
        resources.append(r)
    print(f"[konnected] KnowledgeResource count={KnowledgeResource.objects.count()}")

    # Knowledge recommendations
    for r in resources:
        u = random.choice(users)
        KnowledgeRecommendation.objects.create(
            user=u,
            resource=r,
            recommended_at=timezone.now(),
        )
    print(f"[konnected] KnowledgeRecommendation count={KnowledgeRecommendation.objects.count()}")

    # Learning progress (unique per user/resource; we just do first 3 combos)
    for i in range(min(3, len(users))):
        u = users[i]
        r = resources[i % len(resources)]
        LearningProgress.objects.get_or_create(
            user=u,
            resource=r,
            defaults={"progress_percent": Decimal("25.0") * (i + 1)},
        )
    print(f"[konnected] LearningProgress count={LearningProgress.objects.count()}")

    # Co-creation projects and contributions
    cc_projects = []
    for _ in range(3):
        p = CoCreationProject.objects.create(
            title=faker.sentence(nb_words=4),
            status=CoCreationProject.Status.DRAFT,
        )
        cc_projects.append(p)
    for p in cc_projects:
        for u in users[:2]:
            CoCreationContribution.objects.create(
                project=p,
                user=u,
                content=faker.paragraph(nb_sentences=2),
            )
    print(f"[konnected] CoCreationProject count={CoCreationProject.objects.count()}")
    print(f"[konnected] CoCreationContribution count={CoCreationContribution.objects.count()}")

    # Forum topics and posts
    topics = []
    for _ in range(3):
        t = ForumTopic.objects.create(
            title=faker.sentence(nb_words=5),
            category=random.choice(["Math", "Science", "General"]),
            creator=random.choice(users),
        )
        topics.append(t)
    for t in topics:
        for u in users[:3]:
            ForumPost.objects.create(
                topic=t,
                author=u,
                content=faker.paragraph(nb_sentences=2),
            )
    print(f"[konnected] ForumTopic count={ForumTopic.objects.count()}")
    print(f"[konnected] ForumPost count={ForumPost.objects.count()}")


# ---------------------------------------------------------------------
# Kreative
# ---------------------------------------------------------------------
def populate_kreative(users):
    # Tags
    tag_names = ["portrait", "abstract", "street", "landscape"]
    tags = []
    for n in tag_names:
        t, _ = KreativeTag.objects.get_or_create(name=n)
        tags.append(t)
    print(f"[kreative] Tag count={KreativeTag.objects.count()}")

    # Artworks
    artworks = []
    for i in range(3):
        a = KreativeArtwork.objects.create(
            artist=random.choice(users),
            title=faker.sentence(nb_words=4),
            description=faker.paragraph(nb_sentences=2),
            media_file=dummy_file(name=f"artwork_{i}.png"),
            media_type=KreativeArtwork.MediaType.IMAGE,
            year=timezone.now().year - i,
            medium="mixed media",
            style="experimental",
        )
        artworks.append(a)
    # Link tags via ArtworkTag
    for a in artworks:
        chosen = random.sample(tags, k=min(2, len(tags)))
        for t in chosen:
            ArtworkTag.objects.get_or_create(artwork=a, tag=t)
    print(f"[kreative] KreativeArtwork count={KreativeArtwork.objects.count()}")
    print(f"[kreative] ArtworkTag count={ArtworkTag.objects.count()}")

    # Galleries
    galleries = []
    for i in range(3):
        g = Gallery.objects.create(
            title=f"Gallery {i+1}",
            description=faker.paragraph(nb_sentences=2),
            created_by=random.choice(users),
            theme=random.choice(["Light", "Dark", "Colorful"]),
        )
        galleries.append(g)
    # Link artworks to galleries via GalleryArtwork
    for g in galleries:
        subset = random.sample(artworks, k=min(3, len(artworks)))
        for order, art in enumerate(subset):
            GalleryArtwork.objects.get_or_create(
                gallery=g,
                artwork=art,
                defaults={"order": order},
            )
    print(f"[kreative] Gallery count={Gallery.objects.count()}")
    print(f"[kreative] GalleryArtwork count={GalleryArtwork.objects.count()}")

    # Tradition entries
    for i in range(3):
        TraditionEntry.objects.create(
            title=f"Tradition {i+1}",
            description=faker.paragraph(nb_sentences=3),
            region=random.choice(["Europe", "Africa", "Asia", "Americas"]),
            media_file=dummy_file(name=f"tradition_{i}.png"),
            submitted_by=random.choice(users),
            approved=(i == 2),
            approved_by=random.choice(users),
            approved_at=timezone.now() if i == 2 else None,
        )
    print(f"[kreative] TraditionEntry count={TraditionEntry.objects.count()}")


# ---------------------------------------------------------------------
# Entry point for `python manage.py runscript populate_all_models`
# ---------------------------------------------------------------------
def run():
    print("=== Populating Konnaxion demo data ===")
    users = ensure_users(min_count=10)
    populate_kollective(users)
    populate_ethikos(users)
    populate_keenkonnect(users)
    populate_konnected(users)
    populate_kreative(users)
    print("=== Done. ===")
