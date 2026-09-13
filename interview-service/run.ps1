$projectRoot = Split-Path -Parent $PSScriptRoot
$pythonExe = Join-Path $projectRoot "ai-service\.venv\Scripts\python.exe"

if (-not (Test-Path -LiteralPath $pythonExe)) {
    Write-Error "Không tìm thấy Python của dự án tại $pythonExe. Hãy cài Python 3.10+ hoặc tạo ai-service\.venv trước."
    exit 1
}

& $pythonExe -m uvicorn app:app --reload --host 127.0.0.1 --port 8010
