import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model

from konnaxion.ekoh.models.taxonomy import ExpertiseCategory
from konnaxion.ekoh.services.multidimensional_scoring import (
    compute_user_domain_score,
)

User = get_user_model()


@pytest.mark.django_db
def test_compute_user_domain_score_stub():
    """With stub metrics (all 0), weighted score should be 0."""
    user = User.objects.create(username="bob")
    domain = ExpertiseCategory.objects.create(code="02", name="Stub", depth=0, path="02")

    score = compute_user_domain_score(
        user_id=user.pk,
        domain=domain,
        metrics={"quality": 0, "expertise": 0, "frequency": 0},
    )
    assert score == Decimal("0.0000")

    # DB persistence check
    user_score = domain.userexpertisescore_set.get(user=user)
    assert user_score.weighted_score == Decimal("0.0000")
