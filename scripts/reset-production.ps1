# Reset de Base de Datos PRODUCCION - Moovy
# Ejecutar desde la raiz del proyecto en el VPS:
#   .\scripts\reset-production.ps1
#
# IMPORTANTE: Antes de ejecutar, configura tu contraseña:
#   $env:ADMIN_PASSWORD = "TuContraseñaActual"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Red
Write-Host "  RESET BASE DE DATOS - PRODUCCION" -ForegroundColor Red
Write-Host "=============================================" -ForegroundColor Red
Write-Host ""

# Verificar que ADMIN_PASSWORD esta configurada
if (-not $env:ADMIN_PASSWORD) {
    Write-Host "[X] ERROR: Debes configurar ADMIN_PASSWORD antes de ejecutar." -ForegroundColor Red
    Write-Host ""
    Write-Host '   $env:ADMIN_PASSWORD = "TuContraseña"' -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Doble confirmacion
Write-Host "[!] Esto va a BORRAR TODOS los datos de produccion." -ForegroundColor Yellow
Write-Host "    Solo quedara el admin maurod@me.com + configuracion operativa." -ForegroundColor Yellow
Write-Host ""
$confirm1 = Read-Host "Escribi RESET para continuar"
if ($confirm1 -ne "RESET") {
    Write-Host "[X] Operacion cancelada" -ForegroundColor Yellow
    exit
}

$errorSummary = @()
function Add-Error { param($msg) $script:errorSummary += $msg }

# 1. Vaciar schema y restaurar PostGIS
Write-Host ""
Write-Host "[1/4] Vaciando base de datos..." -ForegroundColor Yellow
docker exec -i moovy-db psql -U postgres -d moovy_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; CREATE EXTENSION IF NOT EXISTS postgis;"
if ($LASTEXITCODE -ne 0) { Add-Error "[DB] Error al vaciar el esquema" }

# 2. Reaplicar schema Prisma
Write-Host "[2/4] Aplicando schema Prisma..." -ForegroundColor Yellow
npx prisma db push --accept-data-loss
if ($LASTEXITCODE -ne 0) { Add-Error "[PRISMA] Error al aplicar db push" }

# 3. Generar Prisma Client (por si cambio el schema)
Write-Host "[3/4] Generando Prisma Client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) { Add-Error "[PRISMA] Error al generar client" }

# 4. Ejecutar seed de produccion
Write-Host "[4/4] Ejecutando seed de produccion..." -ForegroundColor Yellow
npx tsx prisma/seed-production.ts
if ($LASTEXITCODE -ne 0) { Add-Error "[SEED] Error en seed de produccion" }

# Reporte final
if ($errorSummary.Count -gt 0) {
    Write-Host ""
    Write-Host "--------------------------------------" -ForegroundColor Red
    Write-Host "[ERRORES DETECTADOS]" -ForegroundColor Red
    foreach ($err in $errorSummary) {
        Write-Host " - $err" -ForegroundColor Red
    }
    Write-Host "--------------------------------------" -ForegroundColor Red
} else {
    Write-Host ""
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host "  BASE DE DATOS RESETEADA" -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Admin: maurod@me.com" -ForegroundColor Cyan
    Write-Host "  Password: (la que configuraste en ADMIN_PASSWORD)" -ForegroundColor Cyan
    Write-Host "  Modo mantenimiento: ACTIVADO" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Incluye: StoreSettings, PointsConfig, MoovyConfig," -ForegroundColor Gray
    Write-Host "  categorias, loyalty tiers, delivery rates, soporte." -ForegroundColor Gray
    Write-Host ""
}
