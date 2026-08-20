#!/bin/sh
set -e

echo "🚀 Starting AI Resume Worker in background..."
python worker_main.py &

echo "🚀 Starting AI FastAPI Web Server..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-7860}
