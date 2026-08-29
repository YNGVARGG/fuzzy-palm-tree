# One-time setup for the Company Phone Agent (Windows)
# Run from the project root:  powershell -ExecutionPolicy Bypass -File scripts\setup.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
Write-Host "Setting up in $Root" -ForegroundColor Cyan

# 1. Clones (reference + examples) unless already present
if (-not (Test-Path ".\pipecat")) {
    Write-Host "Cloning pipecat..." -ForegroundColor Cyan
    git clone --depth 1 https://github.com/pipecat-ai/pipecat.git
} else {
    Write-Host "pipecat/ already present, skipping clone" -ForegroundColor DarkGray
}
if (-not (Test-Path ".\pipecat-examples")) {
    Write-Host "Cloning pipecat-examples..." -ForegroundColor Cyan
    git clone --depth 1 https://github.com/pipecat-ai/pipecat-examples.git
} else {
    Write-Host "pipecat-examples/ already present, skipping clone" -ForegroundColor DarkGray
}

# 2. Python 3.11+ check
$py = (python --version 2>&1).ToString()
Write-Host "Python: $py" -ForegroundColor Cyan
if ($py -notmatch "Python 3.(1[1-9]|[2-9][0-9])") {
    Write-Warning "Python 3.11+ is recommended (pipecat requires it)."
}

# 3. Virtual environment + install the agent and its deps (pipecat-ai and friends)
if (-not (Test-Path ".\agent\.venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Cyan
    python -m venv .\agent\.venv
}
$pip = ".\agent\.venv\Scripts\python.exe -m pip"
Write-Host "Upgrading pip..." -ForegroundColor Cyan
& $pip install --upgrade pip
Write-Host "Installing agent dependencies (pipecat-ai[...] + dotenv)..." -ForegroundColor Cyan
& $pip install -e ".agent"

# 4. .env from template (never overwrite an existing one)
if (-not (Test-Path ".\agent\.env")) {
    Copy-Item ".\agent\.env.example" ".\agent\.env"
    Write-Host "Created agent\.env — fill in your API keys." -ForegroundColor Yellow
} else {
    Write-Host "agent\.env already exists, leaving it alone" -ForegroundColor DarkGray
}

# 5. Optional: uv (faster, used by the official examples) — skipped if present
if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
    Write-Host "Tip: install uv (https://docs.astral.sh/uv/) for the official example workflow — see agent\README.md" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "Setup complete. Next steps:" -ForegroundColor Green
Write-Host "  1. Fill in API keys in agent\.env"
Write-Host "  2. Serve PhoneLLM (see agent\README.md: Modal or local vLLM)"
Write-Host "  3. cd agent; uv run phone_agent.py -t webrtc   (talk in the browser)"
