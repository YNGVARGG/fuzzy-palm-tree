# Start the whole product: agent bot + dashboard + automated test + browsers.
# Usage:  powershell -ExecutionPolicy Bypass -File scripts\start-everything.ps1  [-SkipTests]
param([switch]$SkipTests)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $root 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$env:PYTHONUTF8 = '1'

# --- 1. Agent bot (voice) on :7861 ---
if (-not (Get-NetTCPConnection -LocalPort 7861 -State Listen -ErrorAction SilentlyContinue)) {
    Write-Host 'Starting agent bot...' -ForegroundColor Cyan
    $py = Join-Path $root 'agent\.venv\Scripts\python.exe'
    $agentProc = Start-Process -FilePath $py -ArgumentList '-X','utf8','phone_agent.py','-t','webrtc','--host','127.0.0.1','--port','7861' -WorkingDirectory (Join-Path $root 'agent') -RedirectStandardOutput (Join-Path $logDir 'agent.log') -RedirectStandardError (Join-Path $logDir 'agent.err.log') -WindowStyle Hidden -PassThru
    $agentProc.Id | Out-File (Join-Path $logDir 'agent.pid') -Encoding utf8
} else { Write-Host 'Agent bot already running on :7861' -ForegroundColor DarkGray }

# --- 2. Stable dashboard origin, matching local email authentication ---
$dashPort = 3001
Write-Host ("Dashboard port: " + $dashPort) -ForegroundColor DarkGray
if (-not (Get-NetTCPConnection -LocalPort $dashPort -State Listen -ErrorAction SilentlyContinue)) {
    Write-Host 'Starting dashboard...' -ForegroundColor Cyan
    $pnpm = (Get-Command pnpm.cmd -ErrorAction SilentlyContinue).Source
    if (-not $pnpm) { throw 'pnpm not found - install it or start the dashboard manually (cd dashboard; pnpm dev)' }
    $dashProc = Start-Process -FilePath $pnpm -ArgumentList 'dev','--hostname','127.0.0.1','--port',([string]$dashPort) -WorkingDirectory (Join-Path $root 'practice') -RedirectStandardOutput ((Join-Path $logDir 'practice.log')) -RedirectStandardError ((Join-Path $logDir 'practice.err.log')) -WindowStyle Hidden -PassThru
    $dashProc.Id | Out-File (Join-Path $logDir 'dashboard.pid') -Encoding utf8
} else { Write-Host ('Dashboard already running on :' + $dashPort) -ForegroundColor DarkGray }

# --- 3. Wait for both ---
foreach ($port in $dashPort, 7861) {
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
    # Wait until the dashboard actually answers HTTP (Next compiles on first request)
    $ready = $false
    for ($i = 0; $i -lt 20; $i++) {
        try {
            $resp = Invoke-WebRequest -Uri ('http://127.0.0.1:' + $dashPort) -UseBasicParsing -TimeoutSec 3
            if ([int]$resp.StatusCode -eq 200) { $ready = $true; break }
        } catch {}
        Start-Sleep -Seconds 2
    }
    Write-Host ('Dashboard HTTP ready: ' + $ready) -ForegroundColor $(if ($ready) { 'Green' } else { 'Red' })
    Write-Host 'Running isolated voice tool checks...' -ForegroundColor Cyan
    $env:DASH_URL = 'http://127.0.0.1:' + $dashPort
    Push-Location (Join-Path $root 'agent')
    try { & '.\.venv\Scripts\python.exe' -m unittest test_booking_safety } finally { Pop-Location }
    if ($LASTEXITCODE -ne 0) { Write-Warning 'End-to-end test FAILED - see output above.' }
}

# --- 5. Open browsers ---
Start-Process 'http://localhost:7861'
Start-Process ('http://127.0.0.1:' + $dashPort + '/login')

Write-Host ''
Write-Host 'Links:' -ForegroundColor Green
Write-Host '  Agent (voice):  http://localhost:7861'
Write-Host ('  Dashboard:      http://127.0.0.1:' + $dashPort)
Write-Host '  Logs:           logs\ (agent.log, dashboard.log)'
