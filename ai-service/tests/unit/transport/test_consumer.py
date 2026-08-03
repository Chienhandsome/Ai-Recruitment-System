import json
from types import SimpleNamespace

from app.core.config import Settings
from app.domain.resume.exceptions import TransientError
from app.schemas.llm_output import ResumeExtractionResult
from app.transport.rabbitmq.consumer import ResumeMessageConsumer
from app.transport.rabbitmq.retry_policy import RetryPolicy


class FakeChannel:
    def __init__(self) -> None:
        self.published = []
        self.acked = []
        self.nacked = []

    def basic_publish(self, **kwargs):
        self.published.append(kwargs)
        return True

    def basic_ack(self, **kwargs):
        self.acked.append(kwargs)

    def basic_nack(self, **kwargs):
        self.nacked.append(kwargs)


class SuccessfulPipeline:
    def run(self, command):
        return ResumeExtractionResult(summary=f"parsed {command.resume_id}")


class TransientPipeline:
    def run(self, command):
        raise TransientError(f"temporary failure for {command.resume_id}")


def request_body() -> bytes:
    return json.dumps(
        {
            "resumeId": "resume",
            "candidateProfileId": "candidate",
            "objectPath": "candidate/resume.pdf",
            "mimeType": "application/pdf",
            "originalFileName": "resume.pdf",
            "requestedAt": "2026-08-03T00:00:00Z",
        }
    ).encode()


def test_success_is_published_before_delivery_is_acked():
    channel = FakeChannel()
    consumer = ResumeMessageConsumer(SuccessfulPipeline(), Settings())

    consumer.process_message(
        channel,
        SimpleNamespace(delivery_tag=1),
        SimpleNamespace(headers={}),
        request_body(),
    )

    assert channel.published[0]["routing_key"] == "resume.analysis.completed"
    assert channel.acked == [{"delivery_tag": 1}]
    assert channel.nacked == []


def test_transient_failure_is_republished_with_bounded_retry_header():
    channel = FakeChannel()
    consumer = ResumeMessageConsumer(
        TransientPipeline(),
        Settings(),
        retry_policy=RetryPolicy(max_retries=3, base_delay_seconds=0),
        sleeper=lambda _: None,
    )

    consumer.process_message(
        channel,
        SimpleNamespace(delivery_tag=2),
        SimpleNamespace(headers={}),
        request_body(),
    )

    retry = channel.published[0]
    assert retry["routing_key"] == "resume.analysis.requested"
    assert retry["properties"].headers["x-retry-count"] == 1
    assert channel.acked == [{"delivery_tag": 2}]


def test_malformed_message_is_explicitly_dead_lettered():
    channel = FakeChannel()
    consumer = ResumeMessageConsumer(SuccessfulPipeline(), Settings())

    consumer.process_message(
        channel,
        SimpleNamespace(delivery_tag=3),
        SimpleNamespace(headers={}),
        b"[]",
    )

    assert channel.published[0]["exchange"] == "ai_recruitment_dlx"
    assert channel.published[0]["routing_key"] == "resume.analysis.dead"
    assert channel.acked == [{"delivery_tag": 3}]
