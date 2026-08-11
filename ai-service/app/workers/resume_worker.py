"""Worker bootstrap: RabbitMQ connection and dependency composition only."""

import logging
import time

import pika
from pika.exceptions import AMQPConnectionError

from app.adapters.gemini_llm import GeminiLLMAdapter
from app.adapters.supabase_storage import SupabaseStorageAdapter
from app.core.config import settings
from app.domain.resume.pipeline import ResumeParsingPipeline
from app.transport.rabbitmq.consumer import ResumeMessageConsumer

logger = logging.getLogger(__name__)


def validate_worker_settings() -> None:
    required_settings = {
        "GEMINI_API_KEY": settings.gemini_api_key,
        "SUPABASE_URL": settings.supabase_url,
    }
    missing = [name for name, value in required_settings.items() if not value]
    if missing:
        raise RuntimeError(
            "Resume analysis worker cannot start. Missing required environment "
            f"variables: {', '.join(missing)}"
        )


def _get_connection() -> pika.BlockingConnection:
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
        queue=settings.rabbitmq_dead_letter_queue,
        durable=True,
    )
    channel.queue_bind(
        exchange=settings.rabbitmq_dead_letter_exchange,
        queue=settings.rabbitmq_dead_letter_queue,
        routing_key=settings.routing_key_dead,
    )

    result_queue = f"{settings.rabbitmq_queue}_results"
    channel.queue_declare(
        queue=result_queue,
        durable=True,
    )
    for routing_key in (
        settings.routing_key_completed,
        settings.routing_key_failed,
    ):
        channel.queue_bind(
            exchange=settings.rabbitmq_exchange,
            queue=result_queue,
            routing_key=routing_key,
        )

    channel.queue_declare(
        queue=settings.rabbitmq_queue,
        durable=True,
    )
    channel.queue_bind(
        exchange=settings.rabbitmq_exchange,
        queue=settings.rabbitmq_queue,
        routing_key=settings.routing_key_requested,
    )


def build_consumer() -> ResumeMessageConsumer:
    validate_worker_settings()
    pipeline = ResumeParsingPipeline(
        storage=SupabaseStorageAdapter.from_settings(),
        llm=GeminiLLMAdapter.from_settings(),
    )
    return ResumeMessageConsumer(pipeline, settings)


def start_worker() -> None:
    logger.info("Starting resume analysis worker")
    consumer = build_consumer()
    connection = _get_connection()
    channel = connection.channel()
    channel.confirm_delivery()
    _declare_topology(channel)
    channel.basic_qos(prefetch_count=1)

    channel.basic_consume(
        queue=settings.rabbitmq_queue,
        on_message_callback=consumer.process_message,
        auto_ack=False,
    )

    logger.info(
        "Worker listening on queue '%s' (%s)",
        settings.rabbitmq_queue,
        settings.routing_key_requested,
    )
    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        logger.info("Worker stopped by user")
        channel.stop_consuming()
    finally:
        connection.close()
        logger.info("RabbitMQ connection closed")
