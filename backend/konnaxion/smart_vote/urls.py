"""
Smart-Vote route entrypoint.

Add to project urls.py:

    path("api/v1/smart-vote/", include("konnaxion.smart_vote.urls"))
"""

from django.urls import path
from konnaxion.smart_vote.views.cast import CastBallotView
from konnaxion.smart_vote.views.reading import EthikosTopicReadingView

app_name = "smart_vote"

urlpatterns = [
    path("cast/", CastBallotView.as_view(), name="cast"),
    path(
        "readings/ethikos-topic/<int:topic_id>/",
        EthikosTopicReadingView.as_view(),
        name="ethikos-topic-reading",
    ),
]
