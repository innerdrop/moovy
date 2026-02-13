# Script de Setup - Load Testing Infrastructure
# Ejecutar: .\scripts\setup-monitoring.ps1

param(
    [switch]$Stop
)

Write-Host ""
Write-Host "[MONITORING] MOOVY MONITORING SETUP" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

if ($Stop) {
    Write-Host "[STOP] Deteniendo infraestructura de monitoreo..." -ForegroundColor Yellow
    docker-compose -f docker-compose.monitoring.yml down
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Monitoreo detenido" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Error al detener monitoreo" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[START] Iniciando Prometheus + Grafana..." -ForegroundColor Yellow
    docker-compose -f docker-compose.monitoring.yml up -d
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Error al iniciar infraestructura" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "[OK] Infraestructura iniciada" -ForegroundColor Green
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  ACCESOS:" -ForegroundColor White
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  📊 Grafana:    http://localhost:3001" -ForegroundColor Yellow
    Write-Host "     Usuario:    admin" -ForegroundColor Gray
    Write-Host "     Password:   admin" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  📈 Prometheus: http://localhost:9090" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "[NEXT] Ejecutar tests con: .\scripts\run-load-tests.ps1" -ForegroundColor Cyan
}

Write-Host ""
