# EstacionAR · Detener demo local
# Cierra procesos Vite/tsx asociados a C:\Users\LENOVO\estacionar

$root = "C:\Users\LENOVO\estacionar"
$procs = Get-CimInstance Win32_Process | Where-Object {
  ($_.CommandLine -like "*$root*") -and ($_.Name -match "node|cmd|powershell|esbuild")
}

foreach ($p in $procs) {
  try {
    Stop-Process -Id $p.ProcessId -Force -ErrorAction Stop
    Write-Host "Detenido PID $($p.ProcessId) $($p.Name)"
  } catch {}
}

Write-Host "Demo EstacionAR detenida."
