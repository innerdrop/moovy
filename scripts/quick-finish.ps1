# Script para Finalizar Trabajo con Auto-Merge - Moovy 3.0
# Uso: .\scripts\quick-finish.ps1 -Message "descripción de cambios"
# Ejemplo: .\scripts\quick-finish.ps1 -Message "sistema de notificaciones push"

param(
    [Parameter(Mandatory = $true)]
    [string]$Message
)

Write-Host ""
Write-Host "🏁 QUICK FINISH - Finalizando trabajo" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar rama actual
$currentBranch = git branch --show-current

if ($currentBranch -eq "develop" -or $currentBranch -eq "main") {
    Write-Host "❌ ERROR: Estás en $currentBranch" -ForegroundColor Red
    Write-Host "   Este script debe ejecutarse desde una rama feature/*" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Primero ejecuta: .\scripts\quick-start.ps1 -Feature `"nombre`"" -ForegroundColor Cyan
    exit 1
}

Write-Host "📍 Rama actual: $currentBranch" -ForegroundColor Gray
Write-Host ""

# 2. Guardar todos los cambios
Write-Host "[1/6] Guardando cambios..." -ForegroundColor Yellow
git add .
git commit -m $Message 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "   No hay cambios nuevos para commitear" -ForegroundColor Gray
}

# 3. Cambiar a develop y actualizar
Write-Host "[2/6] Actualizando develop..." -ForegroundColor Yellow
git checkout develop
git pull origin develop --no-edit

# 4. Intentar merge automático
Write-Host "[3/6] Mergeando $currentBranch a develop..." -ForegroundColor Yellow
git merge $currentBranch --no-edit 2>&1 | Out-Null

# Verificar si hubo conflicto
$status = git status --porcelain
$hasConflict = $status -match "^UU"

if ($hasConflict) {
    Write-Host ""
    Write-Host "⚠️ CONFLICTO DETECTADO" -ForegroundColor Yellow
    Write-Host "======================================" -ForegroundColor Yellow
    Write-Host ""
    
    # Listar archivos en conflicto
    Write-Host "📄 Archivos en conflicto:" -ForegroundColor Yellow
    git diff --name-only --diff-filter=U | ForEach-Object {
        Write-Host "   - $_" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "🤖 SOLUCIÓN AUTOMÁTICA CON ANTIGRAVITY:" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Copia y pega esto a Antigravity:" -ForegroundColor White
    Write-Host ""
    Write-Host "---" -ForegroundColor DarkGray
    Write-Host "Tengo un conflicto de merge en estos archivos:" -ForegroundColor White
    git diff --name-only --diff-filter=U | ForEach-Object {
        Write-Host "- $_" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "Por favor resuelve el conflicto manteniendo ambos cambios si es posible." -ForegroundColor White
    Write-Host "Después ejecuta:" -ForegroundColor White
    Write-Host "git add ." -ForegroundColor White
    Write-Host "git commit -m 'fix: resolver conflicto de merge'" -ForegroundColor White
    Write-Host "git push origin develop" -ForegroundColor White
    Write-Host "---" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "Después de que Antigravity resuelva el conflicto, ejecuta manualmente:" -ForegroundColor Cyan
    Write-Host "   git branch -d $currentBranch" -ForegroundColor White
    Write-Host ""
    exit 1
}

# 5. Subir a GitHub
Write-Host "[4/6] Subiendo a GitHub..." -ForegroundColor Yellow
git push origin develop

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al subir a GitHub" -ForegroundColor Red
    Write-Host "   Verifica tu conexión a internet" -ForegroundColor Yellow
    exit 1
}

# 6. Borrar rama local
Write-Host "[5/6] Eliminando rama $currentBranch..." -ForegroundColor Yellow
git branch -d $currentBranch 2>$null

# Opcional: borrar rama remota si existe
git push origin --delete $currentBranch 2>$null

Write-Host "[6/6] Limpieza completa" -ForegroundColor Green
Write-Host ""
Write-Host "✅ FINALIZADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host "✅ Cambios mergeados a develop" -ForegroundColor Green
Write-Host "✅ Subido a GitHub" -ForegroundColor Green
Write-Host "✅ Rama $currentBranch eliminada" -ForegroundColor Green
Write-Host "✅ Ahora estás en develop" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Tu compañero puede sincronizar con:" -ForegroundColor Cyan
Write-Host "   .\scripts\sync.ps1" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Para empezar otra tarea:" -ForegroundColor Cyan
Write-Host "   .\scripts\quick-start.ps1 -Feature `"nombre`"" -ForegroundColor White
Write-Host ""
