# Script para Iniciar Nuevos Cambios - Moovy
# Ejecutar: .\scripts\start.ps1

Write-Host ""
Write-Host "[START] INICIAR NUEVOS CAMBIOS" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

# 1. Sincronizar develop primero
Write-Host "[GIT] Actualizando develop..." -ForegroundColor Yellow
git checkout develop
git pull origin develop

# 2. Seleccionar tipo de rama
Write-Host ""
Write-Host "Selecciona el tipo de cambio:" -ForegroundColor Cyan
Write-Host "  1. feature  - Nueva funcionalidad"
Write-Host "  2. fix      - Correccion de bug"
Write-Host "  3. hotfix   - Correccion urgente"
Write-Host "  4. refactor - Mejora de codigo"
Write-Host ""

$option = Read-Host "Opcion (1-4)"

switch ($option) {
    "1" { $prefix = "feature" }
    "2" { $prefix = "fix" }
    "3" { $prefix = "hotfix" }
    "4" { $prefix = "refactor" }
    default { 
        Write-Host "[ERROR] Opcion invalida" -ForegroundColor Red
        exit 1
    }
}

# 3. Nombre de la rama
Write-Host ""
$name = Read-Host "Nombre corto del cambio (sin espacios, ej: login-comercio)"

if ([string]::IsNullOrWhiteSpace($name)) {
    Write-Host "[ERROR] El nombre no puede estar vacio" -ForegroundColor Red
    exit 1
}

$branchName = "$prefix/$name"

# 4. Crear y cambiar a la nueva rama
Write-Host ""
Write-Host "[GIT] Creando rama: $branchName" -ForegroundColor Yellow
git checkout -b $branchName

Write-Host ""
Write-Host "[OK] RAMA CREADA EXITOSAMENTE" -ForegroundColor Green
Write-Host "[INFO] Ahora estas en: $branchName" -ForegroundColor Cyan
Write-Host "[INFO] Cuando termines, ejecuta: .\scripts\finish.ps1" -ForegroundColor Cyan
Write-Host ""
