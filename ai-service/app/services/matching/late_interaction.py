"""
Late Interaction Engine (H-CAME V4):
Fine-grained token-level cross-matching (ColBERT-style MaxSim)
between Job Description requirement clauses and Candidate Resume passages.
"""

from typing import List, Dict, Any, Tuple
import re
import numpy as np
from app.services.matching.semantic import semantic_matcher


class LateInteractionScorer:
    """
    Computes fine-grained clause-to-passage token-level MaxSim alignments
    to capture nuanced constraints and conditional requirements.
    """

    def compute_clause_maxsim(
        self,
        jd_clauses: List[str],
        candidate_passages: List[str]
    ) -> Tuple[float, List[Dict[str, Any]]]:
        """
        Calculates token-level MaxSim score across JD requirement clauses and Candidate passages.

        Formula:
            MaxSim(JD, CV) = (1 / |JD_clauses|) * Sum_i [ max_j CosineSim(clause_i, passage_j) ]

        Returns:
            (aggregate_score: float [0.0 - 1.0], alignments: List of match details)
        """
        if not jd_clauses or not candidate_passages:
            return (0.85, [])

        clean_jd_clauses = [c.strip() for c in jd_clauses if len(c.strip()) > 5][:8]
        clean_cand_passages = [p.strip() for p in candidate_passages if len(p.strip()) > 5][:15]

        if not clean_jd_clauses or not clean_cand_passages:
            return (0.85, [])

        # Get embeddings for clauses and passages
        jd_embeddings = semantic_matcher.embed_batch(clean_jd_clauses)
        cand_embeddings = semantic_matcher.embed_batch(clean_cand_passages)

        # Normalize embeddings
        jd_norm = jd_embeddings / (np.linalg.norm(jd_embeddings, axis=1, keepdims=True) + 1e-9)
        cand_norm = cand_embeddings / (np.linalg.norm(cand_embeddings, axis=1, keepdims=True) + 1e-9)

        # Compute cosine similarity matrix: Shape (|JD|, |CV|)
        sim_matrix = np.dot(jd_norm, cand_norm.T)

        alignments = []
        max_sims = []

        for i, clause in enumerate(clean_jd_clauses):
            best_j = int(np.argmax(sim_matrix[i]))
            best_sim = float(sim_matrix[i, best_j])
            max_sims.append(best_sim)
            alignments.append({
                "jd_clause": clause,
                "best_matching_passage": clean_cand_passages[best_j],
                "alignment_score": round(best_sim, 3)
            })

        aggregate_score = float(np.mean(max_sims))
        aggregate_score = max(0.0, min(1.0, aggregate_score))

        return (round(aggregate_score, 3), alignments)

    def extract_clauses_from_job(self, job: Any) -> List[str]:
        """Extracts individual requirement sentences/clauses from job description."""
        clauses = []
        req_text = getattr(job, "requirements", "") or ""
        desc_text = getattr(job, "description", "") or ""

        combined = f"{req_text}\n{desc_text}"
        raw_lines = re.split(r'[\n\r•\-\*\;]+', combined)
        for line in raw_lines:
            s = line.strip()
            if len(s) > 15:
                clauses.append(s)

        return clauses[:8]

    def extract_passages_from_profile(self, profile: Any) -> List[str]:
        """Extracts experience descriptions and project achievements from candidate profile."""
        passages = []

        # Work experiences
        for exp in getattr(profile, "work_experiences", []) or []:
            desc = getattr(exp, "description", "") or ""
            achieve = getattr(exp, "achievements", "") or ""
            title = getattr(exp, "position_title", "") or ""
            comp = getattr(exp, "company_name", "") or ""
            if desc:
                passages.append(f"{title} tại {comp}: {desc}")
            if achieve:
                passages.append(f"Thành tựu: {achieve}")

        # Projects
        for proj in getattr(profile, "projects", []) or []:
            p_name = getattr(proj, "project_name", "") or ""
            p_desc = getattr(proj, "description", "") or ""
            if p_desc:
                passages.append(f"Dự án {p_name}: {p_desc}")

        return passages[:15]


# Singleton late interaction scorer
late_interaction_scorer = LateInteractionScorer()
