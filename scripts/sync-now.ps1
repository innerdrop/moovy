# Script para Sincronizar Mientras Trabajas - Moovy 3.0
# Uso: .\scripts\sync-now.ps1
# Ejecutar desde tu rama feature/* para traer cambios de develop

Write-Host ""
Write-Host "🔄 SYNC NOW - Sincronización en caliente" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar rama actual
$currentBranch = git branch --show-current

if ($currentBranch -eq "develop" -or $currentBranch -eq "main") {
    Write-Host "ℹ️ Estás en $currentBranch" -ForegroundColor Yellow
    Write-Host "   Este script es para sincronizar MIENTRAS trabajas en una feature/*" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Si querés sincronizar develop, usa:" -ForegroundColor Cyan
    Write-Host "   .\scripts\sync.ps1" -ForegroundColor White
    Write-Host ""
    exit 0
}

Write-Host "📍 Rama actual: $currentBranch" -ForegroundColor Gray
Write-Host ""

# 2. Guardar trabajo actual (por si acaso)
Write-Host "[1/4] Guardando tu trabajo actual..." -ForegroundColor Yellow
$hasChanges = git status --porcelain

if ($hasChanges) {
    git add .
    git commit -m "wip: guardar progreso antes de sync" 2>$null
    Write-Host "   ✅ Cambios guardados temporalmente" -ForegroundColor Green
} else {
    Write-Host "   No hay cambios sin guardar" -ForegroundColor Gray
}

# 3. Actualizar develop
Write-Host "[2/4] Descargando últimos cambios de develop..." -ForegroundColor Yellow
git checkout develop 2>$null
git pull origin develop --no-edit

# 4. Volver a tu rama
Write-Host "[3/4] Volviendo a tu rama..." -ForegroundColor Yellow
git checkout $currentBranch 2>$null

# 5. Mergear develop en tu rama
Write-Host "[4/4] Mergeando cambios en tu rama..." -ForegroundColor Yellow
git merge develop --no-edit 2>&1 | Out-Null

# Verificar conflictos
$status = git status --porcelain
$hasConflict = $status -match "^UU"

if ($hasConflict) {
    Write-Host ""
    Write-Host "⚠️ CONFLICTO DETECTADO" -ForegroundColor Yellow
    Write-Host "======================================" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "📄 Archivos en conflicto:" -ForegroundColor Yellow
    git diff --name-only --diff-filter=U | ForEach-Object {
        Write-Host "   - $_" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "🤖 SOLUCIÓN CON ANTIGRAVITY:" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Pedile a Antigravity:" -ForegroundColor White
    Write-Host ""
    Write-Host "---" -ForegroundColor DarkGray
    Write-Host "Tengo conflictos de merge en:" -ForegroundColor White
    git diff --name-only --diff-filter=U | ForEach-Object {
        Write-Host "- $_" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "Resuelve los conflictos combinando ambos cambios." -ForegroundColor White
    Write-Host "Después ejecuta:" -ForegroundColor White
    Write-Host "git add ." -ForegroundColor White
    Write-Host "git commit -m 'fix: resolver conflicto de sync'" -ForegroundColor White
    Write-Host "---" -ForegroundColor DarkGray
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "✅ SINCRONIZACIÓN COMPLETA" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host "✅ Cambios de develop integrados en tu rama" -ForegroundColor Green
Write-Host "✅ Estás en: $currentBranch" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Puedes seguir trabajando con Antigravity" -ForegroundColor Cyan
Write-Host ""
