# Script para Guardar y Publicar Cambios - Moovy
# Ejecutar: .\scripts\publish.ps1

param(
    [Parameter(Mandatory = $true)]
    [string]$Message
)

Write-Host ""
Write-Host "[PUBLISH] GUARDANDO Y PUBLICANDO CAMBIOS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Colector de errores
$errorSummary = @()
function Add-Error { param($msg) $script:errorSummary += $msg }
Write-Host ""

# 1. Verificar rama actual
$currentBranch = git branch --show-current
Write-Host "[INFO] Rama actual: $currentBranch" -ForegroundColor Gray

if ($currentBranch -eq "main") {
    Write-Host "[ERROR] No se puede publicar directo a main. Usa una rama feature/*" -ForegroundColor Red
    exit 1
}

# 2. Exportar Base de Datos (UTF-8 raw)
# fix/utf8-encoding-pipeline (2026-04-30): generamos el dump dentro del container
# y lo copiamos con docker cp (bytes raw). Antes capturabamos el stdout de pg_dump
# en una variable de PowerShell, lo cual reinterpretaba los bytes UTF-8 con el
# codepage de Windows y rompia los acentos. Con docker cp el archivo nunca pasa
# por la consola, queda en UTF-8 puro.
Write-Host "[DB] Exportando base de datos a database_dump.sql (UTF-8 raw via docker cp)..." -ForegroundColor Yellow
try {
    docker exec moovy-db pg_dump -U postgres -f /tmp/moovy_dump.sql moovy_db
    if ($LASTEXITCODE -ne 0) { throw "pg_dump fallo dentro del container (codigo $LASTEXITCODE)" }
    docker cp moovy-db:/tmp/moovy_dump.sql "$(Get-Location)\database_dump.sql"
    if ($LASTEXITCODE -ne 0) { throw "docker cp del dump fallo (codigo $LASTEXITCODE)" }
    docker exec moovy-db rm -f /tmp/moovy_dump.sql | Out-Null
} catch {
    Add-Error "[DB] Error al exportar la base de datos local: $_"
}

# 3. Mostrar archivos modificados
Write-Host ""
Write-Host "[CHANGES] Archivos modificados:" -ForegroundColor Yellow
git status --short
Write-Host ""

# 4. Agregar todos los cambios (incluyendo el nuevo dump)
Write-Host "[GIT] Agregando cambios..." -ForegroundColor Yellow
git add .

# 5. Crear commit
Write-Host "[GIT] Creando commit..." -ForegroundColor Yellow
git commit -m $Message

# 6. Push a origin
Write-Host "[GIT] Subiendo a GitHub..." -ForegroundColor Yellow
git push origin $currentBranch
if ($LASTEXITCODE -ne 0) { Add-Error "[GIT] Error al subir a GitHub" }

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Error al subir a GitHub. Verifica tu conexion." -ForegroundColor Red
    exit 1
}

if ($errorSummary.Count -gt 0) {
    Write-Host "`n--------------------------------------" -ForegroundColor Red
    Write-Host "[REPORTE DE ERRORES]" -ForegroundColor Red
    foreach ($err in $errorSummary) {
        Write-Host " - $err" -ForegroundColor Red
    }
    Write-Host "--------------------------------------" -ForegroundColor Red
} else {
    Write-Host ""
    Write-Host "[OK] CAMBIOS PUBLICADOS EXITOSAMENTE" -ForegroundColor Green
    Write-Host "[INFO] Tu companero puede ejecutar: .\scripts\sync.ps1" -ForegroundColor Cyan
    Write-Host ""
}
