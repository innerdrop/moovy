# Script para Sincronizar Mientras Trabajas - Moovy 3.0
# Uso: .\scripts\sync-now.ps1

Write-Host ''
Write-Host '🔄 SYNC NOW - Sincronizacion en caliente' -ForegroundColor Cyan
Write-Host '=========================================' -ForegroundColor Cyan
Write-Host ''

# 1. Verificar rama actual
$currentBranch = git branch --show-current

if ($currentBranch -eq 'develop' -or $currentBranch -eq 'main') {
    Write-Host 'ℹ️ No estas en una rama de trabajo (feature/*)' -ForegroundColor Yellow
    exit 0
}

Write-Host "📍 Rama actual: $currentBranch" -ForegroundColor Gray

# 2. Guardar trabajo actual
Write-Host '[1/4] Guardando tu trabajo actual...' -ForegroundColor Yellow
git add .
git commit -m 'wip: sync' 2>$null

# 3. Actualizar develop
Write-Host '[2/4] Descargando cambios de develop...' -ForegroundColor Yellow
git checkout develop
git pull origin develop --no-edit

# 4. Volver a tu rama y mergear
Write-Host '[3/4] Volviendo a tu rama...' -ForegroundColor Yellow
git checkout $currentBranch
Write-Host '[4/4] Mergeando cambios en tu rama...' -ForegroundColor Yellow
git merge develop --no-edit 2>$null

# Verificar conflictos
$status = git status --porcelain
$hasConflict = $status -match '^UU'

if ($hasConflict) {
    Write-Host ''
    Write-Host '⚠️ CONFLICTO DETECTADO' -ForegroundColor Yellow
    Write-Host 'Llama a Antigravity para resolver el conflicto.' -ForegroundColor Cyan
    exit 1
}

Write-Host ''
Write-Host '✅ SINCRONIZACION COMPLETA' -ForegroundColor Green
Write-Host "✅ Estas en: $currentBranch" -ForegroundColor Green
Write-Host ''
