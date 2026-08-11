import contextvars
import logging
import os
from typing import List, Optional

# pyrefly: ignore [missing-import]
import numpy as np

from app.adapters.modal_embedding import ModalEmbeddingClient
from app.core.config import settings
from app.ports.embedding_port import EmbeddingProviderError

logger = logging.getLogger("ai_matching.semantic")


class SemanticMatcher:
    """Compute semantic similarity with local or Modal-hosted embeddings."""

    _instance: Optional["SemanticMatcher"] = None

    def __new__(cls, model_name: str = None):
        if cls._instance is None:
            cls._instance = super(SemanticMatcher, cls).__new__(cls)
            cls._instance._model = None
            cls._instance._modal_client = None
            cls._instance._provider = settings.embedding_provider.strip().lower()
            cls._instance._embedding_cache = contextvars.ContextVar(
                "semantic_embedding_cache", default=None
            )
            if model_name is None:
                fine_tuned_path = os.path.join(
                    os.path.dirname(
                        os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                    ),
                    "models",
                    "fine_tuned_embedder",
                )
                model_name = (
                    fine_tuned_path
                    if os.path.exists(fine_tuned_path) and os.listdir(fine_tuned_path)
                    else "XuanTruong03/ai-recruitment-embedder-v2"
                )
            cls._instance._model_name = model_name
            cls._instance._initialized = False
        return cls._instance

    def initialize(self) -> None:
        """Initialize the configured embedding provider once per process."""
        if self._initialized:
            return

        if self._provider == "modal":
            self._modal_client = ModalEmbeddingClient(
                endpoint_url=settings.modal_embedding_url,
                token_id=settings.modal_proxy_token_id,
                token_secret=settings.modal_proxy_token_secret,
                timeout_seconds=settings.embedding_timeout_seconds,
            )
            self._initialized = True
            logger.info("Modal embedding provider initialized")
            return

        if self._provider != "local":
            raise EmbeddingProviderError(
                f"Unsupported embedding provider: {self._provider}"
            )

        try:
            # pyrefly: ignore [missing-import]
            from sentence_transformers import SentenceTransformer

            logger.info("Loading local SentenceTransformer model: %s", self._model_name)
            self._model = SentenceTransformer(self._model_name)
            self._initialized = True
            logger.info("SentenceTransformer model loaded successfully")
        except Exception as exc:
            logger.warning(
                "Could not load SentenceTransformer (%s); "
                "local similarity will use Jaccard",
                exc,
            )
            self._model = None
            self._initialized = False

    def prefetch(self, texts: List[str]) -> None:
        """Embed all unique evaluation texts in one provider batch."""
        unique_texts = list(
            dict.fromkeys(text.strip() for text in texts if text and text.strip())
        )
        self._embedding_cache.set({})
        if not unique_texts:
            return

        self.initialize()
        if self._provider == "modal":
            vectors = self._modal_client.embed(unique_texts)
        elif self._model is not None:
            vectors = self._model.encode(
                unique_texts,
                convert_to_numpy=True,
                normalize_embeddings=True,
                show_progress_bar=False,
            )
        else:
            return

        self._embedding_cache.set(
            {
                text: np.asarray(vector, dtype=float)
                for text, vector in zip(unique_texts, vectors, strict=True)
            }
        )

    def clear_cache(self) -> None:
        self._embedding_cache.set(None)

    def compute_similarity(self, text1: str, text2: str) -> float:
        if not text1 or not text2 or not text1.strip() or not text2.strip():
            return 0.0

        try:
            vec1, vec2 = self._vectors_for([text1, text2])
            return self._cosine_similarity(vec1, vec2)
        except EmbeddingProviderError:
            raise
        except Exception as exc:
            logger.warning("Embedding similarity failed: %s", exc)

        return self._jaccard_similarity(text1, text2)

    def compute_best_similarity(
        self, target_text: str, candidate_texts: List[str]
    ) -> float:
        valid_candidates = [text for text in candidate_texts if text and text.strip()]
        if not valid_candidates or not target_text or not target_text.strip():
            return 0.0

        try:
            vectors = self._vectors_for([target_text, *valid_candidates])
            target_vec = vectors[0]
            candidate_vectors = vectors[1:]
            scores = [
                self._cosine_similarity(target_vec, vector)
                for vector in candidate_vectors
            ]
            return max(scores) if scores else 0.0
        except EmbeddingProviderError:
            raise
        except Exception as exc:
            logger.warning("Batch embedding similarity failed: %s", exc)

        scores = [
            self._jaccard_similarity(target_text, candidate)
            for candidate in valid_candidates
        ]
        return max(scores) if scores else 0.0

    def _vectors_for(self, texts: List[str]) -> List[np.ndarray]:
        self.initialize()
        cache = dict(self._embedding_cache.get() or {})
        missing_texts = list(dict.fromkeys(text for text in texts if text not in cache))

        if missing_texts:
            if self._provider == "modal":
                vectors = self._modal_client.embed(missing_texts)
            elif self._model is not None:
                vectors = self._model.encode(
                    missing_texts,
                    convert_to_numpy=True,
                    normalize_embeddings=True,
                    show_progress_bar=False,
                )
            else:
                raise RuntimeError("Local embedding model is unavailable")

            for text, vector in zip(missing_texts, vectors, strict=True):
                cache[text] = np.asarray(vector, dtype=float)
            self._embedding_cache.set(cache)

        return [cache[text] for text in texts]

    @staticmethod
    def _cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        if norm1 == 0 or norm2 == 0:
            return 0.0
        similarity = float(np.dot(vec1, vec2) / (norm1 * norm2))
        return max(0.0, min(1.0, similarity))

    @staticmethod
    def _jaccard_similarity(text1: str, text2: str) -> float:
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        if not words1 or not words2:
            return 0.0
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        return len(intersection) / len(union)


semantic_matcher = SemanticMatcher()
