$projectRoot = Split-Path -Parent $PSScriptRoot
$pythonCandidates = @(
    (Join-Path $projectRoot "ai-service\.venv-local\Scripts\python.exe"),
    (Join-Path $projectRoot "ai-service\.venv\Scripts\python.exe"),
    (Join-Path $projectRoot "ai-service\venv\Scripts\python.exe")
)
$pythonExe = $pythonCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1

if (-not $pythonExe) {
    Write-Error "Không tìm thấy Python của dự án. Hãy tạo ai-service\.venv-local hoặc ai-service\.venv trước."
    exit 1
}

Push-Location $PSScriptRoot
try {
    & $pythonExe -m uvicorn app:app --reload --host 127.0.0.1 --port 8010
}
finally {
    Pop-Location
}
