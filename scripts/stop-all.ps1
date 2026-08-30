# Stop the agent bot and the dashboard, using the PID files written by start-everything.
# Never touches processes that are not ours (e.g. the landing page on :3000).
# Usage:  powershell -ExecutionPolicy Bypass -File scripts\stop-all.ps1
$ErrorActionPreference = 'SilentlyContinue'
$root = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $root 'logs'

foreach ($name in 'agent', 'dashboard') {
    $pidFile = Join-Path $logDir ($name + '.pid')
    if (Test-Path $pidFile) {
        $procId = (Get-Content $pidFile | Select-Object -First 1).Trim()
        $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host ('Stopping ' + $name + ' (PID ' + $procId + ')') -ForegroundColor Yellow
            Stop-Process -Id $procId -Force
        }
        Remove-Item $pidFile -Force
    }
}

# Fallback: anything still listening on :7860 (the agent) is ours
$conns = Get-NetTCPConnection -LocalPort 7860 -State Listen
foreach ($c in $conns) {
    Write-Host ('Stopping bot on :7860 (PID ' + $c.OwningProcess + ')') -ForegroundColor Yellow
    Stop-Process -Id $c.OwningProcess -Force
}
Write-Host 'All stopped.'