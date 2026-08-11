"""Modal deployment for the recruitment embedding model.

Development smoke test:
    python -m modal run modal_embedding_app.py

Production deployment:
    python -m modal deploy modal_embedding_app.py
"""

from __future__ import annotations

import modal


APP_NAME = "ai-recruitment-embedder"
MODEL_ID = "XuanTruong03/ai-recruitment-embedder-v2"
MODEL_REVISION = "62326063403466c374e0a70a438385fa035ef41b"
MODEL_DIR = "/opt/models/ai-recruitment-embedder-v2"
MAX_BATCH_SIZE = 128


def download_model() -> None:
    """Bake the pinned Hugging Face model into the Modal image."""
    from huggingface_hub import snapshot_download

    snapshot_download(
        repo_id=MODEL_ID,
        revision=MODEL_REVISION,
        local_dir=MODEL_DIR,
    )


image = (
    modal.Image.debian_slim(python_version="3.11")
    .uv_pip_install(
        "torch==2.13.0+cpu",
        index_url="https://download.pytorch.org/whl/cpu",
    )
    .uv_pip_install(
        "fastapi[standard]>=0.115,<1",
        "sentence-transformers==5.7.0",
    )
    .run_function(download_model)
)

app = modal.App(APP_NAME, image=image)


with image.imports():
    from pydantic import BaseModel, Field
    from sentence_transformers import SentenceTransformer


class EmbeddingRequest(BaseModel):
    texts: list[str] = Field(min_length=1, max_length=MAX_BATCH_SIZE)


class EmbeddingResponse(BaseModel):
    model: str
    revision: str
    dimension: int
    embeddings: list[list[float]]


@app.cls(
    cpu=4.0,
    memory=8192,
    min_containers=0,
    max_containers=3,
    scaledown_window=300,
    timeout=300,
)
@modal.concurrent(max_inputs=4)
class Embedder:
    @modal.enter()
    def load_model(self) -> None:
        self.model = SentenceTransformer(MODEL_DIR, device="cpu")

    def _encode(self, texts: list[str]) -> EmbeddingResponse:
        cleaned_texts = [text.strip() for text in texts]
        if any(not text for text in cleaned_texts):
            raise ValueError("Embedding texts must not be blank")

        vectors = self.model.encode(
            cleaned_texts,
            batch_size=min(32, len(cleaned_texts)),
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )

        return EmbeddingResponse(
            model=MODEL_ID,
            revision=MODEL_REVISION,
            dimension=int(vectors.shape[1]),
            embeddings=vectors.tolist(),
        )

    @modal.method()
    def encode(self, texts: list[str]) -> dict:
        """Private Modal RPC used by the local smoke test."""
        return self._encode(texts).model_dump()

    @modal.fastapi_endpoint(
        method="POST",
        label="embed",
        docs=False,
        requires_proxy_auth=True,
    )
    def embed(self, request: EmbeddingRequest) -> EmbeddingResponse:
        """Authenticated HTTP batch-embedding endpoint."""
        return self._encode(request.texts)


@app.local_entrypoint()
def smoke_test() -> None:
    response = Embedder().encode.remote(
        texts=[
            "Backend developer with NestJS and PostgreSQL experience",
            "Software engineer building REST APIs with Node.js and SQL",
        ]
    )
    print(
        {
            "model": response["model"],
            "revision": response["revision"],
            "dimension": response["dimension"],
            "embedding_count": len(response["embeddings"]),
        }
    )
