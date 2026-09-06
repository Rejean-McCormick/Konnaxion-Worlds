from konnaxion.smart_vote.tasks import vote_aggregate, vote_result_aggregator


def test_smart_vote_task_names():
    assert vote_result_aggregator.name == "vote_result_aggregator"
    assert vote_aggregate.name == "vote_aggregate"
