"""Process supervisor for every RabbitMQ worker used by the AI service."""

import logging
import multiprocessing
import signal
import time
from collections.abc import Callable

from dotenv import load_dotenv

from app.workers.evaluation_worker import start_evaluation_worker
from app.workers.resume_worker import start_worker as start_resume_worker

logger = logging.getLogger(__name__)

WORKER_TARGETS: tuple[tuple[str, Callable[[], None]], ...] = (
    ("resume-analysis", start_resume_worker),
    ("application-evaluation", start_evaluation_worker),
)
PROCESS_POLL_INTERVAL_SECONDS = 0.5
PROCESS_STOP_TIMEOUT_SECONDS = 10
PROCESS_RESTART_DELAY_SECONDS = 5


def _configure_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )


def _run_worker(name: str, target: Callable[[], None]) -> None:
    _configure_logging()
    logging.getLogger(__name__).info("Starting %s worker process", name)
    target()


def _stop_processes(processes: list[multiprocessing.Process]) -> None:
    for process in processes:
        if process.is_alive():
            process.terminate()

    for process in processes:
        process.join(timeout=PROCESS_STOP_TIMEOUT_SECONDS)

    for process in processes:
        if process.is_alive():
            logger.warning("Force-stopping worker process %s", process.name)
            process.kill()
            process.join(timeout=PROCESS_STOP_TIMEOUT_SECONDS)


def _create_process(
    context: multiprocessing.context.BaseContext,
    name: str,
    target: Callable[[], None],
) -> multiprocessing.Process:
    return context.Process(
        name=f"ai-{name}-worker",
        target=_run_worker,
        args=(name, target),
    )


def main() -> None:
    load_dotenv()
    _configure_logging()

    shutdown_requested = False

    def request_shutdown(signum: int, _frame: object) -> None:
        nonlocal shutdown_requested
        shutdown_requested = True
        logger.info("Received signal %s; stopping AI workers", signum)

    signal.signal(signal.SIGINT, request_shutdown)
    signal.signal(signal.SIGTERM, request_shutdown)

    context = multiprocessing.get_context("spawn")
    processes = {
        name: _create_process(context, name, target)
        for name, target in WORKER_TARGETS
    }

    for process in processes.values():
        process.start()

    try:
        while not shutdown_requested:
            for name, target in WORKER_TARGETS:
                process = processes[name]
                if process.exitcode is None:
                    continue

                logger.error(
                    "Worker process %s stopped with exit code %s; restarting in %ss",
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
