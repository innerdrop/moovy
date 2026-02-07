# Script para pasar cambios de develop a main (Auto-Mode) + Deploy a VPS + Sync DB
# Uso: .\scripts\devmain.ps1

Write-Host "`n[DEPLOY] PASANDO CAMBIOS A MAIN + VPS" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Configuración del VPS (Hostinger)
$VPS_HOST = "31.97.14.156"
$VPS_USER = "root"
$VPS_PATH = "/var/www/moovy"
$VPS_DB_PORT = "5436"
$VPS_DB_USER = "postgres"
$VPS_DB_NAME = "moovy_db"

# 0. Verificar si hay cambios sin guardar
$status = git status --porcelain
if ($status) {
    Write-Host "[GIT] Guardando cambios pendientes..." -ForegroundColor Yellow
    git add .
    git commit -m "sync: cambios automáticos antes de deploy"
}

# 1. Exportar base de datos local
Write-Host "[DB] Exportando base de datos local..." -ForegroundColor Yellow
docker exec moovy-db pg_dump -U postgres moovy_db > database_dump.sql

# 2. Asegurar que estamos en develop y actualizados
Write-Host "[GIT] Actualizando develop..." -ForegroundColor Yellow
git checkout develop
git pull origin develop --no-edit

# 3. Ir a main y traer cambios remotos
Write-Host "[GIT] Actualizando main..." -ForegroundColor Yellow
git checkout main
git pull origin main --no-edit

# 4. Mergear develop en main
Write-Host "[GIT] Mergenado develop -> main (No-Edit)..." -ForegroundColor Yellow
git merge develop --no-edit -m "deploy: actualización desde develop ($(Get-Date -Format 'yyyy-MM-dd HH:mm'))"

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[ERROR] Conflictos detectados. Por favor resolvelos manualmente." -ForegroundColor Red
    exit
}

# 5. Subir cambios a GitHub
Write-Host "[GIT] Subiendo main a GitHub..." -ForegroundColor Yellow
git push origin main

# 6. AUTO-DEPLOY A VPS (Hostinger)
Write-Host "`n[VPS] Iniciando despliegue remoto en Hostinger..." -ForegroundColor Cyan
Write-Host "----------------------------------------------" -ForegroundColor Cyan

# 6a. Subir el dump de la base de datos al servidor
Write-Host "[DB] Subiendo base de datos al servidor..." -ForegroundColor Yellow
scp database_dump.sql "$VPS_USER@${VPS_HOST}:$VPS_PATH/"

# 6b. Ejecutar comandos en el servidor
Write-Host "[VPS] Actualizando código y base de datos..." -ForegroundColor Yellow

$remoteCommand = "cd $VPS_PATH && " +
                 "git fetch origin main && " +
                 "git reset --hard origin/main && " +
                 "npm install && " +
                 "npx prisma generate && " +
                 "npx prisma db push && " +
                 "PGPASSWORD=postgres psql -h 127.0.0.1 -p $VPS_DB_PORT -U $VPS_DB_USER -d $VPS_DB_NAME < database_dump.sql && " +
                 "npm run build && " +
                 "pm2 restart moovy"

ssh "$VPS_USER@$VPS_HOST" "$remoteCommand"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[OK] DESPLIEGUE COMPLETO (Código + Base de Datos)" -ForegroundColor Green
} else {
    Write-Host "`n[ERROR] El despliegue en el VPS falló. Revisá la conexión SSH o los logs del servidor." -ForegroundColor Red
}

# 7. Volver a develop
Write-Host "`n[GIT] Volviendo a develop..." -ForegroundColor Yellow
git checkout develop

Write-Host "`n[FINALIZADO] Código y datos sincronizados con producción." -ForegroundColor Green
Write-Host "Tu app está actualizada en: https://moovy.com.ar (o tu dominio)" -ForegroundColor Gray
