# Run the phone agent locally — browser voice test at http://localhost:7860
# Usage:  powershell -ExecutionPolicy Bypass -File scripts\run-local.ps1 [-Transport webrtc|twilio]
param([string]$Transport = "webrtc")
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$env:PYTHONUTF8 = "1"   # pipecat's banner needs UTF-8; Windows consoles default to cp1252
Set-Location "$root\agent"
if (-not (Test-Path .venv)) { throw "No .venv — run scripts\setup.ps1 first" }
& ".\.venv\Scripts\python.exe" phone_agent.py -t $Transport