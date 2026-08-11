from unittest.mock import Mock

import service_main


def test_service_entrypoint_runs_http_and_both_consumers():
    process_names = {name for name, _target in service_main.PROCESS_TARGETS}

    assert process_names == {
        "http-api",
        "resume-analysis",
        "application-evaluation",
    }


def test_http_server_uses_render_port(monkeypatch):
    run = Mock()
    monkeypatch.setattr(service_main.uvicorn, "run", run)
    monkeypatch.setenv("PORT", "10000")

    service_main.start_http_server()

    run.assert_called_once_with("app.main:app", host="0.0.0.0", port=10000)
