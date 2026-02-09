# Script de Reset de Base de Datos - Moovy
# Ejecutar: .\scripts\reset-db.ps1

Write-Host ""
Write-Host "[RESET] RESETEANDO BASE DE DATOS MOOVY" -ForegroundColor Red
Write-Host "=======================================" -ForegroundColor Red

# Colector de errores
$errorSummary = @()
function Add-Error { param($msg) $script:errorSummary += $msg }
Write-Host ""

# Confirmar accion
$confirm = Read-Host "Estas seguro? Esto borrara TODOS los datos locales (s/n)"
if ($confirm -ne "s") {
    Write-Host "[X] Operacion cancelada" -ForegroundColor Yellow
    exit
}

# 1. Detener procesos Node
Write-Host "[STOP] Deteniendo procesos..." -ForegroundColor Yellow
taskkill /F /IM node.exe /T 2>$null

# 2. Limpiar esquema
Write-Host "[DB] Limpiando base de datos..." -ForegroundColor Yellow
docker exec -i moovy-db psql -U postgres -d moovy_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
if ($LASTEXITCODE -ne 0) { Add-Error "[DB] Error al resetear el esquema" }

# 3. Aplicar esquema actual
Write-Host "[PRISMA] Aplicando esquema Prisma..." -ForegroundColor Yellow
npx prisma db push
if ($LASTEXITCODE -ne 0) { Add-Error "[PRISMA] Error al aplicar db push" }

# 4. Ejecutar seed
Write-Host "[SEED] Ejecutando seed..." -ForegroundColor Yellow
npx prisma db seed

if ($errorSummary.Count -gt 0) {
    Write-Host "`n--------------------------------------" -ForegroundColor Red
    Write-Host "[REPORTE DE ERRORES]" -ForegroundColor Red
    foreach ($err in $errorSummary) {
        Write-Host " - $err" -ForegroundColor Red
    }
    Write-Host "--------------------------------------" -ForegroundColor Red
} else {
    Write-Host ""
    Write-Host "[OK] BASE DE DATOS REINICIADA" -ForegroundColor Green
    Write-Host "[INFO] Credenciales: admin@somosmoovy.com / demo123" -ForegroundColor Cyan
    Write-Host ""
}
