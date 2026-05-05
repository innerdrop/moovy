# Script para Iniciar Nuevos Cambios - Moovy
# Ejecutar: .\scripts\start.ps1

Write-Host ""
Write-Host "[START] INICIAR NUEVOS CAMBIOS" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

# Colector de errores
$errorSummary = @()
function Add-Error { param($msg) $script:errorSummary += $msg }
Write-Host ""

# 1. Sincronizar develop primero
Write-Host "[GIT] Actualizando develop..." -ForegroundColor Yellow
git checkout develop 2>$null
git pull origin develop
if ($LASTEXITCODE -ne 0) { Add-Error "[GIT] Error al sincronizar develop" }

# 2. Resolver tipo y nombre de la rama
# Prioridad:
#   a) Archivo .next-branch en el root del repo (escrito por Claude — gitignored,
#      se borra después de crear la rama). Formato:
#          fix delivery-fee-preview-vs-cobro
#      o (legacy):
#          fix
#          delivery-fee-preview-vs-cobro
#   b) Fallback: prompt interactivo con menu 1-9
$nextBranchFile = ".next-branch"
$prefix = $null
$name = $null

$validPrefixes = @("feat", "fix", "hotfix", "refactor", "config", "chore", "docs", "style", "perf")

if (Test-Path $nextBranchFile) {
    $raw = (Get-Content -Path $nextBranchFile -Raw -Encoding UTF8).Trim()
    if (-not [string]::IsNullOrWhiteSpace($raw)) {
        # Soportar "tipo nombre" en una linea o dos lineas
        $parts = ($raw -split "[\s\r\n]+" | Where-Object { $_ -ne "" })
        if ($parts.Count -ge 2) {
            $candidatePrefix = $parts[0].ToLower()
            $candidateName = $parts[1]
            if ($validPrefixes -contains $candidatePrefix) {
                $prefix = $candidatePrefix
                $name = $candidateName
                Write-Host ""
                Write-Host "[BRANCH] Tipo y nombre leidos de .next-branch (auto-start)" -ForegroundColor Green
                Write-Host "      Tipo:   $prefix" -ForegroundColor Gray
                Write-Host "      Nombre: $name" -ForegroundColor Gray
            } else {
                Write-Host "[BRANCH] .next-branch tiene tipo invalido '$candidatePrefix' — falling back a prompt" -ForegroundColor Yellow
            }
        }
    }
}

if (-not $prefix) {
    Write-Host ""
    Write-Host "Selecciona el tipo de cambio:" -ForegroundColor Cyan
    Write-Host "  1. feat     - Nueva funcionalidad"
    Write-Host "  2. fix      - Correccion de bug"
    Write-Host "  3. hotfix   - Correccion urgente"
    Write-Host "  4. refactor - Mejora de codigo"
    Write-Host "  5. config   - Cambios de configuracion/parametros"
    Write-Host "  6. chore    - Mantenimiento (deps, scripts, limpieza)"
    Write-Host "  7. docs     - Documentacion"
    Write-Host "  8. style    - Cambios visuales/UI"
    Write-Host "  9. perf     - Mejoras de rendimiento"
    Write-Host "Tip: si Claude dejo .next-branch en el root, este menu no aparece." -ForegroundColor DarkGray
    Write-Host ""

    $option = Read-Host "Opcion (1-9)"

    switch ($option) {
        "1" { $prefix = "feat" }
        "2" { $prefix = "fix" }
        "3" { $prefix = "hotfix" }
        "4" { $prefix = "refactor" }
        "5" { $prefix = "config" }
        "6" { $prefix = "chore" }
        "7" { $prefix = "docs" }
        "8" { $prefix = "style" }
        "9" { $prefix = "perf" }
        default {
            Write-Host "[ERROR] Opcion invalida" -ForegroundColor Red
            exit 1
        }
    }

    Write-Host ""
    $name = Read-Host "Nombre corto del cambio (sin espacios, ej: login-comercio)"
}

if ([string]::IsNullOrWhiteSpace($name)) {
    Write-Host "[ERROR] El nombre no puede estar vacio" -ForegroundColor Red
    exit 1
}

# Sanitizar el nombre: sin espacios, sin caracteres raros
$name = $name.Trim() -replace '\s+', '-' -replace '[^a-zA-Z0-9\-_]', ''
if ([string]::IsNullOrWhiteSpace($name)) {
    Write-Host "[ERROR] El nombre quedo vacio despues de sanitizar" -ForegroundColor Red
    exit 1
}

$branchName = "$prefix/$name"

# 4. Crear y cambiar a la nueva rama
Write-Host ""
Write-Host "[GIT] Creando rama: $branchName" -ForegroundColor Yellow
git checkout -b $branchName

if ($errorSummary.Count -gt 0) {
    Write-Host "`n--------------------------------------" -ForegroundColor Red
    Write-Host "[REPORTE DE ERRORES]" -ForegroundColor Red
    foreach ($err in $errorSummary) {
        Write-Host " - $err" -ForegroundColor Red
    }
    Write-Host "--------------------------------------" -ForegroundColor Red
} else {
    # Rama creada con exito → borrar .next-branch si fue usado
    if (Test-Path $nextBranchFile) {
        Remove-Item -Force $nextBranchFile
        Write-Host "[BRANCH] .next-branch consumido y borrado" -ForegroundColor DarkGray
    }
    Write-Host ""
    Write-Host "[OK] RAMA CREADA EXITOSAMENTE" -ForegroundColor Green
    Write-Host "[INFO] Ahora estas en: $branchName" -ForegroundColor Cyan
    Write-Host "[INFO] Cuando termines, ejecuta: .\scripts\finish.ps1" -ForegroundColor Cyan
    Write-Host ""
}
