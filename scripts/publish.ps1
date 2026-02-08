# Script para Guardar y Publicar Cambios - Moovy
# Ejecutar: .\scripts\publish.ps1

param(
    [Parameter(Mandatory = $true)]
    [string]$Message
)

Write-Host ""
Write-Host "[PUBLISH] GUARDANDO Y PUBLICANDO CAMBIOS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar rama actual
$currentBranch = git branch --show-current
Write-Host "[INFO] Rama actual: $currentBranch" -ForegroundColor Gray

if ($currentBranch -eq "main") {
    Write-Host "[ERROR] No se puede publicar directo a main. Usa una rama feature/*" -ForegroundColor Red
    exit 1
}

# 2. Exportar Base de Datos
Write-Host "[DB] Exportando base de datos a database_dump.sql (UTF-8)..." -ForegroundColor Yellow
$dump = docker exec moovy-db pg_dump -U postgres moovy_db
[System.IO.File]::WriteAllLines("$(Get-Location)\database_dump.sql", $dump)

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

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Error al subir a GitHub. Verifica tu conexion." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[OK] CAMBIOS PUBLICADOS EXITOSAMENTE" -ForegroundColor Green
Write-Host "[INFO] Tu companero puede ejecutar: .\scripts\sync.ps1" -ForegroundColor Cyan
Write-Host ""
