# Script para pasar cambios de develop a main + Deploy a VPS
# Uso:
#   .\scripts\devmain.ps1              → Deploy código + schema (modo seguro por defecto)
#   .\scripts\devmain.ps1 -NoDB        → Deploy solo código (no toca la base de datos)
#   .\scripts\devmain.ps1 -SchemaOnly  → Deploy código + solo actualizar schema (prisma db push)
#   .\scripts\devmain.ps1 -CleanProd   → Deploy código + DB limpia + seed producción (PRIMERA VEZ o RESET)
#   .\scripts\devmain.ps1 -SyncLocal   → Deploy código + sincronizar DB local → producción (PELIGROSO)

param(
    [switch]$NoDB,
    [switch]$SchemaOnly,
    [switch]$CleanProd,
    [switch]$SyncLocal
)

Write-Host "`n[DEPLOY] PASANDO CAMBIOS A MAIN + VPS" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

if ($NoDB) {
    Write-Host "[MODO] Solo código (la base de datos NO se toca)" -ForegroundColor Magenta
} elseif ($CleanProd) {
    Write-Host "[MODO] DB LIMPIA + Seed de producción" -ForegroundColor Red
    Write-Host "Esto va a BORRAR toda la base de datos de producción y crear una nueva con el seed." -ForegroundColor Red
    Write-Host ""
    $confirm = Read-Host "ATENCION: Esto ELIMINA todos los datos de produccion (usuarios, pedidos, todo). Continuar? (S/N)"
    if ($confirm -ne "S") {
        Write-Host "[CANCELADO] Deploy cancelado." -ForegroundColor Yellow
        exit
    }
} elseif ($SyncLocal) {
    Write-Host "[MODO] Código + sincronización completa de DB (REEMPLAZA datos de producción)" -ForegroundColor Red
    Write-Host ""
    $confirm = Read-Host "ATENCION: Esto va a REEMPLAZAR la base de datos de produccion con tu base local. Continuar? (S/N)"
    if ($confirm -ne "S") {
        Write-Host "[CANCELADO] Deploy cancelado. Usa -NoDB o -SchemaOnly si solo queres subir código." -ForegroundColor Yellow
        exit
    }
} elseif ($SchemaOnly) {
    Write-Host "[MODO] Código + schema DB (los datos de producción se mantienen)" -ForegroundColor Magenta
} else {
    # Por defecto: SchemaOnly (modo seguro)
    Write-Host "[MODO] Código + schema DB (modo seguro por defecto)" -ForegroundColor Magenta
    $SchemaOnly = $true
}

# Colector de errores
$errorSummary = @()
function Add-Error { param($msg) $script:errorSummary += $msg }

# Configuración del VPS (Hostinger)
$VPS_HOST = "31.97.14.156"
$VPS_USER = "root"
$VPS_PATH = "/var/www/moovy"
$VPS_DB_PORT = "5436"
$VPS_DB_USER = "postgres"
$VPS_DB_NAME = "moovy_db"

# 0. Asegurar que estamos en develop y sincronizados
Write-Host "[GIT] Sincronizando develop con origin..." -ForegroundColor Yellow
git checkout develop 2>$null
git pull origin develop --no-edit
if ($LASTEXITCODE -ne 0) { Add-Error "[GIT] Error al actualizar develop" }

# 1. Exportar base de datos local (solo si vamos a sincronizar DB local → producción)
if ($SyncLocal) {
    Write-Host "[DB] Exportando base de datos local (UTF-8)..." -ForegroundColor Yellow
    try {
        $dump = docker exec moovy-db pg_dump -U postgres --clean --if-exists moovy_db
        [System.IO.File]::WriteAllLines("$(Get-Location)\database_dump.sql", $dump)
    } catch {
        Add-Error "[DB] Error al exportar la base de datos local"
    }
}

# 2. Verificar si hay cambios y guardarlos
$status = git status --porcelain
if ($status) {
    Write-Host "[GIT] Guardando cambios pendientes..." -ForegroundColor Yellow
    git add .
    git commit -m "sync: actualización previa a deploy"
    git push origin develop
    if ($LASTEXITCODE -ne 0) { Add-Error "[GIT] Error al subir cambios a develop" }
}

# 3. Ir a main y traer cambios remotos
Write-Host "[GIT] Sincronizando main..." -ForegroundColor Yellow
git checkout main
git pull origin main --no-edit

# 4. Mergear develop en main
Write-Host "[GIT] Mergeando develop -> main..." -ForegroundColor Yellow
git merge develop --no-edit -m "deploy: actualización desde develop ($(Get-Date -Format 'yyyy-MM-dd HH:mm'))"
if ($LASTEXITCODE -ne 0) {
    Add-Error "[GIT] Conflictos al mergear develop en main"
    Write-Host "`n[ERROR] Conflictos detectados. Resolvelos manualmente." -ForegroundColor Red
    exit
}

# 5. Subir cambios a GitHub
Write-Host "[GIT] Subiendo main a GitHub..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -ne 0) { Add-Error "[GIT] Error al subir main a GitHub" }

# 6. AUTO-DEPLOY A VPS
Write-Host "`n[VPS] Iniciando despliegue remoto en Hostinger..." -ForegroundColor Cyan
Write-Host "----------------------------------------------" -ForegroundColor Cyan

# Construir comando remoto según el modo
$remoteCommand = "cd $VPS_PATH && " +
    "git fetch origin main && " +
    "git reset --hard origin/main && " +
    "npm install && " +
    "npx prisma generate"

if ($CleanProd) {
    # MODO CLEAN: borrar DB, crear schema, ejecutar seed de producción
    Write-Host "[DB] Limpiando DB de producción y ejecutando seed..." -ForegroundColor Yellow

    $adminPass = if ($env:OPS_LOGIN_PASSWORD) { $env:OPS_LOGIN_PASSWORD } else { $env:ADMIN_PASSWORD }
    if (-not $adminPass) {
        Write-Host "[ERROR] Debes configurar OPS_LOGIN_PASSWORD (o ADMIN_PASSWORD) antes de usar -CleanProd" -ForegroundColor Red
        Write-Host '  $env:OPS_LOGIN_PASSWORD = "TuClaveSegura123"' -ForegroundColor Yellow
        exit
    }

    $remoteCommand += " && " +
        "PGPASSWORD=postgres psql -h 127.0.0.1 -p $VPS_DB_PORT -U $VPS_DB_USER -d $VPS_DB_NAME -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public; CREATE EXTENSION IF NOT EXISTS postgis;' && " +
        "npx prisma db push --accept-data-loss && " +
        "ADMIN_PASSWORD='$($adminPass)' npx tsx prisma/seed-production.ts"
} elseif ($SyncLocal) {
    # MODO SYNC LOCAL: subir dump y reemplazar DB (legacy, PELIGROSO)
    Write-Host "[DB] Subiendo base de datos local al servidor..." -ForegroundColor Yellow
    scp database_dump.sql "$VPS_USER@${VPS_HOST}:$VPS_PATH/"
    if ($LASTEXITCODE -ne 0) { Add-Error "[DB] Error al subir el dump al VPS (SCP)" }

    $remoteCommand += " && " +
        "sed -i 's/\r$//' database_dump.sql && " +
        "PGPASSWORD=postgres psql -h 127.0.0.1 -p $VPS_DB_PORT -U $VPS_DB_USER -d $VPS_DB_NAME -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public; CREATE EXTENSION IF NOT EXISTS postgis;' && " +
        "PGPASSWORD=postgres psql -h 127.0.0.1 -p $VPS_DB_PORT -U $VPS_DB_USER -d $VPS_DB_NAME < database_dump.sql"
} elseif ($SchemaOnly) {
    # MODO SCHEMA: solo actualizar estructura, no tocar datos
    Write-Host "[DB] Aplicando cambios de schema en producción (prisma db push)..." -ForegroundColor Yellow
    $remoteCommand += " && npx prisma db push --accept-data-loss"
}
# MODO NoDB: no se agrega nada de DB

# Build y restart siempre
$remoteCommand += " && npm run build && pm2 restart moovy"

Write-Host "[VPS] Ejecutando deploy remoto..." -ForegroundColor Yellow
ssh "$VPS_USER@$VPS_HOST" "$remoteCommand"
if ($LASTEXITCODE -ne 0) { Add-Error "[VPS] Error en los comandos remotos" }

if ($LASTEXITCODE -eq 0) {
    $modeLabel = if ($NoDB) { "Solo Código" } elseif ($CleanProd) { "DB Limpia + Seed" } elseif ($SyncLocal) { "Sync DB Local" } elseif ($SchemaOnly) { "Código + Schema" } else { "Código + Schema" }
    Write-Host "`n[OK] DESPLIEGUE COMPLETO ($modeLabel)" -ForegroundColor Green
} else {
    Write-Host "`n[ERROR] El despliegue falló. Revisá la conexión SSH o los logs." -ForegroundColor Red
}

# 7. Volver a develop
Write-Host "`n[GIT] Volviendo a develop..." -ForegroundColor Yellow
git checkout develop

Write-Host "`n[FINALIZADO] Proceso terminado." -ForegroundColor Green

if ($errorSummary.Count -gt 0) {
    Write-Host "`n--------------------------------------" -ForegroundColor Red
    Write-Host "[REPORTE DE ERRORES]" -ForegroundColor Red
    foreach ($err in $errorSummary) {
        Write-Host " - $err" -ForegroundColor Red
    }
    Write-Host "--------------------------------------" -ForegroundColor Red
    Write-Host "`nRevisá los fallos arriba mencionados." -ForegroundColor Yellow
} else {
    Write-Host "`n[OK] Todo se ejecutó sin problemas." -ForegroundColor Green
    Write-Host "Tu app está actualizada en: https://somosmoovy.com" -ForegroundColor Gray
}
Write-Host ""