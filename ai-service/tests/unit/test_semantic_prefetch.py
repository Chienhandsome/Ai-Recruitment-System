from app.schemas.matching import EvaluationRequest
from app.services.matching.generic_matcher import generic_matching_engine
from app.services.matching.semantic import semantic_matcher
from tests.fixtures.payload_factory import make_evaluation_payload


def test_evaluation_prefetches_semantic_texts_once(monkeypatch):
    batches: list[list[str]] = []

    monkeypatch.setattr(
        semantic_matcher,
        "prefetch",
        lambda texts: batches.append(list(texts)),
    )
    monkeypatch.setattr(semantic_matcher, "clear_cache", lambda: None)
    monkeypatch.setattr(
        semantic_matcher,
        "compute_similarity",
        lambda text1, text2: 0.5,
    )
    monkeypatch.setattr(
        semantic_matcher,
        "compute_best_similarity",
        lambda target, candidates: 0.5,
    )

    request = EvaluationRequest.model_validate(make_evaluation_payload())
    generic_matching_engine.evaluate(request.candidate_profile, request.job)

    assert len(batches) == 1
    assert request.job.title in batches[0]
    assert len(batches[0]) > 2
