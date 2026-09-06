# FILE: backend/tests/test_smoke_platform.py
# tests/test_smoke_platform.py
import json
import pytest
from django.urls import reverse
from konnaxion.users.models import User

from konnaxion.ethikos.models import EthikosCategory, EthikosTopic
from konnaxion.users.tasks import get_users_count

@pytest.mark.django_db
def test_platform_smoke(client, admin_client, settings):
    # 0) Admin and anonymous access to API docs
    assert client.get(reverse("api-docs")).status_code == 403  # anonymous
    assert admin_client.get(reverse("api-docs")).status_code == 200  # admin

    # 1) Users: /api/users/me/
    r = admin_client.get(reverse("api:user-me"))
    assert r.status_code == 200
    me = r.json()
    assert "username" in me and me["username"]

    # 2) Ethikos: create fixtures via ORM, then read via API
    admin = User.objects.get(username="admin")
    cat = EthikosCategory.objects.create(name="General", description="g")
    topic = EthikosTopic.objects.create(
        title="Is AI beneficial?",
        description="debate",
        category=cat,
        created_by=admin,
    )
    r = admin_client.get(reverse("api:ethikos-topic-list"))
    assert r.status_code == 200
    assert any(row["title"] == topic.title for row in r.json())

    # 2b) Ethikos stance: POST within allowed range [-3, 3]
    r = admin_client.post(
        reverse("api:ethikos-stance-list"),
        data=json.dumps({"topic": topic.id, "value": 2}),
        content_type="application/json",
    )
    assert r.status_code in (200, 201)

    # 2c) Ethikos argument: POST a pro argument
    r = admin_client.post(
        reverse("api:ethikos-argument-list"),
        data=json.dumps({"topic": topic.id, "content": "Pro argument", "side": "pro"}),
        content_type="application/json",
    )
    assert r.status_code in (200, 201)

    # 3) KonnectED: create a knowledge resource (author set by view)
    r = admin_client.post(
        reverse("api:konnected-resource-list"),
        data=json.dumps({"title": "Doc 1", "type": "doc", "url": "https://example.com/doc"}),
        content_type="application/json",
    )
    assert r.status_code in (200, 201)

    # 4) Kollective Intelligence: create a vote
    r = admin_client.post(
        reverse("api:kollective-vote-list"),
        data=json.dumps({
            "target_type": "ethikos_topic",
            "target_id": topic.id,
            "raw_value": "1.000",
            "weighted_value": "1.000",
        }),
        content_type="application/json",
    )
    assert r.status_code in (200, 201)

    # 5) Kreative: create a gallery (no file upload)
    r = admin_client.post(
        reverse("api:kreative-gallery-list"),
        data=json.dumps({"title": "G1", "description": ""}),
        content_type="application/json",
    )
    assert r.status_code in (200, 201)

    # 6) Celery task runs eagerly
    settings.CELERY_TASK_ALWAYS_EAGER = True
    res = get_users_count.delay()
    assert res.result == User.objects.count()
