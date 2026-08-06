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
from app.schemas.mq_messages import (
    ResumeAnalysisCompleted,
    ResumeAnalysisFailed,
)

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
        try:
            payload = json.loads(body)
            request = EvaluationRequest.model_validate(payload)
            
            logger.info(f"Processing AI Evaluation for application {request.application_id}")
            
            # Evaluate Candidate against Job
            result: EvaluationResponse = self.engine.evaluate(request)
            
            # Publish Completed
            completed_payload = {
                "applicationId": request.application_id,
                "status": "COMPLETED",
                "result": result.model_dump(mode="json"),
                "completedAt": datetime.now(timezone.utc).isoformat()
            }
            
            channel.basic_publish(
                exchange=settings.rabbitmq_exchange,
                routing_key="evaluation.completed",
                body=json.dumps(completed_payload),
                properties=pika.BasicProperties(
                    delivery_mode=2,
                    content_type="application/json",
                ),
            )
            channel.basic_ack(delivery_tag=method.delivery_tag)
            
        except Exception as exc:
            logger.error(f"AI Evaluation failed: {exc}")
            
            # Publish Failed
            failed_payload = {
                "applicationId": payload.get("applicationId", "UNKNOWN"),
                "status": "FAILED",
                "error": str(exc),
                "failedAt": datetime.now(timezone.utc).isoformat()
            }
            
            try:
                channel.basic_publish(
                    exchange=settings.rabbitmq_exchange,
                    routing_key="evaluation.failed",
                    body=json.dumps(failed_payload),
                    properties=pika.BasicProperties(
                        delivery_mode=2,
                        content_type="application/json",
                    ),
                )
                channel.basic_ack(delivery_tag=method.delivery_tag)
            except Exception:
                channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


def start_evaluation_worker() -> None:
    logger.info("Starting AI evaluation worker")
    connection = _get_connection()
    channel = connection.channel()
    channel.confirm_delivery()
    
    # Topology should be declared by backend or resume_worker, but we can declare it here too if needed
    # Assuming backend already declared it.
    
    channel.basic_qos(prefetch_count=1)

    engine = MatchingEngine()
    consumer = EvaluationConsumer(engine)
    
    channel.basic_consume(
        queue="evaluation_queue",
        on_message_callback=consumer.process_message,
        auto_ack=False,
    )

    logger.info("Worker listening on queue 'evaluation_queue'")
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
