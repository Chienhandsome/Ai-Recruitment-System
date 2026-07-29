# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
from app.services.matching.semantic import SemanticMatcher


@pytest.mark.slow
@pytest.mark.integration
def test_real_sentence_transformer_similarity():
    """
    Integration test using real SentenceTransformer('all-MiniLM-L6-v2') local model.
    Validates semantic similarity between related tech descriptions vs. unrelated topics.
    """
    matcher = SemanticMatcher(model_name="all-MiniLM-L6-v2")
    matcher.initialize()

    text_target = "Junior Backend Developer with NestJS and PostgreSQL REST API experience"
    text_related = "Backend Engineer developing scalable RESTful web microservices using NestJS and SQL"
    text_unrelated = "Senior Financial Accountant managing monthly balance sheets and audit tax reports"

    sim_related = matcher.compute_similarity(text_target, text_related)
    sim_unrelated = matcher.compute_similarity(text_target, text_unrelated)

    assert 0.0 <= sim_related <= 1.0
    assert 0.0 <= sim_unrelated <= 1.0
    assert sim_related > sim_unrelated, f"Expected related sim ({sim_related:.3f}) > unrelated sim ({sim_unrelated:.3f})"
