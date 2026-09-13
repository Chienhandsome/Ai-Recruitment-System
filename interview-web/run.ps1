$projectRoot = Split-Path -Parent $PSScriptRoot
$pythonExe = Join-Path $projectRoot "ai-service\.venv\Scripts\python.exe"
& $pythonExe -m http.server 4174
