# Run the automated end-to-end test (no mic needed)
# Usage:  powershell -ExecutionPolicy Bypass -File scripts\run-e2e-test.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$env:PYTHONUTF8 = '1'
Set-Location "$root\agent"
& ".\.venv\Scripts\python.exe" -X utf8 -u e2e_test.py
exit $LASTEXITCODE