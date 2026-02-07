# Script de Sincronizacion - Moovy
# Ejecutar: .\scripts\sync.ps1

param(
    [switch]$ResetDB,
    [switch]$SkipDev
)

Write-Host ""
Write-Host "[SYNC] SINCRONIZANDO PROYECTO MOOVY" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# 1. Detener procesos Node si estan corriendo
Write-Host "[STOP] Deteniendo procesos..." -ForegroundColor Yellow
taskkill /F /IM node.exe /T 2>$null

# 2. Actualizar codigo desde develop
Write-Host "[GIT] Actualizando codigo desde develop..." -ForegroundColor Yellow
git fetch origin
git pull origin develop

# 3. Instalar dependencias si cambiaron
Write-Host "[NPM] Verificando dependencias..." -ForegroundColor Yellow
npm install

# 4. Generar cliente Prisma
Write-Host "[PRISMA] Generando cliente Prisma..." -ForegroundColor Yellow
npx prisma generate

# 5. Sincronizar esquema y datos de base de datos
if ($ResetDB) {
    Write-Host "[DB] Reseteando base de datos completa..." -ForegroundColor Red
    docker exec -i moovy-db psql -U postgres -d moovy_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
    npx prisma db push
    npx prisma db seed
}
else {
    if (Test-Path "database_dump.sql") {
        Write-Host "[DB] Importando datos compartidos desde database_dump.sql..." -ForegroundColor Yellow
        # Limpiar antes de importar para evitar conflictos de "ya existe"
        docker exec -i moovy-db psql -U postgres -d moovy_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
        # Habilitar PostGIS (requerido para campo geography)
        docker exec -i moovy-db psql -U postgres -d moovy_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"
        Get-Content -Encoding UTF8 database_dump.sql | docker exec -i moovy-db psql -U postgres moovy_db
        Write-Host "[DB] Datos importados con exito." -ForegroundColor Green
    }
    else {
        Write-Host "[DB] Sincronizando esquema (no se encontro dump)..." -ForegroundColor Yellow
        npx prisma db push
    }
}

Write-Host ""
Write-Host "[OK] SINCRONIZACION COMPLETA" -ForegroundColor Green
Write-Host ""

# 6. Iniciar servidor de desarrollo
if (-not $SkipDev) {
    Write-Host "[DEV] Iniciando servidor de desarrollo..." -ForegroundColor Cyan
    npm run dev
}
