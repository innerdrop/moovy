# Script para iniciar la infraestructura de monitoreo (Prometheus + Grafana)
# Requisito: Docker Desktop instalado y corriendo

Write-Host "`n[MONITORING] MOOVY MONITORING SETUP" -ForegroundColor Cyan
Write-Host "====================================`n"

# Verificar si Docker está corriendo
docker ps > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Docker no está corriendo. Por favor inicia Docker Desktop." -ForegroundColor Red
    exit 1
}

# Iniciar contenedores
Write-Host "[START] Iniciando Prometheus + Grafana..." -ForegroundColor Yellow
docker compose -f docker-compose.monitoring.yml up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[OK] Infraestructura iniciada" -ForegroundColor Green
    
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  ACCESOS:" -ForegroundColor White
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  📊 Grafana:    http://localhost:3002" -ForegroundColor Yellow
    Write-Host "     Usuario:    admin" -ForegroundColor Gray
    Write-Host "     Password:   admin" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  📈 Prometheus: http://localhost:9090" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    Write-Host "`n[NEXT] Ejecutar tests con: .\scripts\run-load-tests.ps1" -ForegroundColor Cyan
} else {
    Write-Host "`n[ERROR] No se pudo iniciar la infraestructura." -ForegroundColor Red
}
