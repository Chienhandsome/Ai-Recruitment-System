"""Dedicated process entry point for the Evaluation (Job Matching) RabbitMQ worker."""

import logging

from dotenv import load_dotenv

from app.workers.evaluation_worker import start_evaluation_worker


def main() -> None:
    load_dotenv()
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    start_evaluation_worker()


if __name__ == "__main__":
    main()
