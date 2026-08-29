$ok = $false
$out = 'C:\Users\yonat\Documents\Project\http-check.txt'
Set-Content -Path $out -Value 'probe start' -Encoding utf8
for ($i = 0; $i -lt 10; $i++) {
  Start-Sleep -Seconds 3
  try {
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:7860' -UseBasicParsing -TimeoutSec 3
    $ok = $true
    Add-Content -Path $out -Value ('HTTP ' + [int]$r.StatusCode) -Encoding utf8
    if ($r.Content -match '<title>(.*?)</title>') {
      Add-Content -Path $out -Value ('TITLE: ' + $Matches[1]) -Encoding utf8
    }
    break
  } catch {
    Add-Content -Path $out -Value ('attempt ' + $i + ': not up yet') -Encoding utf8
  }
}
Add-Content -Path $out -Value ('SERVER_UP: ' + $ok) -Encoding utf8