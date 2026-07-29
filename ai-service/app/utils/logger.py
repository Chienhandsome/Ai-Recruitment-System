import logging
import sys
import time
from typing import Any, Dict

# Configure standard logger
logger = logging.getLogger("ai_matching")
logger.setLevel(logging.INFO)

if not logger.handlers:
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)


class StepTimer:
    """Utility class to measure execution time of matching steps."""

    def __init__(self, step_name: str):
        self.step_name = step_name
        self.start_time = 0.0
        self.elapsed_ms = 0.0

    def __enter__(self):
        self.start_time = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.elapsed_ms = (time.perf_counter() - self.start_time) * 1000.0
        logger.info(f"Step '{self.step_name}' completed in {self.elapsed_ms:.2f} ms")


def log_evaluation_step(step_name: str, details: Dict[str, Any]):
    """Log structured details for an evaluation step."""
    formatted_details = ", ".join(f"{k}={v}" for k, v in details.items())
    logger.info(f"[{step_name}] {formatted_details}")
