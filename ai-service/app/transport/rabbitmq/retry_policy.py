"""Retry classification and exponential-backoff policy."""

from dataclasses import dataclass

from app.domain.resume.exceptions import TransientError


@dataclass(frozen=True)
class RetryDecision:
    should_retry: bool
    next_attempt: int
    delay_seconds: int


class RetryPolicy:
    def __init__(self, max_retries: int = 3, base_delay_seconds: int = 5) -> None:
        self._max_retries = max_retries
        self._base_delay_seconds = base_delay_seconds

    def decide(self, error: Exception, retry_count: int) -> RetryDecision:
        should_retry = (
            isinstance(error, TransientError) and retry_count < self._max_retries
        )
        return RetryDecision(
            should_retry=should_retry,
            next_attempt=retry_count + 1,
            delay_seconds=(
                self._base_delay_seconds * (2**retry_count) if should_retry else 0
            ),
        )

    @staticmethod
    def count_from_headers(headers: dict | None) -> int:
        if not headers:
            return 0
        try:
            return max(0, int(headers.get("x-retry-count", 0)))
        except (TypeError, ValueError):
            return 0
