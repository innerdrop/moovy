# Script para Finalizar Trabajo con Auto-Merge - Moovy 3.0
# Uso: .\scripts\quick-finish.ps1 -Message 'descripción de cambios'

param(
    [Parameter(Mandatory = $true)]
    [string]$Message
)

Write-Host ''
Write-Host '🏁 QUICK FINISH - Finalizando trabajo' -ForegroundColor Cyan
Write-Host '======================================' -ForegroundColor Cyan
Write-Host ''

# 1. Verificar rama actual
$currentBranch = git branch --show-current

if ($currentBranch -eq 'develop' -or $currentBranch -eq 'main') {
    Write-Host "❌ ERROR: Estas en $currentBranch" -ForegroundColor Red
    Write-Host '   Este script debe ejecutarse desde una rama feature/*' -ForegroundColor Yellow
    exit 1
}

Write-Host "📍 Rama actual: $currentBranch" -ForegroundColor Gray

# 2. Guardar todos los cambios
Write-Host '[1/6] Guardando cambios...' -ForegroundColor Yellow
git add .
git commit -m $Message 2>$null

# 3. Cambiar a develop y actualizar
Write-Host '[2/6] Actualizando develop...' -ForegroundColor Yellow
git checkout develop
git pull origin develop --no-edit

# 4. Intentar merge automático
Write-Host "[3/6] Mergeando $currentBranch a develop..." -ForegroundColor Yellow
git merge $currentBranch --no-edit 2>$null

# Verificar si hubo conflicto
$status = git status --porcelain
$hasConflict = $status -match '^UU'

if ($hasConflict) {
    Write-Host ''
    Write-Host '⚠️ CONFLICTO DETECTADO' -ForegroundColor Yellow
    Write-Host '======================================' -ForegroundColor Yellow
    Write-Host 'Pedir ayuda a Antigravity:' -ForegroundColor Cyan
    Write-Host 'Tengo un conflicto de merge. Por favor resuelve manteniendo ambos cambios.' -ForegroundColor White
    exit 1
}

# 5. Subir a GitHub
Write-Host '[4/6] Subiendo a GitHub...' -ForegroundColor Yellow
git push origin develop

if ($LASTEXITCODE -ne 0) {
    Write-Host '❌ Error al subir a GitHub' -ForegroundColor Red
    exit 1
}

# 6. Borrar rama local
Write-Host "[5/6] Eliminando rama $currentBranch..." -ForegroundColor Yellow
git branch -d $currentBranch 2>$null
git push origin --delete $currentBranch 2>$null

Write-Host '[6/6] Limpieza completa' -ForegroundColor Green
Write-Host ''
Write-Host '✅ FINALIZADO EXITOSAMENTE' -ForegroundColor Green
Write-Host "✅ Rama $currentBranch mergeada y eliminada" -ForegroundColor Green
Write-Host ''
