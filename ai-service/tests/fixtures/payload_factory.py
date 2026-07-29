from typing import Any, Dict, Optional
import uuid
# pyrefly: ignore [missing-import]
from tests.fixtures.candidate_factory import make_candidate_profile
# pyrefly: ignore [missing-import]
from tests.fixtures.job_factory import make_job, make_weights


def make_evaluation_payload(
    candidate_profile: Optional[Dict[str, Any]] = None,
    job: Optional[Dict[str, Any]] = None,
    weights: Optional[Dict[str, float]] = None,
    application_id: Optional[str] = None,
) -> Dict[str, Any]:
    return {
        "application_id": application_id or str(uuid.uuid4()),
        "candidate_profile": candidate_profile or make_candidate_profile(),
        "job": job or make_job(),
        "weights": weights or make_weights(),
    }
