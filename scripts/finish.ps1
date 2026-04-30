# Script para Finalizar Cambios y Mergear a Develop - Moovy
# Ejecutar: .\scripts\finish.ps1 [-Message "..."] [-NoChangelog]
#
# Mejoras 2026-04-28 (chore/finish-auto-changelog):
# - Eliminado prompt interactivo de docs (fricción innecesaria, riesgo de apretar mal)
# - CHANGELOG.md se auto-actualiza con entry generada del nombre de rama + fecha
#   + mensaje de commit + archivos tocados. Sin preguntar.
# - Pasá -NoChangelog para skipear (ramas de prueba, basura)
# - Recordatorios NO BLOQUEANTES al final si el commit menciona ISSUE-### o
#   tocó archivos de decisiones canónicas (schema, roles, auth, proxy, email-registry)

param(
    [Parameter(Mandatory = $false)]
    [string]$Message,
    [switch]$NoChangelog
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

# 2. Limpiar index.lock residual
$lockFile = Join-Path (git rev-parse --git-dir 2>$null) "index.lock"
if ($lockFile -and (Test-Path $lockFile)) {
    Write-Host "[GIT] Eliminando index.lock residual..." -ForegroundColor Yellow
    Remove-Item -Force $lockFile -ErrorAction SilentlyContinue
}

# 3. Pedir mensaje de commit
if ([string]::IsNullOrWhiteSpace($Message)) {
    Write-Host ""
    Write-Host "Descripcion del cambio (una linea; si queres body extenso, 'git commit --amend' despues):" -ForegroundColor Cyan
    $Message = Read-Host "Mensaje"
}

if ([string]::IsNullOrWhiteSpace($Message)) {
    Stop-WithError "El mensaje de commit no puede estar vacio"
}

# 4. Exportar Base de Datos (UTF-8 raw)
# fix/utf8-encoding-pipeline (2026-04-30): generamos el dump dentro del container
# y lo copiamos con docker cp (bytes raw). Antes haciamos `pg_dump > file.sql` en
# PowerShell, lo cual reinterpretaba los bytes UTF-8 con el codepage de Windows
# y escribia el archivo en UTF-16 LE BOM. Resultado: tildes rotas en el dump
# (Pizzer-i-a, Electr-o-nica). Con docker cp el archivo nunca pasa por la consola
# de PowerShell, por lo tanto no hay re-encoding y queda en UTF-8 puro.
Write-Host "[DB] Exportando base de datos (UTF-8 raw via docker cp)..." -ForegroundColor Yellow
docker exec moovy-db pg_dump -U postgres -f /tmp/moovy_dump.sql moovy_db
if ($LASTEXITCODE -ne 0) {
    Add-Error "[DB] Error al ejecutar pg_dump dentro del container (codigo $LASTEXITCODE). El commit continua de todas formas."
} else {
    docker cp moovy-db:/tmp/moovy_dump.sql "$(Get-Location)\database_dump.sql"
    if ($LASTEXITCODE -ne 0) {
        Add-Error "[DB] Error al copiar el dump del container (codigo $LASTEXITCODE)."
    } else {
        docker exec moovy-db rm -f /tmp/moovy_dump.sql | Out-Null
    }
}

# 5. Stage changes
Write-Host "[GIT] Preparando cambios..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -ne 0) {
    Stop-WithError "'git add .' fallo con codigo $LASTEXITCODE."
}

# Detectar caso "nothing to commit"
$staged = git diff --cached --name-only
if ([string]::IsNullOrWhiteSpace($staged)) {
    Write-Host "[AVISO] No hay cambios staged para commitear." -ForegroundColor Yellow
    $answer = Read-Host "La rama $currentBranch ya esta en su estado final. Continuar al merge igual? (s/n)"
    if ($answer -ne "s") {
        Stop-WithError "Proceso cancelado por el usuario."
    }
    $skipCommit = $true
} else {
    $skipCommit = $false
}

# 6. AUTO-CHANGELOG: agregar entry a .claude/CHANGELOG.md ANTES del commit
# (chore/finish-auto-changelog 2026-04-28). Solo si no hay -NoChangelog y no
# es un commit vacio. La entry queda incluida en el mismo commit que el resto.
if (-not $skipCommit -and -not $NoChangelog) {
    $changelogPath = ".claude/CHANGELOG.md"
    if (Test-Path $changelogPath) {
        # Listar archivos staged excluyendo CHANGELOG mismo y database_dump
        $touchedFiles = $staged | Where-Object {
            $_ -ne ".claude/CHANGELOG.md" -and
            $_ -ne "database_dump.sql"
        }

        if ($touchedFiles) {
            $today = Get-Date -Format 'yyyy-MM-dd'
            $filesArr = @($touchedFiles)
            $filesShown = ($filesArr | Select-Object -First 8) -join ', '
            $moreCount = $filesArr.Count - 8
            if ($moreCount -gt 0) { $filesShown += " (+$moreCount mas)" }

            # Construir entry markdown
            $entry = "## $today (rama ``$currentBranch``)`r`n`r`n$Message`r`n`r`n**Archivos:** $filesShown`r`n`r`n"

            # Leer CHANGELOG actual y buscar el separador "---" del header
            $existing = Get-Content $changelogPath -Raw -Encoding UTF8
            $marker = "`n---`n"
            $insertIdx = $existing.IndexOf($marker)

            if ($insertIdx -gt 0) {
                $insertPos = $insertIdx + $marker.Length
                # Saltear la newline siguiente al separador si existe
                while ($insertPos -lt $existing.Length -and ($existing[$insertPos] -eq "`n" -or $existing[$insertPos] -eq "`r")) {
                    $insertPos++
                }
                $newContent = $existing.Substring(0, $insertPos) + $entry + $existing.Substring($insertPos)

                # Escribir UTF8 sin BOM
                $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
                [System.IO.File]::WriteAllText((Resolve-Path $changelogPath), $newContent, $utf8NoBom)

                git add $changelogPath
                Write-Host "[CHANGELOG] Entry auto-agregada al CHANGELOG.md" -ForegroundColor Green
            } else {
                Write-Host "[CHANGELOG] No encontre el separador '---' del header. Skipeando auto-entry." -ForegroundColor Yellow
            }
        }
    }
}

# 7. Commit usando archivo temporal (UTF-8 sin BOM)
if (-not $skipCommit) {
    $tempMsgFile = Join-Path $env:TEMP ("moovy-commit-" + [guid]::NewGuid().ToString() + ".txt")
    try {
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($tempMsgFile, $Message, $utf8NoBom)

        Write-Host "[GIT] Creando commit en $currentBranch..." -ForegroundColor Yellow
        git commit -F $tempMsgFile
        if ($LASTEXITCODE -ne 0) {
            Stop-WithError "'git commit' fallo con codigo $LASTEXITCODE. Tus cambios siguen staged."
        }
    } finally {
        if (Test-Path $tempMsgFile) { Remove-Item -Force $tempMsgFile }
    }

    # 8. Push a rama de trabajo
    Write-Host "[GIT] Subiendo $currentBranch a origin..." -ForegroundColor Yellow
    git push origin $currentBranch
    if ($LASTEXITCODE -ne 0) {
        Stop-WithError "'git push origin $currentBranch' fallo. Tus cambios estan commiteados localmente. Reintenta manualmente."
    }
}

# 9. Cambiar a develop y actualizar
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

# 10. Mergear
Write-Host "[GIT] Mergeando $currentBranch a develop..." -ForegroundColor Yellow
$mergeOutput = git merge $currentBranch --no-edit 2>&1 | Out-String
$mergeExit = $LASTEXITCODE
Write-Host $mergeOutput

if ($mergeExit -ne 0) {
    Add-Error "[GIT] Conflictos al mergear $currentBranch en develop (codigo $mergeExit)."
}
elseif ($mergeOutput -match "Already up to date" -or $mergeOutput -match "Already up-to-date") {
    Write-Host "--------------------------------------" -ForegroundColor Red
    Write-Host "[ALERTA] El merge reporto 'Already up to date'." -ForegroundColor Red
    Write-Host "develop no recibio ningun commit nuevo de $currentBranch." -ForegroundColor Yellow
    Write-Host "Revisa 'git log develop..$currentBranch' antes de cerrar." -ForegroundColor Yellow
    Write-Host "--------------------------------------" -ForegroundColor Red
    Add-Error "[GIT] Merge sin cambios nuevos desde $currentBranch"
}

# 11. Subir develop
if ($mergeExit -eq 0) {
    Write-Host "[GIT] Subiendo develop..." -ForegroundColor Yellow
    git push origin develop
    if ($LASTEXITCODE -ne 0) { Add-Error "[GIT] Error al subir develop" }
}

# 12. Verificar develop limpio
Write-Host "[GIT] Verificando que develop quede limpio..." -ForegroundColor Yellow
$dirty = git status --porcelain
if (-not [string]::IsNullOrWhiteSpace($dirty)) {
    Write-Host "[ALERTA] Develop tiene cambios pendientes despues del merge:" -ForegroundColor Red
    Write-Host $dirty -ForegroundColor Yellow
    Add-Error "[GIT] Develop quedo con cambios pendientes"
}

if ($errorSummary.Count -gt 0) {
    Write-Host "`n--------------------------------------" -ForegroundColor Red
    Write-Host "[REPORTE DE ERRORES]" -ForegroundColor Red
    foreach ($err in $errorSummary) { Write-Host " - $err" -ForegroundColor Red }
    Write-Host "--------------------------------------" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[OK] CAMBIOS FINALIZADOS Y PUBLICADOS" -ForegroundColor Green
Write-Host "[INFO] La rama $currentBranch fue mergeada a develop" -ForegroundColor Cyan
Write-Host ""

# 13. Recordatorios NO BLOQUEANTES
$reminders = @()

# Si el commit message menciona ISSUE-###, recordar mover en ISSUES.md
$issueMatches = [regex]::Matches($Message, 'ISSUE-\d+')
if ($issueMatches.Count -gt 0) {
    $issueIds = ($issueMatches | ForEach-Object { $_.Value } | Sort-Object -Unique) -join ', '
    $reminders += "Mover $issueIds de 'abiertos' a 'resueltos en este sprint' en ISSUES.md"
}

# Si toco archivos de decisiones canonicas, sugerir verificar CLAUDE.md
$canonicalPattern = 'prisma/schema\.prisma|src/lib/roles\.ts|src/lib/auth\.ts|src/lib/email-registry\.ts|src/proxy\.ts'
$lastCommitFiles = git log -1 --name-only --pretty=format: HEAD 2>$null
if ($lastCommitFiles -match $canonicalPattern) {
    $reminders += "Esta rama toco archivos de decisiones canonicas. Verificar si CLAUDE.md necesita una decision nueva o regla acumulada (#29+)."
}

if ($reminders.Count -gt 0) {
    Write-Host "[RECORDATORIOS NO BLOQUEANTES]" -ForegroundColor Yellow
    foreach ($r in $reminders) { Write-Host "  - $r" -ForegroundColor Gray }
    Write-Host ""
}

# 14. Eliminar la rama
$delete = Read-Host "Eliminar la rama $currentBranch? (s/n)"
if ($delete -eq "s") {
    git branch -d $currentBranch 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] No se pudo eliminar la rama local" -ForegroundColor Red
    } else {
        git push origin --delete $currentBranch 2>$null
        Write-Host "[OK] Rama eliminada local y remota" -ForegroundColor Green
    }
}
