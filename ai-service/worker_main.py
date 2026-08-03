"""Dedicated process entry point for the resume RabbitMQ worker."""

import logging

from dotenv import load_dotenv

from app.workers.resume_worker import start_worker


def main() -> None:
    load_dotenv()
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    start_worker()


if __name__ == "__main__":
    main()
