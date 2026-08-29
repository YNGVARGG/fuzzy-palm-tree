# Stop the agent bot and the dashboard (by port).
# Usage:  powershell -ExecutionPolicy Bypass -File scripts\stop-all.ps1
$ErrorActionPreference = 'SilentlyContinue'
foreach ($port in 3000, 7860) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen
    foreach ($c in $conns) {
        $proc = Get-Process -Id $c.OwningProcess
        Write-Host ('Stopping :' + $port + ' (' + $proc.ProcessName + ' PID ' + $c.OwningProcess + ')') -ForegroundColor Yellow
        Stop-Process -Id $c.OwningProcess -Force
    }
}
Write-Host 'All stopped.'