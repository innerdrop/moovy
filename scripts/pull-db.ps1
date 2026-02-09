# Script para Traer Base de Datos de Producción a Local - Moovy
# Ejecutar: .\scripts\pull-db.ps1

Write-Host ""
Write-Host "[PULL-DB] DESCARGANDO DATOS DE PRODUCCION" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Colector de errores
$errorSummary = @()
function Add-Error { param($msg) $script:errorSummary += $msg }

# Configuración del VPS (Hostinger)
$VPS_HOST = "31.97.14.156"
$VPS_USER = "root"
$VPS_PATH = "/var/www/moovy"

# 1. Generar dump en el servidor
Write-Host "[VPS] Generando dump en el servidor remoto..." -ForegroundColor Yellow
$remoteCommand = "cd $VPS_PATH && docker exec moovy-db pg_dump -U postgres moovy_db > prod_dump.sql"
ssh "$VPS_USER@$VPS_HOST" "$remoteCommand"

if ($LASTEXITCODE -ne 0) {
    Add-Error "[VPS] Error al generar el dump en el servidor remoto"
} else {
    # 2. Descargar el archivo a la PC local
    Write-Host "[SCP] Descargando dump a la PC local..." -ForegroundColor Yellow
    scp "$VPS_USER@${VPS_HOST}:$VPS_PATH/prod_dump.sql" "$(Get-Location)\database_dump.sql"
    
    if ($LASTEXITCODE -ne 0) {
        Add-Error "[SCP] Error al descargar el archivo desde el VPS"
    } else {
        # 3. Reparar caracteres (opcional, por seguridad)
        if (Test-Path ".\scripts\repair-charset.ps1") {
            Write-Host "[REPAIR] Verificando codificación del archivo descargado..." -ForegroundColor Yellow
            .\scripts\repair-charset.ps1
        }
        
        Write-Host ""
        Write-Host "[OK] BASE DE DATOS DESCARGADA EXITOSAMENTE" -ForegroundColor Green
        Write-Host "[INFO] Ahora podés ejecutar .\scripts\sync.ps1 para cargar los datos en tu Docker local." -ForegroundColor Cyan
    }
}

# Reporte final
if ($errorSummary.Count -gt 0) {
    Write-Host "`n--------------------------------------" -ForegroundColor Red
    Write-Host "[REPORTE DE ERRORES]" -ForegroundColor Red
    foreach ($err in $errorSummary) {
        Write-Host " - $err" -ForegroundColor Red
    }
    Write-Host "--------------------------------------" -ForegroundColor Red
}
Write-Host ""
