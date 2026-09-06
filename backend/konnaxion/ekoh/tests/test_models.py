import pytest
from django.contrib.auth import get_user_model
from konnaxion.ekoh.models.taxonomy import ExpertiseCategory
from konnaxion.ekoh.models.scores import UserExpertiseScore

User = get_user_model()


@pytest.mark.django_db
def test_expertise_category_str():
    root = ExpertiseCategory.objects.create(
        code="00",
        name="Root Domain",
        depth=0,
        path="00",
    )
    assert str(root) == "00 • Root Domain"


@pytest.mark.django_db
def test_user_expertise_unique():
    user = User.objects.create(username="alice")
    domain = ExpertiseCategory.objects.create(code="01", name="Demo", depth=0, path="01")
    UserExpertiseScore.objects.create(
        user=user, category=domain, raw_score=10, weighted_score=5
    )
    with pytest.raises(Exception):
        # should violate unique_together
        UserExpertiseScore.objects.create(
            user=user, category=domain, raw_score=1, weighted_score=1
        )
