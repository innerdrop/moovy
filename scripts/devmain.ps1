# Script para pasar cambios de develop a main (Auto-Mode)
# Uso: .\scripts\devmain.ps1

Write-Host "`n[DEPLOY] PASANDO CAMBIOS A MAIN" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

# 0. Verificar si hay cambios sin guardar
$status = git status --porcelain
if ($status) {
    Write-Host "[GIT] Guardando cambios pendientes..." -ForegroundColor Yellow
    git add .
    git commit -m "sync: cambios automáticos antes de deploy"
}

# 1. Asegurar que estamos en develop y actualizados
Write-Host "[GIT] Actualizando develop..." -ForegroundColor Yellow
git checkout develop
git pull origin develop --no-edit

# 2. Ir a main y traer cambios remotos
Write-Host "[GIT] Actualizando main..." -ForegroundColor Yellow
git checkout main
git pull origin main --no-edit

# 3. Mergear develop en main
Write-Host "[GIT] Mergenado develop -> main (No-Edit)..." -ForegroundColor Yellow
# Usamos --no-edit para que no abra el editor Vim
git merge develop --no-edit -m "deploy: actualización desde develop ($(Get-Date -Format 'yyyy-MM-dd HH:mm'))"

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[ERROR] Conflictos detectados. Por favor resolvelos manualmente." -ForegroundColor Red
    exit
}

# 4. Subir cambios a GitHub
Write-Host "[GIT] Subiendo main a GitHub..." -ForegroundColor Yellow
git push origin main

# 5. Volver a develop
Write-Host "[GIT] Volviendo a develop..." -ForegroundColor Yellow
git checkout develop

Write-Host "`n[OK] MAIN ACTUALIZADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "Cierre el servidor y vuelva a ejecutar npm run dev si es necesario." -ForegroundColor Gray
