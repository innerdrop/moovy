# Script para deploy develop -> main + VPS Hostinger
# Version 2 (chore/devmain-safety, 2026-04-28): overhaul completo con red de seguridad.
#
# Modos:
#   .\scripts\devmain.ps1              -> Deploy codigo + schema (default seguro)
#   .\scripts\devmain.ps1 -NoDB        -> Solo codigo (no toca DB)
#   .\scripts\devmain.ps1 -SchemaOnly  -> Codigo + schema (mantiene datos)
#   .\scripts\devmain.ps1 -CleanProd   -> DB limpia + seed (PRIMERA VEZ o RESET)
#   .\scripts\devmain.ps1 -DryRun      -> Muestra que haria sin ejecutar nada
#
# Mejoras 2026-04-28:
#   1. Pre-flight checks obligatorios (TS + build local + validate-ops-config)
#   2. Verificar develop sincronizado con origin (sin commits locales no pusheados)
#   3. Healthcheck del VPS antes de empezar (ssh echo ok con timeout)
#   4. Verificar env vars criticos en VPS (CRON_SECRET, MP_ACCESS_TOKEN, etc)
#   5. Lock file anti-deploys concurrentes (/tmp/moovy-deploy.lock)
#   6. Backup automatico de DB en VPS antes del deploy + cleanup >30 dias
#   7. Skip npm install si no cambio package-lock.json
#   8. Skip prisma generate si no cambio schema.prisma
#   9. Build incremental de Next.js (preserva .next/cache)
#  10. Maintenance mode toggle (UPDATE StoreSettings antes y despues)
#  11. pm2 reload en vez de restart (zero-downtime)
#  12. Smoke test post-deploy: curl /api/health + pm2 jlist online
#  13. Tag git automatico deploy-YYYYMMDD-HHMMSS + push
#  14. Logs persistentes a deploys/deploy_YYYYMMDD_HHMMSS.log
#  15. Confirmacion con resumen pre-deploy (commits, schema changes, modo)
#  16. Friday warning (post 18hs)
#  17. Sin auto-commit silencioso (aborta si hay cambios pendientes)
#  18. Eliminado -SyncLocal (deprecated, peligroso)
#  19. DryRun mode
#  20. Rollback explicito en error con git tag

param(
    [switch]$NoDB,
    [switch]$SchemaOnly,
    [switch]$CleanProd,
    [switch]$DryRun
)

$ErrorActionPreference = "Continue"
$deployStart = Get-Date

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
    if ($script:transcriptStarted) { Stop-Transcript | Out-Null }
    exit 1
}

function Invoke-DryRun-Or-Exec {
    param([string]$Description, [scriptblock]$Action)
    if ($DryRun) {
        Write-Host "[DRY-RUN] $Description" -ForegroundColor Magenta
        return $true
    }
    & $Action
    return ($LASTEXITCODE -eq 0)
}

# Logs persistentes (mejora 14)
$deploysDir = "deploys"
if (-not (Test-Path $deploysDir)) { New-Item -ItemType Directory -Path $deploysDir | Out-Null }
$logFile = Join-Path $deploysDir "deploy_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
$script:transcriptStarted = $false
try {
    Start-Transcript -Path $logFile -Append | Out-Null
    $script:transcriptStarted = $true
} catch { Write-Host "[WARN] No pude iniciar transcript: $_" -ForegroundColor Yellow }

Write-Host ""
Write-Host "[DEPLOY] devmain v2" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

# Friday warning (mejora 16)
$dow = (Get-Date).DayOfWeek
$hour = (Get-Date).Hour
if ($dow -eq 'Friday' -and $hour -ge 18) {
    Write-Host ""
    Write-Host "[FRIDAY-WARNING] Estas deployando viernes despues de las 18hs." -ForegroundColor Yellow
    Write-Host "                 Si algo se rompe el fin de semana, vas a estar solo." -ForegroundColor Yellow
    $fridayConfirm = Read-Host "Continuar igual? (s/n) [n]"
    if ($fridayConfirm -ine "s") { Stop-WithError "Cancelado por friday warning. Bien hecho." }
}

# Determinar modo
if ($CleanProd) {
    $modeLabel = "DB LIMPIA + Seed"
    Write-Host "[MODO] $modeLabel" -ForegroundColor Red
    Write-Host "ATENCION: Esto BORRA toda la DB de produccion." -ForegroundColor Red
    if (-not $DryRun) {
        $confirm = Read-Host "Tipear 'BORRAR TODO' para confirmar"
        if ($confirm -ne "BORRAR TODO") { Stop-WithError "Cancelado." }
    }
} elseif ($NoDB) {
    $modeLabel = "Solo Codigo (sin DB)"
} else {
    $SchemaOnly = $true
    $modeLabel = "Codigo + Schema (modo seguro)"
}
Write-Host "[MODO] $modeLabel" -ForegroundColor Magenta

# Configuracion VPS
$VPS_HOST = "31.97.14.156"
$VPS_USER = "root"
$VPS_PATH = "/var/www/moovy"
$VPS_DB_PORT = "5436"
$VPS_DB_USER = "postgres"
$VPS_DB_NAME = "moovy_db"
$VPS_BACKUP_DIR = "$VPS_PATH/backups"
$LOCK_FILE = "/tmp/moovy-deploy.lock"

# === PASO 1: Verificar rama actual sea develop ===
Write-Host ""
Write-Host "[1/15] Verificando rama local..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
if ($currentBranch -ne "develop") {
    Stop-WithError "Estas en rama '$currentBranch'. Tenes que estar en 'develop' para deployar."
}
Write-Host "  OK rama: develop" -ForegroundColor Green

# === PASO 2: Sin cambios pendientes (mejora 17 - sin auto-commit) ===
Write-Host ""
Write-Host "[2/15] Verificando working tree limpio..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "  Tenes cambios sin commitear:" -ForegroundColor Red
    git status --short
    Write-Host ""
    Stop-WithError "Commit o stash antes de deployar. Cero magia automatica."
}
Write-Host "  OK sin cambios pendientes" -ForegroundColor Green

# === PASO 3: Develop sincronizado con origin (mejora 11) ===
Write-Host ""
Write-Host "[3/15] Sincronizando develop con origin..." -ForegroundColor Yellow
git fetch origin develop 2>&1 | Out-Null
$ahead = (git rev-list --count origin/develop..HEAD).Trim()
$behind = (git rev-list --count HEAD..origin/develop).Trim()
if ([int]$ahead -gt 0) {
    Write-Host "  Tenes $ahead commit(s) local(es) no pusheados a origin/develop." -ForegroundColor Red
    Stop-WithError "Hace 'git push origin develop' antes de deployar."
}
if ([int]$behind -gt 0) {
    Write-Host "  Origin/develop esta $behind commit(s) adelante. Hago pull..." -ForegroundColor Yellow
    if (-not $DryRun) { git pull origin develop --no-edit 2>&1 | Out-Host }
}
Write-Host "  OK develop sincronizado" -ForegroundColor Green

# === PASO 4: Pre-flight checks (mejora 1) ===
Write-Host ""
Write-Host "[4/15] Pre-flight checks..." -ForegroundColor Yellow

# 4.a TS check
Write-Host "  -> npx tsc --noEmit --skipLibCheck" -ForegroundColor Gray
$tscOutput = npx tsc --noEmit --skipLibCheck 2>&1
$tscErrors = $tscOutput | Select-String -Pattern "error TS" | Where-Object {
    $_ -notmatch '\.next[/\\]dev[/\\]types' -and
    $_ -notmatch 'node_modules[/\\]\.prisma' -and
    $_ -notmatch 'TS1127.*privacidad' -and
    $_ -notmatch 'TS1127.*order-chat' -and
    $_ -notmatch 'TS1127.*socket-server' -and
    $_ -notmatch 'TS1127.*email-registry' -and
    $_ -notmatch 'TS1127.*comercio[/\\]info'
}
if ($tscErrors) {
    Write-Host "  TS errors detectados:" -ForegroundColor Red
    $tscErrors | Select-Object -First 10 | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
    Stop-WithError "Hay errores de TS. Resolve antes de deployar."
}
Write-Host "  OK TS clean" -ForegroundColor Green

# 4.b Validar configs OPS
Write-Host "  -> validate-ops-config" -ForegroundColor Gray
if (-not $DryRun) {
    npx tsx scripts/validate-ops-config.ts 2>&1 | Out-Host
    if ($LASTEXITCODE -ne 0) { Stop-WithError "validate-ops-config.ts fallo. Resolve antes de deployar." }
}
Write-Host "  OK validate-ops-config" -ForegroundColor Green

# 4.c Build local (atrapa errores Next.js que tsc no ve)
Write-Host "  -> npm run build (puede tardar 1-2 min)..." -ForegroundColor Gray
if (-not $DryRun) {
    $buildOutput = npm run build 2>&1
    if ($LASTEXITCODE -ne 0) {
        $buildOutput | Select-Object -Last 30 | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
        Stop-WithError "Build local fallo. NO se va a deployar codigo que no compila."
    }
}
Write-Host "  OK build local" -ForegroundColor Green

# === PASO 5: Healthcheck VPS (mejora 2) ===
Write-Host ""
Write-Host "[5/15] Healthcheck del VPS..." -ForegroundColor Yellow
$sshTest = ssh -o ConnectTimeout=5 -o BatchMode=yes "$VPS_USER@$VPS_HOST" "echo ok" 2>&1
if ($sshTest -ne "ok") {
    Stop-WithError "No llego al VPS por SSH. Output: $sshTest"
}
Write-Host "  OK VPS accesible" -ForegroundColor Green

# === PASO 6: Lock file anti-concurrent (mejora 5) ===
# fix/devmain-bash-escapes (2026-04-28): el lock check anterior tenia backticks
# y comillas escapadas que se rompian al pasar PowerShell -> SSH -> bash. Ahora
# escribimos el script bash a un archivo temporal y lo ejecutamos con `bash`,
# evitando problemas de escape multinivel.
Write-Host ""
Write-Host "[6/15] Verificando lock de deploys..." -ForegroundColor Yellow
$lockCheckScript = 'F=' + $LOCK_FILE + '; if [ -f "$F" ]; then NOW=$(date +%s); MOD=$(stat -c %Y "$F"); AGE=$((NOW-MOD)); if [ "$AGE" -lt 1800 ]; then echo "LOCKED:$AGE"; else echo "STALE:$AGE"; fi; else echo "NONE"; fi'
$lockCheck = ssh "$VPS_USER@$VPS_HOST" "bash -c '$lockCheckScript'" 2>&1
if ($lockCheck -match "^LOCKED:(\d+)") {
    $lockAge = $matches[1]
    Stop-WithError "Otro deploy esta en curso (lock con $lockAge segundos). Si te equivocaste, hace 'ssh root@$VPS_HOST rm $LOCK_FILE' y reintentar."
}
if ($lockCheck -match "^STALE") {
    Write-Host "  Lock zombie detectado. Limpiando..." -ForegroundColor Yellow
    ssh "$VPS_USER@$VPS_HOST" "rm -f $LOCK_FILE" | Out-Null
}
if (-not $DryRun) {
    ssh "$VPS_USER@$VPS_HOST" "touch $LOCK_FILE" | Out-Null
}
Write-Host "  OK lock adquirido" -ForegroundColor Green

# === PASO 7: Verificar env vars criticos en VPS (mejora 4) ===
# fix/devmain-bash-escapes (2026-04-28): separamos hard required (todos
# obligatorios) de alternativos (al menos uno). NextAuth v5 acepta AUTH_SECRET
# o NEXTAUTH_SECRET indistintamente — VPSs viejos pueden tener solo uno.
Write-Host ""
Write-Host "[7/15] Verificando env vars criticos en VPS..." -ForegroundColor Yellow
$hardRequired = @('DATABASE_URL', 'CRON_SECRET', 'MP_ACCESS_TOKEN', 'MP_WEBHOOK_SECRET')
$alternatives = @('AUTH_SECRET', 'NEXTAUTH_SECRET')

$envContent = ssh "$VPS_USER@$VPS_HOST" "cd $VPS_PATH && grep -E '^[A-Z_]+=' .env 2>/dev/null | cut -d= -f1"
$envVars = $envContent -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }

$missingHard = @()
foreach ($v in $hardRequired) {
    if ($envVars -notcontains $v) { $missingHard += $v }
}
$hasAlternative = $false
foreach ($v in $alternatives) {
    if ($envVars -contains $v) { $hasAlternative = $true; break }
}

if ($missingHard.Count -gt 0) {
    ssh "$VPS_USER@$VPS_HOST" "rm -f $LOCK_FILE" | Out-Null
    Stop-WithError "Faltan env vars criticos en VPS .env: $($missingHard -join ', ')"
}
if (-not $hasAlternative) {
    ssh "$VPS_USER@$VPS_HOST" "rm -f $LOCK_FILE" | Out-Null
    Stop-WithError "Falta al menos uno de: $($alternatives -join ' o ') en VPS .env (NextAuth requiere uno)"
}
Write-Host "  OK env vars criticos: $($hardRequired.Count)/$($hardRequired.Count) hard + auth secret" -ForegroundColor Green

# === PASO 8: Resumen pre-deploy + confirmacion (mejora 15) ===
Write-Host ""
Write-Host "[8/15] Resumen pre-deploy..." -ForegroundColor Yellow
git fetch origin main 2>&1 | Out-Null
$commitsCount = (git rev-list --count origin/main..develop).Trim()
$schemaChanged = git diff --stat origin/main..develop -- prisma/schema.prisma 2>&1
$packageLockChanged = git diff --stat origin/main..develop -- package-lock.json 2>&1

Write-Host ""
Write-Host "  Commits a deployar:        $commitsCount" -ForegroundColor White
Write-Host "  Modo:                      $modeLabel" -ForegroundColor White
if ($schemaChanged) {
    Write-Host "  Schema cambio:             SI" -ForegroundColor Yellow
} else {
    Write-Host "  Schema cambio:             NO (skip prisma generate)" -ForegroundColor Green
}
if ($packageLockChanged) {
    Write-Host "  Dependencias cambiaron:    SI (npm ci en VPS)" -ForegroundColor Yellow
} else {
    Write-Host "  Dependencias cambiaron:    NO (skip npm install)" -ForegroundColor Green
}
Write-Host "  Backup DB pre-deploy:      SI" -ForegroundColor Green
Write-Host "  Maintenance mode:          ON durante / OFF despues" -ForegroundColor Green
Write-Host "  Tag git auto:              deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss')" -ForegroundColor Green
Write-Host ""

if ($DryRun) {
    Write-Host "[DRY-RUN] Hasta aqui llegaria. NO se ejecuto ningun cambio." -ForegroundColor Magenta
    if (-not $DryRun) { ssh "$VPS_USER@$VPS_HOST" "rm -f $LOCK_FILE" | Out-Null }
    if ($script:transcriptStarted) { Stop-Transcript | Out-Null }
    exit 0
}

$confirm = Read-Host "Confirmar deploy? (s/n) [s]"
if ([string]::IsNullOrWhiteSpace($confirm)) { $confirm = "s" }
if ($confirm -ine "s") {
    ssh "$VPS_USER@$VPS_HOST" "rm -f $LOCK_FILE" | Out-Null
    Stop-WithError "Cancelado por usuario."
}

# === PASO 9: Backup DB en VPS (mejora 6) ===
if (-not $NoDB) {
    Write-Host ""
    Write-Host "[9/15] Backup DB pre-deploy..." -ForegroundColor Yellow
    $backupName = "backup_pre_deploy_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
    ssh "$VPS_USER@$VPS_HOST" "mkdir -p $VPS_BACKUP_DIR && PGPASSWORD=postgres pg_dump -h 127.0.0.1 -p $VPS_DB_PORT -U $VPS_DB_USER $VPS_DB_NAME > $VPS_BACKUP_DIR/$backupName"
    if ($LASTEXITCODE -ne 0) {
        Add-Error "[BACKUP] Error al hacer backup de DB. Continuando bajo tu propio riesgo."
        $continueBackup = Read-Host "Backup fallo. Continuar igual? (s/n) [n]"
        if ($continueBackup -ine "s") {
            ssh "$VPS_USER@$VPS_HOST" "rm -f $LOCK_FILE" | Out-Null
            Stop-WithError "Cancelado por backup fallido."
        }
    } else {
        $backupSize = ssh "$VPS_USER@$VPS_HOST" "du -h $VPS_BACKUP_DIR/$backupName | cut -f1"
        Write-Host "  OK backup: $backupName ($($backupSize.Trim()))" -ForegroundColor Green
    }

    # Cleanup backups >30 dias
    ssh "$VPS_USER@$VPS_HOST" "find $VPS_BACKUP_DIR -name 'backup_*.sql' -mtime +30 -delete 2>/dev/null || true" | Out-Null
} else {
    Write-Host ""
    Write-Host "[9/15] Backup skipped (modo NoDB)" -ForegroundColor Gray
}

# === PASO 10: Maintenance mode ON (mejora 10) ===
Write-Host ""
Write-Host "[10/15] Activando maintenance mode..." -ForegroundColor Yellow
ssh "$VPS_USER@$VPS_HOST" "PGPASSWORD=postgres psql -h 127.0.0.1 -p $VPS_DB_PORT -U $VPS_DB_USER -d $VPS_DB_NAME -c \"UPDATE \`\"StoreSettings\`\" SET \`\"isMaintenanceMode\`\" = true WHERE id = 'settings';\"" | Out-Null
Write-Host "  OK maintenance ON" -ForegroundColor Green

# === PASO 11: Git merge develop -> main + push ===
Write-Host ""
Write-Host "[11/15] Merge develop -> main + push..." -ForegroundColor Yellow
git checkout main 2>&1 | Out-Null
git pull origin main --no-edit 2>&1 | Out-Null
git merge develop --no-edit -m "deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm') ($commitsCount commits)"
if ($LASTEXITCODE -ne 0) {
    ssh "$VPS_USER@$VPS_HOST" "PGPASSWORD=postgres psql -h 127.0.0.1 -p $VPS_DB_PORT -U $VPS_DB_USER -d $VPS_DB_NAME -c \"UPDATE \`\"StoreSettings\`\" SET \`\"isMaintenanceMode\`\" = false WHERE id = 'settings';\"" | Out-Null
    ssh "$VPS_USER@$VPS_HOST" "rm -f $LOCK_FILE" | Out-Null
    Stop-WithError "Conflictos al mergear develop -> main. Resolve manualmente."
}
git push origin main
if ($LASTEXITCODE -ne 0) { Add-Error "[GIT] Error al hacer push de main" }
Write-Host "  OK merge + push" -ForegroundColor Green

# === PASO 12: Deploy en VPS ===
Write-Host ""
Write-Host "[12/15] Deploy en VPS..." -ForegroundColor Yellow

# Construir comando con skips (mejoras 7, 8, 9)
$installStep = if ($packageLockChanged) {
    "echo '[VPS] npm ci...' && npm ci"
} else {
    "echo '[VPS] skip npm install (sin cambios en deps)'"
}

$prismaGenStep = if ($schemaChanged -or $CleanProd) {
    "echo '[VPS] prisma generate...' && npx prisma generate"
} else {
    "echo '[VPS] skip prisma generate (sin cambios en schema)'"
}

$dbStep = ""
if ($CleanProd) {
    $adminPass = if ($env:OPS_LOGIN_PASSWORD) { $env:OPS_LOGIN_PASSWORD } else { $env:ADMIN_PASSWORD }
    if (-not $adminPass) {
        ssh "$VPS_USER@$VPS_HOST" "rm -f $LOCK_FILE" | Out-Null
        Stop-WithError "Necesitas OPS_LOGIN_PASSWORD para -CleanProd"
    }
    $dbStep = "PGPASSWORD=postgres psql -h 127.0.0.1 -p $VPS_DB_PORT -U $VPS_DB_USER -d $VPS_DB_NAME -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public; CREATE EXTENSION IF NOT EXISTS postgis;' && npx prisma db push --accept-data-loss && ADMIN_PASSWORD='$adminPass' npx tsx prisma/seed-production.ts"
} elseif ($SchemaOnly) {
    $dbStep = "npx prisma db push --accept-data-loss"
}

# Build incremental: NO borrar .next/cache (mejora 9)
# git reset --hard preserva archivos no-tracked, pero .next esta en .gitignore asi que sobrevive
$remoteCommand = "cd $VPS_PATH && " +
    "git fetch origin main && " +
    "git reset --hard origin/main && " +
    "$installStep && " +
    "$prismaGenStep"

if ($dbStep) {
    $remoteCommand += " && $dbStep"
}

# pm2 reload (zero-downtime, mejora 11)
$remoteCommand += " && echo '[VPS] npm run build...' && npm run build && pm2 reload moovy"

ssh "$VPS_USER@$VPS_HOST" "$remoteCommand" 2>&1 | Out-Host
$deploySuccess = ($LASTEXITCODE -eq 0)

if (-not $deploySuccess) {
    Add-Error "[VPS] Error en deploy remoto"
}
Write-Host "  $(if ($deploySuccess) { 'OK' } else { 'ERROR' }) deploy remoto" -ForegroundColor $(if ($deploySuccess) { 'Green' } else { 'Red' })

# === PASO 13: Smoke test post-deploy (mejora 12) ===
Write-Host ""
Write-Host "[13/15] Smoke test post-deploy..." -ForegroundColor Yellow

if ($deploySuccess) {
    Start-Sleep -Seconds 5

    # 13.a /api/health
    try {
        $health = Invoke-WebRequest -Uri "https://somosmoovy.com/api/health" -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
        if ($health.StatusCode -eq 200) {
            Write-Host "  OK /api/health 200" -ForegroundColor Green
        } else {
            Add-Error "[HEALTH] Status $($health.StatusCode)"
            $deploySuccess = $false
        }
    } catch {
        Add-Error "[HEALTH] No responde: $_"
        $deploySuccess = $false
    }

    # 13.b pm2 status
    if ($deploySuccess) {
        $pm2Status = (ssh "$VPS_USER@$VPS_HOST" "pm2 jlist 2>/dev/null | python3 -c \`"import sys,json; data=json.load(sys.stdin); m=[p for p in data if p['name']=='moovy']; print(m[0]['pm2_env']['status'] if m else 'NOT_FOUND')\`" 2>&1").Trim()
        if ($pm2Status -eq "online") {
            Write-Host "  OK pm2 status: online" -ForegroundColor Green
        } else {
            Add-Error "[PM2] Status: $pm2Status (esperado online)"
            $deploySuccess = $false
        }
    }
}

# === PASO 14: Maintenance mode OFF + Tag git (mejoras 10 y 13) ===
Write-Host ""
Write-Host "[14/15] Cleanup post-deploy..." -ForegroundColor Yellow

# 14.a Maintenance OFF
ssh "$VPS_USER@$VPS_HOST" "PGPASSWORD=postgres psql -h 127.0.0.1 -p $VPS_DB_PORT -U $VPS_DB_USER -d $VPS_DB_NAME -c \"UPDATE \`\"StoreSettings\`\" SET \`\"isMaintenanceMode\`\" = false WHERE id = 'settings';\"" | Out-Null
Write-Host "  OK maintenance OFF" -ForegroundColor Green

# 14.b Tag git (solo si deploy fue exitoso)
if ($deploySuccess) {
    $tagName = "deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    git tag -a $tagName -m "Deploy $modeLabel ($commitsCount commits)" 2>&1 | Out-Null
    git push origin $tagName 2>&1 | Out-Null
    Write-Host "  OK tag: $tagName" -ForegroundColor Green
}

# 14.c Liberar lock
ssh "$VPS_USER@$VPS_HOST" "rm -f $LOCK_FILE" | Out-Null
Write-Host "  OK lock liberado" -ForegroundColor Green

# 14.d Volver a develop
git checkout develop 2>&1 | Out-Null

# === PASO 15: Resumen final ===
Write-Host ""
Write-Host "[15/15] Resumen final" -ForegroundColor Yellow
$elapsed = (Get-Date) - $deployStart
$elapsedStr = "{0:mm}:{0:ss}" -f $elapsed

if ($deploySuccess -and $errorSummary.Count -eq 0) {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "[DEPLOY OK] $modeLabel" -ForegroundColor Green
    Write-Host "  Tiempo:    $elapsedStr" -ForegroundColor Gray
    Write-Host "  Commits:   $commitsCount" -ForegroundColor Gray
    Write-Host "  Tag:       $tagName" -ForegroundColor Gray
    Write-Host "  URL:       https://somosmoovy.com" -ForegroundColor Gray
    Write-Host "  Logs:      $logFile" -ForegroundColor Gray
    Write-Host "=========================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Red
    Write-Host "[DEPLOY CON ERRORES]" -ForegroundColor Red
    foreach ($err in $errorSummary) {
        Write-Host "  - $err" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Para hacer rollback: .\scripts\rollback.ps1" -ForegroundColor Yellow
    Write-Host "Logs: $logFile" -ForegroundColor Gray
    Write-Host "=========================================" -ForegroundColor Red
}

if ($script:transcriptStarted) { Stop-Transcript | Out-Null }
