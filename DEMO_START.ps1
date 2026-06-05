# EstacionAR · Demo local
# Ejecutar desde PowerShell: powershell -ExecutionPolicy Bypass -File .\DEMO_START.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "\n🚗 EstacionAR · Municipalidad de Salta" -ForegroundColor Cyan
Write-Host "Instalando/verificando dependencias..." -ForegroundColor DarkCyan
pnpm install

$jobs = @(
  @{ Name = "API"; Command = "pnpm dev:api"; Url = "http://localhost:4000/api/health" },
  @{ Name = "Backoffice"; Command = "pnpm dev:backoffice"; Url = "http://localhost:5173" },
  @{ Name = "Conductor"; Command = "pnpm dev:conductor"; Url = "http://localhost:5174" },
  @{ Name = "Permisionario"; Command = "pnpm dev:permisionario"; Url = "http://localhost:5175" }
)

foreach ($job in $jobs) {
  Write-Host "Levantando $($job.Name)..." -ForegroundColor Yellow
  Start-Process powershell -ArgumentList @("-NoExit", "-Command", "cd '$root'; $($job.Command)") | Out-Null
  Start-Sleep -Milliseconds 600
}

Write-Host "\nEsperando servicios..." -ForegroundColor DarkCyan
Start-Sleep -Seconds 5

Write-Host "\nURLs de demo:" -ForegroundColor Green
foreach ($job in $jobs) {
  Write-Host "- $($job.Name): $($job.Url)" -ForegroundColor White
}

Write-Host "\nAbrí primero el Backoffice: http://localhost:5173" -ForegroundColor Cyan
Start-Process "http://localhost:5173"
