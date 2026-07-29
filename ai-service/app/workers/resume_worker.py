"""RabbitMQ worker that consumes resume analysis requests and publishes results."""

import json
import logging
import time
from datetime import datetime, timezone

import pika
from pika.exceptions import AMQPConnectionError

from app.core.config import settings
from app.schemas.resume_schemas import (
    ResumeAnalysisCompleted,
    ResumeAnalysisFailed,
    ResumeAnalysisRequest,
)
from app.services.resume_parser import parse_resume

logger = logging.getLogger(__name__)


def _get_connection() -> pika.BlockingConnection:
    """Create a RabbitMQ connection with retry logic."""
    max_retries = 5
    retry_delay = 5

    for attempt in range(1, max_retries + 1):
        try:
            params = pika.URLParameters(settings.rabbitmq_url)
            params.heartbeat = 60
            params.blocked_connection_timeout = 300
            connection = pika.BlockingConnection(params)
            logger.info("Connected to RabbitMQ")
            return connection
        except AMQPConnectionError as e:
            if attempt < max_retries:
                logger.warning(
                    f"RabbitMQ connection attempt {attempt}/{max_retries} failed: {e}. "
                    f"Retrying in {retry_delay}s..."
                )
                time.sleep(retry_delay)
            else:
                logger.error(f"Failed to connect to RabbitMQ after {max_retries} attempts")
                raise


def _publish_result(channel, routing_key: str, payload: dict):
    """Publish a message to the exchange."""
    channel.basic_publish(
        exchange=settings.rabbitmq_exchange,
        routing_key=routing_key,
        body=json.dumps(payload),
        properties=pika.BasicProperties(
            delivery_mode=2,  # persistent
            content_type="application/json",
        ),
    )
    logger.info(f"Published message to '{routing_key}'")


def _process_message(channel, method, properties, body):
    """Process a single resume analysis request."""
    try:
        raw = json.loads(body)
        request = ResumeAnalysisRequest.model_validate(raw)

        logger.info(
            f"Processing resume: id={request.resume_id}, "
            f"file={request.original_file_name}"
        )

        # Run the parsing pipeline
        result = parse_resume(request)

        # Publish success
        completed = ResumeAnalysisCompleted(
            resumeId=request.resume_id,
            candidateProfileId=request.candidate_profile_id,
            parsedData=result,
            completedAt=datetime.now(timezone.utc).isoformat(),
        )

        _publish_result(
            channel,
            settings.routing_key_completed,
            completed.model_dump(mode="json"),
        )

        # Acknowledge the message
        channel.basic_ack(delivery_tag=method.delivery_tag)
        logger.info(f"Resume {request.resume_id} analysis completed successfully")

    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in message: {e}")
        # Reject malformed messages (don't requeue)
        channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    except Exception as e:
        logger.error(f"Resume analysis failed: {e}", exc_info=True)

        # Try to publish failure notification
        try:
            raw_data = json.loads(body)
            failed = ResumeAnalysisFailed(
                resumeId=raw_data.get("resumeId", "unknown"),
                candidateProfileId=raw_data.get("candidateProfileId", "unknown"),
                errorMessage=str(e)[:500],
                failedAt=datetime.now(timezone.utc).isoformat(),
            )
            _publish_result(
                channel,
                settings.routing_key_failed,
                failed.model_dump(mode="json"),
            )
        except Exception as pub_err:
            logger.error(f"Failed to publish failure notification: {pub_err}")

        # Acknowledge (don't requeue failed analysis — it will keep failing)
        channel.basic_ack(delivery_tag=method.delivery_tag)


def start_worker():
    """Start the RabbitMQ consumer loop."""
    logger.info("Starting resume analysis worker...")

    connection = _get_connection()
    channel = connection.channel()

    # Declare exchange
    channel.exchange_declare(
        exchange=settings.rabbitmq_exchange,
        exchange_type="topic",
        durable=True,
    )

    # Declare queue
    channel.queue_declare(queue=settings.rabbitmq_queue, durable=True)

    # Bind queue to exchange with routing key
    channel.queue_bind(
        exchange=settings.rabbitmq_exchange,
        queue=settings.rabbitmq_queue,
        routing_key=settings.routing_key_requested,
    )

    # Only process 1 message at a time (important for CPU-intensive LLM calls)
    channel.basic_qos(prefetch_count=1)

    # Start consuming
    channel.basic_consume(
        queue=settings.rabbitmq_queue,
        on_message_callback=_process_message,
        auto_ack=False,
    )

    logger.info(
        f"Worker listening on queue '{settings.rabbitmq_queue}' "
        f"(routing_key: '{settings.routing_key_requested}')"
    )

    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        logger.info("Worker stopped by user")
        channel.stop_consuming()
    finally:
        connection.close()
        logger.info("RabbitMQ connection closed")
