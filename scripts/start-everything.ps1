# Start the whole product: agent bot + dashboard + automated test + browsers.
# Usage:  powershell -ExecutionPolicy Bypass -File scripts\start-everything.ps1  [-SkipTests]
param([switch]$SkipTests)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $root 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$env:PYTHONUTF8 = '1'

# --- 1. Agent bot (voice) on :7860 ---
if (-not (Get-NetTCPConnection -LocalPort 7860 -State Listen -ErrorAction SilentlyContinue)) {
    Write-Host 'Starting agent bot...' -ForegroundColor Cyan
    $py = Join-Path $root 'agent\.venv\Scripts\python.exe'
    Start-Process -FilePath $py -ArgumentList '-X','utf8','phone_agent.py','-t','webrtc' -WorkingDirectory (Join-Path $root 'agent') -RedirectStandardOutput (Join-Path $logDir 'agent.log') -RedirectStandardError (Join-Path $logDir 'agent.err.log') -WindowStyle Hidden
} else { Write-Host 'Agent bot already running on :7860' -ForegroundColor DarkGray }

# --- 2. Dashboard on :3000 ---
if (-not (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue)) {
    Write-Host 'Starting dashboard...' -ForegroundColor Cyan
    $pnpm = (Get-Command pnpm.cmd -ErrorAction SilentlyContinue).Source
    if (-not $pnpm) { throw 'pnpm not found - install it or start the dashboard manually (cd dashboard; pnpm dev)' }
    Start-Process -FilePath $pnpm -ArgumentList 'dev' -WorkingDirectory (Join-Path $root 'dashboard') -RedirectStandardOutput (Join-Path $logDir 'dashboard.log') -RedirectStandardError (Join-Path $logDir 'dashboard.err.log') -WindowStyle Hidden
} else { Write-Host 'Dashboard already running on :3000' -ForegroundColor DarkGray }

# --- 3. Wait for both ---
foreach ($port in 3000, 7860) {
    $up = $false
    for ($i = 0; $i -lt 40; $i++) {
        if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) { $up = $true; break }
        Start-Sleep -Seconds 3
    }
    $color = if ($up) { 'Green' } else { 'Red' }
    Write-Host ('  :' + $port + ' ' + $(if ($up) { 'UP' } else { 'DOWN' })) -ForegroundColor $color
}

# --- 4. Automated end-to-end test ---
if (-not $SkipTests) {
    Write-Host 'Running end-to-end test (8 checks)...' -ForegroundColor Cyan
    & (Join-Path $root 'scripts\run-e2e-test.ps1')
    if ($LASTEXITCODE -ne 0) { Write-Warning 'End-to-end test FAILED - see output above.' }
}

# --- 5. Open browsers ---
Start-Process 'http://localhost:7860'
Start-Process 'http://localhost:3000'

Write-Host ''
Write-Host 'Links:' -ForegroundColor Green
Write-Host '  Agent (voice):  http://localhost:7860'
Write-Host '  Dashboard:      http://localhost:3000'
Write-Host '  Logs:           logs\ (agent.log, dashboard.log)'