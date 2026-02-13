# Script para Iniciar Trabajo - Moovy 3.0
# Uso: .\scripts\quick-start.ps1 -Feature "nombre-corto"
# Ejemplo: .\scripts\quick-start.ps1 -Feature "notificaciones"

param(
    [Parameter(Mandatory = $true)]
    [string]$Feature
)

Write-Host ""
Write-Host "🚀 QUICK START - Iniciando trabajo" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# 1. Ir a develop y sincronizar
Write-Host "[1/4] Cambiando a develop y sincronizando..." -ForegroundColor Yellow
git checkout develop 2>$null
git pull origin develop --no-edit

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Advertencia: No se pudo sincronizar develop completamente" -ForegroundColor Yellow
}

# 2. Crear nombre de rama limpio (sin espacios, lowercase)
$branchName = "feature/$($Feature.ToLower().Replace(' ', '-'))"

Write-Host "[2/4] Creando rama: $branchName" -ForegroundColor Yellow

# 3. Crear y cambiar a la nueva rama
git checkout -b $branchName 2>$null

if ($LASTEXITCODE -ne 0) {
    # La rama ya existe, solo cambiar a ella
    Write-Host "   La rama ya existe, cambiando a ella..." -ForegroundColor Gray
    git checkout $branchName 2>$null
}

# 4. Sincronizar con develop por si hubo cambios
Write-Host "[3/4] Verificando últimos cambios..." -ForegroundColor Yellow
git merge develop --no-edit 2>$null

Write-Host "[4/4] Listo!" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Estás en la rama: $branchName" -ForegroundColor Green
Write-Host "✅ Puedes empezar a trabajar con Antigravity" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Cuando termines, ejecuta:" -ForegroundColor Cyan
Write-Host "   .\scripts\quick-finish.ps1 -Message `"tu descripcion`"" -ForegroundColor White
Write-Host ""
