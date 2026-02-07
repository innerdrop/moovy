# Script de Reset de Base de Datos - Moovy
# Ejecutar: .\scripts\reset-db.ps1

Write-Host ""
Write-Host "[RESET] RESETEANDO BASE DE DATOS MOOVY" -ForegroundColor Red
Write-Host "=======================================" -ForegroundColor Red
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

# 3. Aplicar esquema actual
Write-Host "[PRISMA] Aplicando esquema Prisma..." -ForegroundColor Yellow
npx prisma db push

# 4. Ejecutar seed
Write-Host "[SEED] Ejecutando seed..." -ForegroundColor Yellow
npx prisma db seed

Write-Host ""
Write-Host "[OK] BASE DE DATOS REINICIADA" -ForegroundColor Green
Write-Host "[INFO] Credenciales: admin@somosmoovy.com / demo123" -ForegroundColor Cyan
Write-Host ""
