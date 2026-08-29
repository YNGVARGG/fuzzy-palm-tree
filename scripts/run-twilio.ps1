# Answer real phone calls via Twilio: ngrok tunnel + agent in telephony mode.
# Usage:  powershell -ExecutionPolicy Bypass -File scripts\run-twilio.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $root 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$env:PYTHONUTF8 = '1'

# --- 0. Read credentials from agent/.env ---
$envFile = Join-Path $root 'agent\.env'
if (-not (Test-Path $envFile)) { throw 'agent\.env missing - run scripts\setup.ps1 first' }
function Get-EnvVal($name) {
    $line = Get-Content $envFile | Where-Object { $_ -match '^' + $name + '=' } | Select-Object -First 1
    if ($line) { return ($line -split '=', 2)[1].Trim() }
    return ''
}
$sid = Get-EnvVal 'TWILIO_ACCOUNT_SID'
$token = Get-EnvVal 'TWILIO_AUTH_TOKEN'
$ngrokToken = Get-EnvVal 'NGROK_AUTHTOKEN'
if (-not $sid -or -not $token) { throw 'TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN missing in agent\.env - see docs\twilio-setup.md' }
if (-not $ngrokToken) { throw 'NGROK_AUTHTOKEN missing in agent\.env - see docs\twilio-setup.md' }

# --- 1. Free port 7860 (stop any webrtc bot) ---
$busy = Get-NetTCPConnection -LocalPort 7860 -State Listen -ErrorAction SilentlyContinue
if ($busy) {
    Write-Host 'Stopping existing process on :7860...' -ForegroundColor Yellow
    $busy | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 2
}

# --- 2. Start ngrok tunnel ---
$ngrok = (Get-Command ngrok -ErrorAction SilentlyContinue).Source
if (-not $ngrok) { throw 'ngrok not found - install it (winget install ngrok.ngrok)' }
& $ngrok config add-authtoken $ngrokToken
Write-Host 'Starting ngrok tunnel...' -ForegroundColor Cyan
Start-Process -FilePath $ngrok -ArgumentList 'http','7860' -WorkingDirectory $root -RedirectStandardOutput (Join-Path $logDir 'ngrok.log') -RedirectStandardError (Join-Path $logDir 'ngrok.err.log') -WindowStyle Hidden

# --- 3. Start the agent in Twilio mode ---
Write-Host 'Starting agent (twilio mode)...' -ForegroundColor Cyan
$py = Join-Path $root 'agent\.venv\Scripts\python.exe'
Start-Process -FilePath $py -ArgumentList '-X','utf8','phone_agent.py','-t','twilio' -WorkingDirectory (Join-Path $root 'agent') -RedirectStandardOutput (Join-Path $logDir 'agent-twilio.log') -RedirectStandardError (Join-Path $logDir 'agent-twilio.err.log') -WindowStyle Hidden

# --- 4. Wait for agent, then fetch the tunnel URL from ngrok's local API ---
for ($i = 0; $i -lt 30; $i++) {
    if (Get-NetTCPConnection -LocalPort 7860 -State Listen -ErrorAction SilentlyContinue) { break }
    Start-Sleep -Seconds 2
}
$tunnelUrl = ''
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Seconds 2
    try {
        $t = Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels' -TimeoutSec 3
        $tunnelUrl = $t.tunnels | Where-Object { $_.public_url -like 'https://*' } | Select-Object -First 1 -ExpandProperty public_url
        if ($tunnelUrl) { break }
    } catch {}
}

Write-Host ''
if ($tunnelUrl) {
    Write-Host ('TUNNEL: ' + $tunnelUrl) -ForegroundColor Green
    Write-Host ('TWIML : wss://' + $tunnelUrl.Replace('https://','') + '/ws') -ForegroundColor Green
    Write-Host 'Put that wss:// URL in your Twilio TwiML Bin (see docs\twilio-setup.md).'
} else {
    Write-Host 'Could not fetch the tunnel URL - check logs\ngrok.log' -ForegroundColor Red
}
Write-Host 'Agent:  twilio mode on :7860  |  logs: logs\agent-twilio.log'