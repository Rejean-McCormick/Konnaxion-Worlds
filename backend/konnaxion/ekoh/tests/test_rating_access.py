from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework.test import APIClient

from konnaxion.ekoh.db import ekoh_smartvote_db_scope
from konnaxion.ekoh.models.access import (
    RatingAccessGrant,
    RatingAccessScope,
    RatingScopeSubject,
    RatingVisibilitySetting,
)
from konnaxion.ekoh.models.scores import UserEthicsScore, UserExpertiseScore
from konnaxion.ekoh.models.taxonomy import ExpertiseCategory
from konnaxion.ekoh.services.rating_access import resolve_rating_access

User = get_user_model()


@pytest.fixture
def org_graph(db):
    boss = User.objects.create(username="boss")
    supervisor_a = User.objects.create(username="supervisor_a")
    employee_a = User.objects.create(username="employee_a")
    employee_b = User.objects.create(username="employee_b")

    with ekoh_smartvote_db_scope():
        company = RatingAccessScope.objects.create(key="acme", name="ACME", scope_type="organisation")
        dept_a = RatingAccessScope.objects.create(
            key="acme-department-a", name="Department A", scope_type="department", parent=company
        )
        dept_b = RatingAccessScope.objects.create(
            key="acme-department-b", name="Department B", scope_type="department", parent=company
        )

        RatingScopeSubject.objects.create(scope=dept_a, user=employee_a)
        RatingScopeSubject.objects.create(scope=dept_b, user=employee_b)
        RatingVisibilitySetting.objects.create(user=employee_a, visibility="scoped")
        RatingVisibilitySetting.objects.create(user=employee_b, visibility="scoped")

        RatingAccessGrant.objects.create(
            viewer=boss,
            scope=company,
            include_descendants=True,
            access_level="history",
        )
        RatingAccessGrant.objects.create(
            viewer=supervisor_a,
            scope=dept_a,
            include_descendants=True,
            access_level="ratings",
        )
    return boss, supervisor_a, employee_a, employee_b


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
def test_public_rating_policy_is_readable_by_anonymous():
    subject = User.objects.create(username="public_figure")
    with ekoh_smartvote_db_scope():
        RatingVisibilitySetting.objects.create(
            user=subject,
            visibility="public",
            publication_basis="Public role",
        )
    decision = resolve_rating_access(viewer=AnonymousUser(), subject=subject)
    assert decision.allowed is True
    assert decision.level == "ratings"
    assert decision.reason == "public_policy"


@pytest.mark.django_db
def test_self_gets_history_even_when_private():
    subject = User.objects.create(username="private_user")
    with ekoh_smartvote_db_scope():
        RatingVisibilitySetting.objects.create(user=subject, visibility="private")
    decision = resolve_rating_access(viewer=subject, subject=subject)
    assert decision.allowed is True
    assert decision.level == "history"
    assert decision.reason == "self"


@pytest.mark.django_db
def test_company_grant_reaches_all_descendant_departments(org_graph):
    boss, _supervisor_a, employee_a, employee_b = org_graph
    for subject in (employee_a, employee_b):
        decision = resolve_rating_access(viewer=boss, subject=subject)
        assert decision.allowed is True
        assert decision.level == "history"
        assert decision.reason == "scope_grant"
        assert decision.scope_key == "acme"


@pytest.mark.django_db
def test_department_supervisor_only_sees_own_department(org_graph):
    _boss, supervisor_a, employee_a, employee_b = org_graph
    allowed = resolve_rating_access(viewer=supervisor_a, subject=employee_a)
    denied = resolve_rating_access(viewer=supervisor_a, subject=employee_b)

    assert allowed.allowed is True
    assert allowed.level == "ratings"
    assert allowed.scope_key == "acme-department-a"
    assert denied.allowed is False
    assert denied.reason == "outside_authorized_scope"


@pytest.mark.django_db
def test_private_policy_does_not_accept_scope_grant(org_graph):
    boss, _supervisor_a, employee_a, _employee_b = org_graph
    with ekoh_smartvote_db_scope():
        visibility = RatingVisibilitySetting.objects.get(user=employee_a)
        visibility.visibility = "private"
        visibility.save(update_fields=["visibility", "updated_at"])

    decision = resolve_rating_access(viewer=boss, subject=employee_a)
    assert decision.allowed is False
    assert decision.reason == "private_policy"


@pytest.mark.django_db
def test_profile_payload_redacts_scores_without_access(api_client):
    viewer = User.objects.create(username="viewer")
    subject = User.objects.create(username="scoped_subject", name="Scoped Subject")
    with ekoh_smartvote_db_scope():
        RatingVisibilitySetting.objects.create(user=subject, visibility="scoped")
        category = ExpertiseCategory.objects.create(code="0613", name="Software", depth=0, path="0613")
        UserExpertiseScore.objects.create(
            user=subject,
            category=category,
            raw_score=Decimal("0.9000"),
            weighted_score=Decimal("0.9000"),
        )
        UserEthicsScore.objects.create(user=subject, ethical_score=Decimal("1.000"))

    api_client.force_authenticate(viewer)
    response = api_client.get(f"/api/v1/ekoh/profile/{subject.pk}/")
    assert response.status_code == 200
    payload = response.json()
    assert payload["rating_access"]["allowed"] is False
    assert payload["expertise"] is None
    assert payload["ethics_score"] is None


@pytest.mark.django_db
def test_profile_payload_exposes_public_scores(api_client):
    subject = User.objects.create(username="public_subject", name="Public Subject")
    with ekoh_smartvote_db_scope():
        RatingVisibilitySetting.objects.create(
            user=subject,
            visibility="public",
            publication_basis="Public accountability",
        )
        category = ExpertiseCategory.objects.create(code="0312", name="Politics", depth=0, path="0312")
        UserExpertiseScore.objects.create(
            user=subject,
            category=category,
            raw_score=Decimal("0.8000"),
            weighted_score=Decimal("0.8000"),
        )
        UserEthicsScore.objects.create(user=subject, ethical_score=Decimal("1.000"))

    response = api_client.get(f"/api/v1/ekoh/profile/{subject.pk}/")
    assert response.status_code == 200
    payload = response.json()
    assert payload["rating_visibility"] == "public"
    assert payload["rating_access"]["allowed"] is True
    assert payload["rating_access"]["level"] == "ratings"
    assert payload["expertise"][0]["domain_code"] == "0312"

@pytest.mark.django_db
def test_profile_display_name_never_serializes_none_none(api_client):
    subject = User.objects.create(username="fallback_subject", name="")
    with ekoh_smartvote_db_scope():
        RatingVisibilitySetting.objects.create(user=subject, visibility="public")

    response = api_client.get(f"/api/v1/ekoh/profile/{subject.pk}/")
    assert response.status_code == 200
    assert response.json()["display_name"] == "fallback_subject"

