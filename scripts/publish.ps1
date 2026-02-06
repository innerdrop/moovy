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

# 2. Mostrar archivos modificados
Write-Host ""
Write-Host "[CHANGES] Archivos modificados:" -ForegroundColor Yellow
git status --short
Write-Host ""

# 3. Agregar todos los cambios
Write-Host "[GIT] Agregando cambios..." -ForegroundColor Yellow
git add .

# 4. Crear commit
Write-Host "[GIT] Creando commit..." -ForegroundColor Yellow
git commit -m $Message

# 5. Push a origin
Write-Host "[GIT] Subiendo a GitHub..." -ForegroundColor Yellow
git push origin $currentBranch

Write-Host ""
Write-Host "[OK] CAMBIOS PUBLICADOS EXITOSAMENTE" -ForegroundColor Green
Write-Host "[INFO] Tu companero puede ejecutar: .\scripts\sync.ps1" -ForegroundColor Cyan
Write-Host ""
