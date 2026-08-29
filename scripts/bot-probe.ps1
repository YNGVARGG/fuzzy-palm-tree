$ok=$false
$out='C:\Users\yonat\Documents\Project\bot-check.txt'
Set-Content -Path $out -Value 'polling' -Encoding utf8
for ($i=0; $i -lt 20; $i++) {
  Start-Sleep -Seconds 3
  try {
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:7860' -UseBasicParsing -TimeoutSec 3
    $ok=$true
    Add-Content -Path $out -Value ('BOT HTTP ' + [int]$r.StatusCode) -Encoding utf8
    break
  } catch { Add-Content -Path $out -Value ('attempt ' + $i) -Encoding utf8 }
}
Add-Content -Path $out -Value ('BOT_UP: ' + $ok) -Encoding utf8
try {
  $s = Invoke-WebRequest -Uri 'http://127.0.0.1:3000/api/tenants/french-demo/status' -UseBasicParsing -TimeoutSec 3
  Add-Content -Path $out -Value ('DASH_STATUS: ' + $s.Content) -Encoding utf8
} catch { Add-Content -Path $out -Value ('DASH_STATUS ERR') -Encoding utf8 }