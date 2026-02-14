# Simple Load Test usando PowerShell
# Ejecutar: .\scripts\simple-load-test.ps1

param(
    [int]$Users = 10,
    [int]$DurationSeconds = 30,
    [string]$BaseURL = "http://localhost:3000"
)

Write-Host ""
Write-Host "[LOAD-TEST] Prueba de Carga Simple" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Usuarios: $Users" -ForegroundColor Yellow
Write-Host "Duracion: ${DurationSeconds}s" -ForegroundColor Yellow
Write-Host "URL Base: $BaseURL" -ForegroundColor Yellow
Write-Host ""

$results = @{
    total = 0
    success = 0
    errors = 0
    responseTimes = @()
}

$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
$jobs = @()

# Funcion para simular usuario
$scriptBlock = {
    param($url, $duration)
    
    $endTime = (Get-Date).AddSeconds($duration)
    $userResults = @{
        requests = 0
        errors = 0
        times = @()
    }
    
    while ((Get-Date) -lt $endTime) {
        $endpoints = @(
            "/",
            "/api/merchants",
            "/tienda"
        )
        
        $endpoint = $endpoints | Get-Random
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        
        try {
            $response = Invoke-WebRequest -Uri "$url$endpoint" -Method Get -TimeoutSec 5 -ErrorAction Stop
            $userResults.requests++
            $userResults.times += $sw.ElapsedMilliseconds
        } catch {
            $userResults.errors++
        }
        
        $sw.Stop()
        Start-Sleep -Milliseconds (Get-Random -Minimum 500 -Maximum 2000)
    }
    
    return $userResults
}

#Iniciar usuarios virtuales
Write-Host "[START] Iniciando $Users usuarios..." -ForegroundColor Yellow
for ($i = 1; $i -le $Users; $i++) {
    $jobs += Start-Job -ScriptBlock $scriptBlock -ArgumentList $BaseURL, $DurationSeconds
}

Write-Host "[RUNNING] Test en progreso..." -ForegroundColor Green
Write-Host ""

# Mostrar progreso
while ((Get-Job -State Running).Count -gt 0) {
    $elapsed = [math]::Round($stopwatch.Elapsed.TotalSeconds, 1)
    Write-Progress -Activity "Ejecutando Load Test" -Status "$elapsed / ${DurationSeconds}s" -PercentComplete (($elapsed / $DurationSeconds) * 100)
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "[DONE] Test completado" -ForegroundColor Green
Write-Host ""

# Recopilar resultados
foreach ($job in $jobs) {
    $jobResult = Receive-Job -Job $job
    $results.total += $jobResult.requests
    $results.success += $jobResult.requests
    $results.errors += $jobResult.errors
    $results.responseTimes += $jobResult.times
}

Remove-Job -Job $jobs

# Calcular estadisticas
$totalRequests = $results.total + $results.errors
$avgResponseTime = if ($results.responseTimes.Count -gt 0) { 
    ($results.responseTimes | Measure-Object -Average).Average 
} else { 0 }
$p95ResponseTime = if ($results.responseTimes.Count -gt 0) {
    $sorted = $results.responseTimes | Sort-Object
    $index = [math]::Floor($sorted.Count * 0.95)
    $sorted[$index]
} else { 0 }
$successRate = if ($totalRequests -gt 0) { 
    ($results.success / $totalRequests) * 100 
} else { 0 }
$requestsPerSec = $totalRequests / $DurationSeconds

# Mostrar resultados
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESULTADOS DEL TEST" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Total Requests:    $totalRequests" -ForegroundColor Yellow
Write-Host "  Exitosos:          $($results.success) ($([math]::Round($successRate, 2))%)" -ForegroundColor Green
Write-Host "  Errores:           $($results.errors)" -ForegroundColor $(if ($results.errors -gt 0) { "Red" } else { "Gray" })
Write-Host ""
Write-Host "  Requests/seg:      $([math]::Round($requestsPerSec, 2))" -ForegroundColor Cyan
Write-Host "  Tiempo promedio:   $([math]::Round($avgResponseTime, 0))ms" -ForegroundColor Cyan
Write-Host "  p95:               $([math]::Round($p95ResponseTime, 0))ms" -ForegroundColor Cyan
Write-Host ""

# Evaluacion
if ($successRate -ge 95 -and $p95ResponseTime -lt 2000) {
    Write-Host "  Estado: EXCELENTE" -ForegroundColor Green
} elseif ($successRate -ge 90 -and $p95ResponseTime -lt 3000) {
    Write-Host "  Estado: ACEPTABLE" -ForegroundColor Yellow
} else {
    Write-Host "  Estado: REQUIERE ATENCION" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ver metricas en Grafana: http://localhost:3002" -ForegroundColor Cyan
Write-Host ""
