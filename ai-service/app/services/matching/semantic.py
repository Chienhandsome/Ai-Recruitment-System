import logging
from typing import List, Optional
# pyrefly: ignore [missing-import]
import numpy as np

logger = logging.getLogger("ai_matching.semantic")


class SemanticMatcher:
    """
    Singleton class for computing text embeddings and semantic similarity scores
    using local SentenceTransformers model (e.g. 'all-MiniLM-L6-v2').
    """

    _instance: Optional["SemanticMatcher"] = None

    def __new__(cls, model_name: str = "all-MiniLM-L6-v2"):
        if cls._instance is None:
            cls._instance = super(SemanticMatcher, cls).__new__(cls)
            cls._instance._model = None
            cls._instance._model_name = model_name
            cls._instance._initialized = False
        return cls._instance

    def initialize(self):
        """Lazy load SentenceTransformer model."""
        if self._initialized and self._model is not None:
            return

        try:
            # pyrefly: ignore [missing-import]
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading local SentenceTransformer model: {self._model_name}...")
            self._model = SentenceTransformer(self._model_name)
            self._initialized = True
            logger.info("SentenceTransformer model loaded successfully.")
        except Exception as exc:
            logger.warning(f"Could not load SentenceTransformer ({exc}). Falling back to Jaccard similarity.")
            self._model = None
            self._initialized = False

    def compute_similarity(self, text1: str, text2: str) -> float:
        """
        Compute cosine similarity (0.0 to 1.0) between two text strings.
        If model is unavailable, falls back to token Jaccard similarity.
        """
        if not text1 or not text2 or not text1.strip() or not text2.strip():
            return 0.0

        if not self._initialized:
            self.initialize()

        if self._model is not None:
            try:
                embeddings = self._model.encode([text1, text2], convert_to_numpy=True)
                vec1, vec2 = embeddings[0], embeddings[1]
                norm1 = np.linalg.norm(vec1)
                norm2 = np.linalg.norm(vec2)
                if norm1 == 0 or norm2 == 0:
                    return 0.0
                cosine_sim = float(np.dot(vec1, vec2) / (norm1 * norm2))
                # Clip to [0.0, 1.0] range
                return max(0.0, min(1.0, cosine_sim))
            except Exception as exc:
                logger.warning(f"Error computing SentenceTransformer embeddings: {exc}")

        # Fallback Jaccard similarity
        return self._jaccard_similarity(text1, text2)

    def compute_best_similarity(self, target_text: str, candidate_texts: List[str]) -> float:
        """
        Compute maximum similarity score between target_text and any text in candidate_texts.
        """
        if not candidate_texts:
            return 0.0
        scores = [self.compute_similarity(target_text, c_text) for c_text in candidate_texts if c_text]
        return max(scores) if scores else 0.0

    @staticmethod
    def _jaccard_similarity(text1: str, text2: str) -> float:
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        if not words1 or not words2:
            return 0.0
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        return len(intersection) / len(union)


# Shared default instance
semantic_matcher = SemanticMatcher()
