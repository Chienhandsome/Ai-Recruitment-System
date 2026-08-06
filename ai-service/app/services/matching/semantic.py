import os
import logging
from typing import List, Optional, Union
# pyrefly: ignore [missing-import]
import numpy as np

logger = logging.getLogger("ai_matching.semantic")


class SemanticMatcher:
    """
    Singleton class for computing text embeddings and semantic similarity scores
    using local SentenceTransformers model (e.g. 'all-MiniLM-L6-v2').
    """

    _instance: Optional["SemanticMatcher"] = None

    def __new__(cls, model_name: str = None):
        if cls._instance is None:
            cls._instance = super(SemanticMatcher, cls).__new__(cls)
            cls._instance._model = None
            if model_name is None:
                # Path to local fine-tuned model
                fine_tuned_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "models", "fine_tuned_embedder")
                if os.path.exists(fine_tuned_path):
                    model_name = fine_tuned_path
                else:
                    # Download from Hugging Face if not found locally (uses cache after first download)
                    model_name = "XuanTruong03/ai-recruitment-embedder"
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
        Compute maximum similarity score between target_text and any text in candidate_texts using Batch Encoding for high performance.
        """
        if not candidate_texts or not target_text:
            return 0.0

        if not self._initialized:
            self.initialize()

        if self._model is not None:
            try:
                # Batch encode: encode target_text and all candidate_texts simultaneously
                all_texts = [target_text] + candidate_texts
                embeddings = self._model.encode(all_texts, convert_to_numpy=True)
                
                target_vec = embeddings[0]
                target_norm = np.linalg.norm(target_vec)
                if target_norm == 0:
                    return 0.0

                cand_vecs = embeddings[1:]
                cand_norms = np.linalg.norm(cand_vecs, axis=1)
                
                # Filter out zero norms
                valid_indices = cand_norms > 0
                if not np.any(valid_indices):
                    return 0.0
                    
                target_vec = target_vec / target_norm
                cand_vecs_normed = cand_vecs[valid_indices] / cand_norms[valid_indices, np.newaxis]
                
                # Matrix multiplication for cosine similarity of all candidates at once
                cosine_sims = np.dot(cand_vecs_normed, target_vec)
                return float(max(0.0, min(1.0, np.max(cosine_sims))))
            except Exception as exc:
                logger.warning(f"Error computing batch embeddings: {exc}. Falling back to loop.")

        # Fallback to Jaccard
        scores = [self._jaccard_similarity(target_text, c_text) for c_text in candidate_texts if c_text]
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
