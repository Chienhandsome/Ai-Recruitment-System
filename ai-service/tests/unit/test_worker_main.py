import worker_main


def test_worker_entrypoint_starts_resume_and_evaluation_consumers():
    worker_names = {name for name, _target in worker_main.WORKER_TARGETS}

    assert worker_names == {"resume-analysis", "application-evaluation"}
