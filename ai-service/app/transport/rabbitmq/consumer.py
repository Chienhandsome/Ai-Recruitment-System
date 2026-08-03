"""RabbitMQ delivery handling for the resume parsing pipeline."""

import json
import logging
import time
from datetime import datetime, timezone
from typing import Callable

import pika
from pydantic import ValidationError

from app.core.config import Settings
from app.domain.resume.exceptions import PermanentError, TransientError
from app.domain.resume.models import ResumeParseCommand
from app.domain.resume.pipeline import ResumeParsingPipeline
from app.schemas.mq_messages import (
    ResumeAnalysisCompleted,
    ResumeAnalysisFailed,
    ResumeAnalysisRequest,
)
from app.transport.rabbitmq.publisher import RabbitMQPublisher
from app.transport.rabbitmq.retry_policy import RetryPolicy

logger = logging.getLogger(__name__)


class ResumeMessageConsumer:
    def __init__(
        self,
        pipeline: ResumeParsingPipeline,
        settings: Settings,
        retry_policy: RetryPolicy | None = None,
        sleeper: Callable[[float], None] = time.sleep,
    ) -> None:
        self._pipeline = pipeline
        self._settings = settings
        self._retry_policy = retry_policy or RetryPolicy()
        self._sleeper = sleeper

    def process_message(self, channel, method, properties, body: bytes) -> None:
        request: ResumeAnalysisRequest | None = None
        raw_payload: dict = {}
        publisher = RabbitMQPublisher(channel, self._settings.rabbitmq_exchange)

        try:
            decoded_payload = json.loads(body)
            if not isinstance(decoded_payload, dict):
                raise PermanentError("Invalid request message: expected an object")
            raw_payload = decoded_payload
            request = ResumeAnalysisRequest.model_validate(raw_payload)
            result = self._pipeline.run(
                ResumeParseCommand(
                    resume_id=request.resume_id,
                    candidate_profile_id=request.candidate_profile_id,
                    object_path=request.object_path,
                    mime_type=request.mime_type,
                    original_file_name=request.original_file_name,
                    signed_download_url=request.signed_download_url,
                )
            )
            completed = ResumeAnalysisCompleted(
                resumeId=request.resume_id,
                candidateProfileId=request.candidate_profile_id,
                parsedData=result,
                completedAt=datetime.now(timezone.utc).isoformat(),
            )
            publisher.publish(
                self._settings.routing_key_completed,
                completed.model_dump(mode="json"),
            )
            channel.basic_ack(delivery_tag=method.delivery_tag)
            return
        except (json.JSONDecodeError, ValidationError) as exc:
            error: Exception = PermanentError(f"Invalid request message: {exc}")
        except Exception as exc:
            error = exc

        retry_count = self._retry_policy.count_from_headers(
            getattr(properties, "headers", None)
        )
        decision = self._retry_policy.decide(error, retry_count)
        if decision.should_retry:
            self._republish_for_retry(
                channel,
                method,
                properties,
                body,
                decision.next_attempt,
                decision.delay_seconds,
            )
            return

        logger.error(
            "Resume analysis permanently failed: %s",
            error,
            exc_info=(type(error), error, error.__traceback__),
        )
        resume_id = request.resume_id if request else raw_payload.get("resumeId")
        candidate_id = (
            request.candidate_profile_id
            if request
            else raw_payload.get("candidateProfileId")
        )
        if resume_id and candidate_id:
            failed = ResumeAnalysisFailed(
                resumeId=str(resume_id),
                candidateProfileId=str(candidate_id),
                errorMessage=str(error)[:500],
                failedAt=datetime.now(timezone.utc).isoformat(),
            )
            try:
                publisher.publish(
                    self._settings.routing_key_failed,
                    failed.model_dump(mode="json"),
                )
            except TransientError:
                channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
                return

        self._dead_letter(channel, method, properties, body)

    def _republish_for_retry(
        self,
        channel,
        method,
        properties,
        body: bytes,
        next_attempt: int,
        delay_seconds: int,
    ) -> None:
        logger.warning(
            "Retrying resume message (attempt %d) in %ds",
            next_attempt,
            delay_seconds,
        )
        self._sleeper(delay_seconds)
        headers = dict(getattr(properties, "headers", None) or {})
        headers["x-retry-count"] = next_attempt

        try:
            channel.basic_publish(
                exchange=self._settings.rabbitmq_exchange,
                routing_key=self._settings.routing_key_requested,
                body=body,
                properties=pika.BasicProperties(
                    delivery_mode=2,
                    content_type="application/json",
                    headers=headers,
                ),
            )
            channel.basic_ack(delivery_tag=method.delivery_tag)
        except Exception:
            channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

    def _dead_letter(self, channel, method, properties, body: bytes) -> None:
        headers = dict(getattr(properties, "headers", None) or {})
        headers["x-original-queue"] = self._settings.rabbitmq_queue
        try:
            channel.basic_publish(
                exchange=self._settings.rabbitmq_dead_letter_exchange,
                routing_key=self._settings.routing_key_dead,
                body=body,
                properties=pika.BasicProperties(
                    delivery_mode=2,
                    content_type="application/json",
                    headers=headers,
                ),
            )
            channel.basic_ack(delivery_tag=method.delivery_tag)
        except Exception:
            channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
