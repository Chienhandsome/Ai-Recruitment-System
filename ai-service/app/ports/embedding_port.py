"""Port for text embedding providers used by the matching domain."""

from typing import Protocol


class EmbeddingProviderError(RuntimeError):
    """Raised when an embedding provider cannot return a valid response."""


class EmbeddingProvider(Protocol):
    def embed(self, texts: list[str]) -> list[list[float]]:
        """Return one embedding vector for every input text."""
