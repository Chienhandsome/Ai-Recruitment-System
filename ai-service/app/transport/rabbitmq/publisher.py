"""Persistent RabbitMQ result publishing."""

import json

import pika

from app.domain.resume.exceptions import TransientError


class RabbitMQPublisher:
    def __init__(self, channel, exchange: str) -> None:
        self._channel = channel
        self._exchange = exchange

    def publish(self, routing_key: str, payload: dict) -> None:
        try:
            self._channel.basic_publish(
                exchange=self._exchange,
                routing_key=routing_key,
                body=json.dumps(payload),
                properties=pika.BasicProperties(
                    delivery_mode=2,
                    content_type="application/json",
                ),
            )
        except Exception as exc:
            raise TransientError(
                f"Failed to publish RabbitMQ message to {routing_key}: {exc}"
            ) from exc
