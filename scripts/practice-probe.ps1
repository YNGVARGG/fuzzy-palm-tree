$ok=$false
$out='C:\Users\yonat\Documents\Project\practice-check.txt'
Set-Content -Path $out -Value 'polling' -Encoding utf8
for ($i=0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 3
  try {
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3001' -UseBasicParsing -TimeoutSec 3
    if ([int]$r.StatusCode -eq 200) { $ok=$true; break }
  } catch {}
}
Add-Content -Path $out -Value ('HTTP_READY: ' + $ok) -Encoding utf8
try { $a = Invoke-WebRequest -Uri 'http://127.0.0.1:3001/api/tenants' -UseBasicParsing -TimeoutSec 8; Add-Content -Path $out -Value ('TENANTS ' + [int]$a.StatusCode + ': ' + $a.Content) -Encoding utf8 } catch { Add-Content -Path $out -Value ('TENANTS ERR') -Encoding utf8 }
try { $b = Invoke-WebRequest -Uri 'http://127.0.0.1:3001/api/tenants/french-demo/status' -UseBasicParsing -TimeoutSec 8; Add-Content -Path $out -Value ('STATUS ' + [int]$b.StatusCode + ': ' + $b.Content) -Encoding utf8 } catch { Add-Content -Path $out -Value ('STATUS ERR') -Encoding utf8 }