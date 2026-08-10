"""Worker bootstrap: RabbitMQ connection for AI Evaluation (Job Matching)."""

import json
import logging
import time
from datetime import datetime, timezone

import pika
from pika.exceptions import AMQPConnectionError

from app.core.config import settings
from app.schemas.matching import EvaluationRequest, EvaluationResponse
from app.services.matching.matching_engine import MatchingEngine

logger = logging.getLogger(__name__)


def _get_connection() -> pika.BlockingConnection:
    max_retries = 5
    retry_delay = 5

    for attempt in range(1, max_retries + 1):
        try:
            params = pika.URLParameters(settings.rabbitmq_url)
            params.heartbeat = 60
            params.blocked_connection_timeout = 300
            connection = pika.BlockingConnection(params)
            logger.info("Connected to RabbitMQ for Evaluation Worker")
            return connection
        except AMQPConnectionError:
            if attempt == max_retries:
                raise
            logger.warning(
                "RabbitMQ connection attempt %d/%d failed; retrying in %ds",
                attempt,
                max_retries,
                retry_delay,
            )
            time.sleep(retry_delay)

    raise RuntimeError("RabbitMQ connection retry loop exited unexpectedly")


class EvaluationConsumer:
    def __init__(self, engine: MatchingEngine):
        self.engine = engine

    def process_message(self, channel, method, properties, body: bytes) -> None:
        application_id = "UNKNOWN"
        try:
            payload = json.loads(body)
            request = EvaluationRequest.model_validate(payload)
            application_id = request.application_id

            logger.info(
                "Processing AI Evaluation for application %s", application_id
            )

            # Evaluate Candidate against Job
            result: EvaluationResponse = self.engine.evaluate(request)

            # Publish Completed
            completed_payload = {
                "applicationId": application_id,
                "status": "COMPLETED",
                "result": result.model_dump(mode="json"),
                "completedAt": datetime.now(timezone.utc).isoformat(),
            }

            channel.basic_publish(
                exchange=settings.rabbitmq_exchange,
                routing_key=settings.evaluation_routing_key_completed,
                body=json.dumps(completed_payload),
                properties=pika.BasicProperties(
                    delivery_mode=2,
                    content_type="application/json",
                ),
            )
            channel.basic_ack(delivery_tag=method.delivery_tag)

        except Exception as exc:
            logger.exception(
                "AI Evaluation failed for application %s: %s",
                application_id,
                exc,
            )

            # Publish Failed
            failed_payload = {
                "applicationId": application_id,
                "status": "FAILED",
                "error": str(exc),
                "failedAt": datetime.now(timezone.utc).isoformat(),
            }

            try:
                channel.basic_publish(
                    exchange=settings.rabbitmq_exchange,
                    routing_key=settings.evaluation_routing_key_failed,
                    body=json.dumps(failed_payload),
                    properties=pika.BasicProperties(
                        delivery_mode=2,
                        content_type="application/json",
                    ),
                )
                channel.basic_ack(delivery_tag=method.delivery_tag)
            except Exception:
                channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


def _declare_topology(channel) -> None:
    channel.exchange_declare(
        exchange=settings.rabbitmq_exchange,
        exchange_type="topic",
        durable=True,
    )
    channel.exchange_declare(
        exchange=settings.rabbitmq_dead_letter_exchange,
        exchange_type="topic",
        durable=True,
    )

    channel.queue_declare(
        queue=settings.evaluation_queue,
        durable=True,
    )
    channel.queue_bind(
        exchange=settings.rabbitmq_exchange,
        queue=settings.evaluation_queue,
        routing_key=settings.evaluation_routing_key_requested,
    )

    channel.queue_declare(
        queue=settings.evaluation_result_queue,
        durable=True,
    )
    for routing_key in (
        settings.evaluation_routing_key_completed,
        settings.evaluation_routing_key_failed,
    ):
        channel.queue_bind(
            exchange=settings.rabbitmq_exchange,
            queue=settings.evaluation_result_queue,
            routing_key=routing_key,
        )

    channel.queue_declare(
        queue=settings.evaluation_dead_letter_queue,
        durable=True,
    )
    channel.queue_bind(
        exchange=settings.rabbitmq_dead_letter_exchange,
        queue=settings.evaluation_dead_letter_queue,
        routing_key=settings.evaluation_routing_key_dead,
    )


def start_evaluation_worker() -> None:
    logger.info("Starting AI evaluation worker")
    connection = _get_connection()
    channel = connection.channel()
    channel.confirm_delivery()
    _declare_topology(channel)

    channel.basic_qos(prefetch_count=1)

    engine = MatchingEngine()
    consumer = EvaluationConsumer(engine)

    channel.basic_consume(
        queue=settings.evaluation_queue,
        on_message_callback=consumer.process_message,
        auto_ack=False,
    )

    logger.info("Worker listening on queue '%s'", settings.evaluation_queue)
    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        logger.info("Worker stopped by user")
        channel.stop_consuming()
    finally:
        connection.close()
        logger.info("RabbitMQ connection closed")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    start_evaluation_worker()
