# Script de Ejecución - Load Testing
# Ejecutar: .\scripts\run-load-tests.ps1

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("customer", "rider", "spike", "all")]
    [string]$Test = "all",
    
    [Parameter(Mandatory=$false)]
    [int]$VUs = 0,  # 0 = usar default del script
    
    [Parameter(Mandatory=$false)]
    [string]$Duration = ""  # "" = usar default del script
)

Write-Host ""
Write-Host "[LOAD-TEST] MOOVY LOAD TESTING SUITE" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que k6 esté instalado
$k6Version = k6 version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] k6 no está instalado" -ForegroundColor Red
    Write-Host "Instalar desde: https://k6.io/docs/get-started/installation/" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] k6 detectado: $k6Version" -ForegroundColor Green
Write-Host ""

# Verificar que Moovy esté corriendo
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Head -TimeoutSec 2 -ErrorAction Stop
    Write-Host "[OK] Moovy app corriendo en localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Moovy app no detectada en localhost:3000" -ForegroundColor Yellow
    Write-Host "       Asegúrate de ejecutar: npm run dev:full" -ForegroundColor Yellow
}
Write-Host ""

# Construcción de parámetros para k6
$k6Params = @()
if ($VUs -gt 0) {
    $k6Params += "--vus"
    $k6Params += $VUs
}
if ($Duration -ne "") {
    $k6Params += "--duration"
    $k6Params += $Duration
}

# Ejecutar tests
switch ($Test) {
    "customer" {
        Write-Host "[TEST] Ejecutando Customer Flow Test..." -ForegroundColor Cyan
        k6 run @k6Params load-testing/k6/customer-flow.js
    }
    "rider" {
        Write-Host "[TEST] Ejecutando Rider WebSocket Test..." -ForegroundColor Cyan
        k6 run @k6Params load-testing/k6/rider-websocket.js
    }
    "spike" {
        Write-Host "[TEST] Ejecutando Spike Test..." -ForegroundColor Cyan
        k6 run @k6Params load-testing/k6/spike-test.js
    }
    "all" {
        Write-Host "[TEST] Ejecutando TODOS los tests..." -ForegroundColor Cyan
        Write-Host ""
        
        Write-Host "1/3 - Customer Flow Test..." -ForegroundColor Yellow
        k6 run @k6Params load-testing/k6/customer-flow.js
        
        Write-Host ""
        Write-Host "2/3 - Rider WebSocket Test..." -ForegroundColor Yellow
        k6 run @k6Params load-testing/k6/rider-websocket.js
        
        Write-Host ""
        Write-Host "3/3 - Spike Test..." -ForegroundColor Yellow
        k6 run @k6Params load-testing/k6/spike-test.js
    }
}

Write-Host ""
Write-Host "[DONE] Tests completados" -ForegroundColor Green
Write-Host "Ver métricas en Grafana: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
