"""Authenticated HTTP adapter for the Modal embedding Web Function."""

from __future__ import annotations

import math

import httpx

from app.ports.embedding_port import EmbeddingProviderError

MAX_MODAL_BATCH_SIZE = 128


class ModalEmbeddingClient:
    def __init__(
        self,
        endpoint_url: str,
        token_id: str,
        token_secret: str,
        timeout_seconds: float = 300.0,
        client: httpx.Client | None = None,
    ) -> None:
        if not endpoint_url.strip():
            raise EmbeddingProviderError("MODAL_EMBEDDING_URL is required")
        if not token_id.strip() or not token_secret.strip():
            raise EmbeddingProviderError("Modal proxy token ID and secret are required")

        self._endpoint_url = endpoint_url.rstrip("/")
        self._headers = {
            "Modal-Key": token_id,
            "Modal-Secret": token_secret,
        }
        self._client = client or httpx.Client(timeout=timeout_seconds)

    def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        embeddings: list[list[float]] = []
        for start in range(0, len(texts), MAX_MODAL_BATCH_SIZE):
            batch = texts[start : start + MAX_MODAL_BATCH_SIZE]
            embeddings.extend(self._embed_batch(batch))
        return embeddings

    def _embed_batch(self, texts: list[str]) -> list[list[float]]:
        try:
            response = self._client.post(
                self._endpoint_url,
                headers=self._headers,
                json={"texts": texts},
            )
            response.raise_for_status()
            payload = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise EmbeddingProviderError(
                f"Modal embedding request failed: {exc}"
            ) from exc

        raw_embeddings = payload.get("embeddings")
        dimension = payload.get("dimension")
        if not isinstance(raw_embeddings, list) or len(raw_embeddings) != len(texts):
            raise EmbeddingProviderError(
                "Modal returned a different number of embeddings than requested"
            )
        if not isinstance(dimension, int) or dimension <= 0:
            raise EmbeddingProviderError(
                "Modal returned an invalid embedding dimension"
            )

        embeddings: list[list[float]] = []
        for raw_vector in raw_embeddings:
            if not isinstance(raw_vector, list) or len(raw_vector) != dimension:
                raise EmbeddingProviderError(
                    "Modal returned an invalid embedding vector"
                )
            try:
                vector = [float(value) for value in raw_vector]
            except (TypeError, ValueError) as exc:
                raise EmbeddingProviderError(
                    "Modal returned a non-numeric embedding vector"
                ) from exc
            if not all(math.isfinite(value) for value in vector):
                raise EmbeddingProviderError(
                    "Modal returned a non-finite embedding vector"
                )
            embeddings.append(vector)

        return embeddings
