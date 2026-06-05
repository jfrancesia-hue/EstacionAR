# EstacionAR · Estado de demo local

$services = @(
  @{ Name = "Backoffice"; Url = "http://localhost:5173" },
  @{ Name = "Conductor"; Url = "http://localhost:5174" },
  @{ Name = "Permisionario"; Url = "http://localhost:5175" },
  @{ Name = "API"; Url = "http://localhost:4000/api/health" }
)

foreach ($service in $services) {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $service.Url -TimeoutSec 3
    Write-Host ("OK   {0,-14} {1} ({2})" -f $service.Name, $service.Url, $response.StatusCode) -ForegroundColor Green
  } catch {
    Write-Host ("FAIL {0,-14} {1}" -f $service.Name, $service.Url) -ForegroundColor Red
  }
}
