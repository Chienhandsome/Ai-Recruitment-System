"""Run the HTTP API and RabbitMQ consumers in one Render web service."""

import logging
import multiprocessing
import os
import signal
import time
from collections.abc import Callable

import uvicorn
from dotenv import load_dotenv

from app.workers.evaluation_worker import start_evaluation_worker
from app.workers.resume_worker import start_worker as start_resume_worker
from app.workers.resume_worker import validate_worker_settings

logger = logging.getLogger(__name__)

PROCESS_POLL_INTERVAL_SECONDS = 0.5
PROCESS_STOP_TIMEOUT_SECONDS = 10
PROCESS_RESTART_DELAY_SECONDS = 5


def _configure_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )


def start_http_server() -> None:
    port = int(os.getenv("PORT", os.getenv("AI_SERVICE_PORT", "8000")))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)


PROCESS_TARGETS: tuple[tuple[str, Callable[[], None]], ...] = (
    ("http-api", start_http_server),
    ("resume-analysis", start_resume_worker),
    ("application-evaluation", start_evaluation_worker),
)


def _run_process(name: str, target: Callable[[], None]) -> None:
    _configure_logging()
    logging.getLogger(__name__).info("Starting %s process", name)
    target()


def _stop_processes(processes: list[multiprocessing.Process]) -> None:
    for process in processes:
        if process.is_alive():
            process.terminate()

    for process in processes:
        process.join(timeout=PROCESS_STOP_TIMEOUT_SECONDS)

    for process in processes:
        if process.is_alive():
            logger.warning("Force-stopping process %s", process.name)
            process.kill()
            process.join(timeout=PROCESS_STOP_TIMEOUT_SECONDS)


def _create_process(
    context: multiprocessing.context.BaseContext,
    name: str,
    target: Callable[[], None],
) -> multiprocessing.Process:
    return context.Process(
        name=f"ai-{name}",
        target=_run_process,
        args=(name, target),
    )


def main() -> None:
    load_dotenv()
    _configure_logging()
    validate_worker_settings()

    shutdown_requested = False

    def request_shutdown(signum: int, _frame: object) -> None:
        nonlocal shutdown_requested
        shutdown_requested = True
        logger.info("Received signal %s; stopping AI service", signum)

    signal.signal(signal.SIGINT, request_shutdown)
    signal.signal(signal.SIGTERM, request_shutdown)

    context = multiprocessing.get_context("spawn")
    processes = {
        name: _create_process(context, name, target) for name, target in PROCESS_TARGETS
    }

    for process in processes.values():
        process.start()

    try:
        while not shutdown_requested:
            for name, target in PROCESS_TARGETS:
                process = processes[name]
                if process.exitcode is None:
                    continue

                logger.error(
                    "Process %s stopped with exit code %s; restarting in %ss",
                    process.name,
                    process.exitcode,
                    PROCESS_RESTART_DELAY_SECONDS,
                )
                process.join()
                restart_at = time.monotonic() + PROCESS_RESTART_DELAY_SECONDS
                while not shutdown_requested and time.monotonic() < restart_at:
                    time.sleep(PROCESS_POLL_INTERVAL_SECONDS)

                if not shutdown_requested:
                    replacement = _create_process(context, name, target)
                    replacement.start()
                    processes[name] = replacement

            time.sleep(PROCESS_POLL_INTERVAL_SECONDS)
    finally:
        _stop_processes(list(processes.values()))


if __name__ == "__main__":
    main()
