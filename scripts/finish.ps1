# Script para Finalizar Cambios y Mergear a Develop - Moovy
# Ejecutar: .\scripts\finish.ps1

param(
    [Parameter(Mandatory = $false)]
    [string]$Message
)

Write-Host ""
Write-Host "[FINISH] FINALIZANDO CAMBIOS" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

# Colector de errores
$errorSummary = @()
function Add-Error { param($msg) $script:errorSummary += $msg }

function Stop-WithError {
    param($msg)
    Write-Host ""
    Write-Host "--------------------------------------" -ForegroundColor Red
    Write-Host "[ABORTADO] $msg" -ForegroundColor Red
    Write-Host "--------------------------------------" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host ""

# 1. Verificar rama actual
$currentBranch = git branch --show-current
Write-Host "[INFO] Rama actual: $currentBranch" -ForegroundColor Gray

if ($currentBranch -eq "main" -or $currentBranch -eq "develop") {
    Stop-WithError "Debes estar en una rama feature/fix/hotfix, no en $currentBranch"
}

# 2. Pedir mensaje de commit si no se proporciono
# Soporta multilinea: el user escribe lineas y cierra con una linea vacia.
if ([string]::IsNullOrWhiteSpace($Message)) {
    Write-Host ""
    Write-Host "Descripcion del cambio (podes pegar varias lineas; termina con ENTER en una linea vacia):" -ForegroundColor Cyan
    $lines = @()
    while ($true) {
        $line = Read-Host
        if ([string]::IsNullOrWhiteSpace($line)) {
            if ($lines.Count -gt 0) { break }
            Write-Host "[AVISO] Escribi al menos una linea de descripcion." -ForegroundColor Yellow
            continue
        }
        $lines += $line
    }
    $Message = ($lines -join "`n")
}

if ([string]::IsNullOrWhiteSpace($Message)) {
    Stop-WithError "El mensaje de commit no puede estar vacio"
}

# 3. Exportar Base de Datos
Write-Host "[DB] Exportando base de datos..." -ForegroundColor Yellow
docker exec moovy-db pg_dump -U postgres moovy_db > database_dump.sql
if ($LASTEXITCODE -ne 0) {
    Add-Error "[DB] Error al exportar la base de datos (codigo $LASTEXITCODE). El commit continua de todas formas."
}

# 4. Stage changes y chequear si hay algo para commitear
Write-Host "[GIT] Preparando cambios..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -ne 0) {
    Stop-WithError "'git add .' fallo con codigo $LASTEXITCODE. Revisa el estado del repo."
}

# Detectar caso "nothing to commit"
$staged = git diff --cached --name-only
if ([string]::IsNullOrWhiteSpace($staged)) {
    Write-Host "[AVISO] No hay cambios staged para commitear." -ForegroundColor Yellow
    $answer = Read-Host "La rama $currentBranch ya esta en su estado final. Continuar al merge igual? (s/n)"
    if ($answer -ne "s") {
        Stop-WithError "Proceso cancelado por el usuario. No se hizo commit ni merge."
    }
    $skipCommit = $true
} else {
    $skipCommit = $false
}

# 5. Commit usando archivo temporal (soporta multilinea + caracteres especiales)
if (-not $skipCommit) {
    $tempMsgFile = Join-Path $env:TEMP ("moovy-commit-" + [guid]::NewGuid().ToString() + ".txt")
    try {
        # UTF8 sin BOM para que git interprete los caracteres bien
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($tempMsgFile, $Message, $utf8NoBom)

        Write-Host "[GIT] Creando commit en $currentBranch..." -ForegroundColor Yellow
        git commit -F $tempMsgFile
        if ($LASTEXITCODE -ne 0) {
            Stop-WithError "'git commit' fallo con codigo $LASTEXITCODE. Tus cambios siguen staged. Revisa el error arriba y reintenta."
        }
    } finally {
        if (Test-Path $tempMsgFile) { Remove-Item -Force $tempMsgFile }
    }

    # 6. Push a la rama de trabajo (solo si commiteamos algo)
    Write-Host "[GIT] Subiendo $currentBranch a origin..." -ForegroundColor Yellow
    git push origin $currentBranch
    if ($LASTEXITCODE -ne 0) {
        Stop-WithError "'git push origin $currentBranch' fallo. Tus cambios estan commiteados localmente pero no en remoto. Reintenta el push manualmente."
    }
}

# 7. Limpiar index.lock residual si existe
$lockFile = Join-Path (git rev-parse --git-dir) "index.lock"
if (Test-Path $lockFile) {
    Write-Host "[GIT] Eliminando index.lock residual..." -ForegroundColor Yellow
    Remove-Item -Force $lockFile
}

# 8. Cambiar a develop y actualizar
Write-Host "[GIT] Actualizando develop..." -ForegroundColor Yellow
git checkout develop
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] No se pudo cambiar a develop. Abortando merge." -ForegroundColor Red
    Write-Host "[INFO] Tus cambios ya fueron pusheados a $currentBranch" -ForegroundColor Cyan
    exit 1
}
git pull origin develop
if ($LASTEXITCODE -ne 0) {
    Stop-WithError "'git pull origin develop' fallo. Resolve manualmente antes de mergear."
}

# 9. Mergear la rama de trabajo y CAPTURAR el output
Write-Host "[GIT] Mergeando $currentBranch a develop..." -ForegroundColor Yellow
$mergeOutput = git merge $currentBranch --no-edit 2>&1 | Out-String
$mergeExit = $LASTEXITCODE
Write-Host $mergeOutput

if ($mergeExit -ne 0) {
    Add-Error "[GIT] Conflictos al mergear $currentBranch en develop (codigo $mergeExit). Resolvelos manualmente."
}
elseif ($mergeOutput -match "Already up to date" -or $mergeOutput -match "Already up-to-date") {
    # Red flag: el merge no trajo nada nuevo. Probablemente el commit fallo silenciosamente antes.
    Write-Host "--------------------------------------" -ForegroundColor Red
    Write-Host "[ALERTA] El merge reporto 'Already up to date'." -ForegroundColor Red
    Write-Host "Esto significa que develop no recibio ningun commit nuevo de $currentBranch." -ForegroundColor Red
    Write-Host "Posibles causas:" -ForegroundColor Yellow
    Write-Host "  - La rama $currentBranch no tenia commits propios respecto a develop" -ForegroundColor Yellow
    Write-Host "  - Un commit anterior fallo silenciosamente" -ForegroundColor Yellow
    Write-Host "Revisa 'git log develop..$currentBranch' antes de cerrar la rama." -ForegroundColor Yellow
    Write-Host "--------------------------------------" -ForegroundColor Red
    Add-Error "[GIT] Merge sin cambios nuevos desde $currentBranch ('Already up to date')"
}

# 10. Subir develop (solo si el merge no fallo)
if ($mergeExit -eq 0) {
    Write-Host "[GIT] Subiendo develop..." -ForegroundColor Yellow
    git push origin develop
    if ($LASTEXITCODE -ne 0) { Add-Error "[GIT] Error al subir develop" }
}

# 11. Verificar estado limpio de develop post-merge
Write-Host "[GIT] Verificando que develop quede limpio..." -ForegroundColor Yellow
$dirty = git status --porcelain
if (-not [string]::IsNullOrWhiteSpace($dirty)) {
    Write-Host "--------------------------------------" -ForegroundColor Red
    Write-Host "[ALERTA] Develop tiene archivos modificados o staged despues del merge:" -ForegroundColor Red
    Write-Host $dirty -ForegroundColor Yellow
    Write-Host "Esto NO deberia pasar. Revisa antes de seguir trabajando." -ForegroundColor Red
    Write-Host "--------------------------------------" -ForegroundColor Red
    Add-Error "[GIT] Develop quedo con cambios pendientes despues del merge"
}

if ($errorSummary.Count -gt 0) {
    Write-Host "`n--------------------------------------" -ForegroundColor Red
    Write-Host "[REPORTE DE ERRORES]" -ForegroundColor Red
    foreach ($err in $errorSummary) {
        Write-Host " - $err" -ForegroundColor Red
    }
    Write-Host "--------------------------------------" -ForegroundColor Red
    Write-Host "`nPor favor, resolvelos antes de continuar." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host ""
    Write-Host "[OK] CAMBIOS FINALIZADOS Y PUBLICADOS" -ForegroundColor Green
    Write-Host "[INFO] La rama $currentBranch fue mergeada a develop" -ForegroundColor Cyan
    Write-Host "[INFO] Tu companero puede ejecutar: .\scripts\sync.ps1" -ForegroundColor Cyan
    Write-Host ""
}

# 12. Preguntar si eliminar la rama (solo si no hubo errores)
if ($errorSummary.Count -eq 0) {
    $delete = Read-Host "Eliminar la rama $currentBranch? (s/n)"
    if ($delete -eq "s") {
        git branch -d $currentBranch 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] No se pudo eliminar la rama local (puede que aun estes en ella o que tenga commits no mergeados)" -ForegroundColor Red
        } else {
            git push origin --delete $currentBranch 2>$null
            Write-Host "[OK] Rama eliminada local y remota" -ForegroundColor Green
        }
    }
}
