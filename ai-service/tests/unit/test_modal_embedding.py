import httpx
import pytest

from app.adapters.modal_embedding import ModalEmbeddingClient
from app.ports.embedding_port import EmbeddingProviderError


def make_client(handler) -> ModalEmbeddingClient:
    transport = httpx.MockTransport(handler)
    http_client = httpx.Client(transport=transport)
    return ModalEmbeddingClient(
        endpoint_url="https://example--embed.modal.run",
        token_id="wk-test",
        token_secret="ws-test",
        client=http_client,
    )


def test_modal_embedding_client_sends_proxy_auth_and_returns_vectors():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["Modal-Key"] == "wk-test"
        assert request.headers["Modal-Secret"] == "ws-test"
        return httpx.Response(
            200,
            json={
                "dimension": 2,
                "embeddings": [[0.6, 0.8], [1.0, 0.0]],
            },
        )

    result = make_client(handler).embed(["backend", "frontend"])

    assert result == [[0.6, 0.8], [1.0, 0.0]]


def test_modal_embedding_client_rejects_invalid_vector_count():
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={"dimension": 2, "embeddings": [[0.6, 0.8]]},
        )

    with pytest.raises(EmbeddingProviderError, match="different number"):
        make_client(handler).embed(["backend", "frontend"])
