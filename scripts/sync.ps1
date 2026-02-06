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

# 5. Sincronizar esquema de base de datos
if ($ResetDB) {
    Write-Host "[DB] Reseteando base de datos..." -ForegroundColor Red
    docker exec -i moovy-db psql -U postgres -d moovy_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
    npx prisma db push
    npx prisma db seed
} else {
    Write-Host "[DB] Sincronizando esquema de base de datos..." -ForegroundColor Yellow
    npx prisma db push
}

Write-Host ""
Write-Host "[OK] SINCRONIZACION COMPLETA" -ForegroundColor Green
Write-Host ""

# 6. Iniciar servidor de desarrollo
if (-not $SkipDev) {
    Write-Host "[DEV] Iniciando servidor de desarrollo..." -ForegroundColor Cyan
    npm run dev
}
