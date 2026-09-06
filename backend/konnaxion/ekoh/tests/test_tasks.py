from konnaxion.ekoh.tasks import contextual_analysis_batch, recalc_all_scores


def test_ekoh_task_names():
    assert contextual_analysis_batch.name == "contextual_analysis_batch"
    assert recalc_all_scores.name == "ekoh_score_recalc"
