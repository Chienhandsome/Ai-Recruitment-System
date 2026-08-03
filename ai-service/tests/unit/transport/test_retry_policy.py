from app.domain.resume.exceptions import PermanentError, TransientError
from app.transport.rabbitmq.retry_policy import RetryPolicy


def test_transient_errors_use_bounded_exponential_backoff():
    policy = RetryPolicy(max_retries=3, base_delay_seconds=5)

    assert policy.decide(TransientError("timeout"), 0).delay_seconds == 5
    assert policy.decide(TransientError("timeout"), 1).delay_seconds == 10
    assert policy.decide(TransientError("timeout"), 2).delay_seconds == 20
    assert not policy.decide(TransientError("timeout"), 3).should_retry


def test_permanent_errors_are_not_retried():
    decision = RetryPolicy().decide(PermanentError("bad document"), 0)
    assert not decision.should_retry
