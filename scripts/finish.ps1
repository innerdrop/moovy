# Script para Finalizar Cambios y Mergear a Develop - Moovy
# Ejecutar: .\scripts\finish.ps1

param(
    [Parameter(Mandatory = $true)]
    [string]$Message
)

Write-Host ""
Write-Host "[FINISH] FINALIZANDO CAMBIOS" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar rama actual
$currentBranch = git branch --show-current
Write-Host "[INFO] Rama actual: $currentBranch" -ForegroundColor Gray

if ($currentBranch -eq "main" -or $currentBranch -eq "develop") {
    Write-Host "[ERROR] Debes estar en una rama feature/fix/hotfix, no en $currentBranch" -ForegroundColor Red
    exit 1
}

# 2. Exportar Base de Datos
Write-Host "[DB] Exportando base de datos..." -ForegroundColor Yellow
docker exec moovy-db pg_dump -U postgres moovy_db > database_dump.sql

# 3. Guardar cambios en la rama actual
Write-Host "[GIT] Guardando cambios en $currentBranch..." -ForegroundColor Yellow
git add .
git commit -m $Message
git push origin $currentBranch

# 4. Cambiar a develop y actualizar
Write-Host "[GIT] Actualizando develop..." -ForegroundColor Yellow
git checkout develop
git pull origin develop

# 5. Mergear la rama de trabajo
Write-Host "[GIT] Mergeando $currentBranch a develop..." -ForegroundColor Yellow
git merge $currentBranch --no-edit

# 6. Subir develop
Write-Host "[GIT] Subiendo develop..." -ForegroundColor Yellow
git push origin develop

Write-Host ""
Write-Host "[OK] CAMBIOS FINALIZADOS Y PUBLICADOS" -ForegroundColor Green
Write-Host "[INFO] La rama $currentBranch fue mergeada a develop" -ForegroundColor Cyan
Write-Host "[INFO] Tu companero puede ejecutar: .\scripts\sync.ps1" -ForegroundColor Cyan
Write-Host ""

# 7. Preguntar si eliminar la rama
$delete = Read-Host "Eliminar la rama $currentBranch? (s/n)"
if ($delete -eq "s") {
    git branch -d $currentBranch
    git push origin --delete $currentBranch 2>$null
    Write-Host "[OK] Rama eliminada" -ForegroundColor Green
}
