# Script para Finalizar Cambios y Mergear a Develop - Moovy
# Ejecutar: .\scripts\finish.ps1

param(
    [Parameter(Mandatory = $false)]
    [string]$Message
)

Write-Host ""
Write-Host "[FINISH] FINALIZANDO CAMBIOS" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

# Colector de errores
$errorSummary = @()
function Add-Error { param($msg) $script:errorSummary += $msg }
Write-Host ""

# 1. Verificar rama actual
$currentBranch = git branch --show-current
Write-Host "[INFO] Rama actual: $currentBranch" -ForegroundColor Gray

if ($currentBranch -eq "main" -or $currentBranch -eq "develop") {
    Write-Host "[ERROR] Debes estar en una rama feature/fix/hotfix, no en $currentBranch" -ForegroundColor Red
    exit 1
}

# 2. Pedir mensaje de commit si no se proporciono
if ([string]::IsNullOrWhiteSpace($Message)) {
    Write-Host ""
    $Message = Read-Host "Descripcion del cambio (ej: implementar login de comercio)"
    
    if ([string]::IsNullOrWhiteSpace($Message)) {
        Write-Host "[ERROR] El mensaje no puede estar vacio" -ForegroundColor Red
        exit 1
    }
}

# 2. Exportar Base de Datos
Write-Host "[DB] Exportando base de datos..." -ForegroundColor Yellow
docker exec moovy-db pg_dump -U postgres moovy_db > database_dump.sql

# 3. Guardar cambios en la rama actual
Write-Host "[GIT] Guardando cambios en $currentBranch..." -ForegroundColor Yellow
git add .
git commit -m $Message
git push origin $currentBranch
if ($LASTEXITCODE -ne 0) { Add-Error "[GIT] Error al subir cambios a $currentBranch" }

# 4. Cambiar a develop y actualizar
Write-Host "[GIT] Actualizando develop..." -ForegroundColor Yellow
git checkout develop
git pull origin develop

# 5. Mergear la rama de trabajo
Write-Host "[GIT] Mergeando $currentBranch a develop..." -ForegroundColor Yellow
git merge $currentBranch --no-edit
if ($LASTEXITCODE -ne 0) { Add-Error "[GIT] Conflictos al mergear $currentBranch en develop" }

# 6. Subir develop
Write-Host "[GIT] Subiendo develop..." -ForegroundColor Yellow
git push origin develop
if ($LASTEXITCODE -ne 0) { Add-Error "[GIT] Error al subir develop" }

if ($errorSummary.Count -gt 0) {
    Write-Host "`n--------------------------------------" -ForegroundColor Red
    Write-Host "[REPORTE DE ERRORES]" -ForegroundColor Red
    foreach ($err in $errorSummary) {
        Write-Host " - $err" -ForegroundColor Red
    }
    Write-Host "--------------------------------------" -ForegroundColor Red
    Write-Host "`nPor favor, resolvélos antes de continuar." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "[OK] CAMBIOS FINALIZADOS Y PUBLICADOS" -ForegroundColor Green
    Write-Host "[INFO] La rama $currentBranch fue mergeada a develop" -ForegroundColor Cyan
    Write-Host "[INFO] Tu companero puede ejecutar: .\scripts\sync.ps1" -ForegroundColor Cyan
    Write-Host ""
}

# 7. Preguntar si eliminar la rama
$delete = Read-Host "Eliminar la rama $currentBranch? (s/n)"
if ($delete -eq "s") {
    git branch -d $currentBranch
    git push origin --delete $currentBranch 2>$null
    Write-Host "[OK] Rama eliminada" -ForegroundColor Green
}
