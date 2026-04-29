# Script de rollback al ultimo deploy funcional
# Uso:
#   .\scripts\rollback.ps1                   -> rollback al tag deploy-* anterior + restore DB del ultimo backup
#   .\scripts\rollback.ps1 -Tag <tagname>    -> rollback a un tag especifico
#   .\scripts\rollback.ps1 -NoDB             -> rollback solo de codigo (no toca DB)
#   .\scripts\rollback.ps1 -ListBackups      -> lista backups disponibles en VPS y sale

param(
    [string]$Tag,
    [switch]$NoDB,
    [switch]$ListBackups
)

$ErrorActionPreference = "Continue"

$VPS_HOST = "31.97.14.156"
$VPS_USER = "root"
$VPS_PATH = "/var/www/moovy"
$VPS_DB_PORT = "5436"
$VPS_DB_USER = "postgres"
$VPS_DB_NAME = "moovy_db"
$VPS_BACKUP_DIR = "$VPS_PATH/backups"

function Stop-WithError {
    param($msg)
    Write-Host ""
    Write-Host "[ABORTADO] $msg" -ForegroundColor Red
    exit 1
}

# Logs
$rollbacksDir = "deploys"
if (-not (Test-Path $rollbacksDir)) { New-Item -ItemType Directory -Path $rollbacksDir | Out-Null }
$logFile = Join-Path $rollbacksDir "rollback_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
try { Start-Transcript -Path $logFile -Append | Out-Null } catch {}

Write-Host ""
Write-Host "[ROLLBACK]" -ForegroundColor Cyan
Write-Host "==========" -ForegroundColor Cyan

# === Modo ListBackups ===
if ($ListBackups) {
    Write-Host ""
    Write-Host "Backups disponibles en VPS:" -ForegroundColor Yellow
    ssh "$VPS_USER@$VPS_HOST" "ls -lh $VPS_BACKUP_DIR 2>/dev/null || echo 'No hay backups'"
    Write-Host ""
    Write-Host "Tags de deploy disponibles:" -ForegroundColor Yellow
    git fetch origin --tags 2>&1 | Out-Null
    git tag -l "deploy-*" --sort=-creatordate | Select-Object -First 10
    Stop-Transcript | Out-Null
    exit 0
}

# === PASO 1: Determinar tag a rollback ===
git fetch origin --tags 2>&1 | Out-Null

if (-not $Tag) {
    # Buscar el tag ANTERIOR al actual de main (el ultimo deploy antes del que rompio)
    $currentMain = (git rev-parse origin/main).Trim()
    $tags = git tag -l "deploy-*" --sort=-creatordate

    foreach ($t in $tags) {
        $tagCommit = (git rev-parse "$t^{commit}").Trim()
        if ($tagCommit -ne $currentMain) {
            $Tag = $t
            break
        }
    }

    if (-not $Tag) {
        Stop-WithError "No encontre tag deploy-* anterior. Probaste con .\scripts\rollback.ps1 -ListBackups?"
    }
}

# Verificar que el tag existe
$tagExists = git rev-parse --verify "$Tag^{commit}" 2>&1
if ($LASTEXITCODE -ne 0) {
    Stop-WithError "Tag '$Tag' no existe. Hace .\scripts\rollback.ps1 -ListBackups para ver disponibles."
}

Write-Host "  Rollback target tag: $Tag" -ForegroundColor White
Write-Host "  Modo:                $(if ($NoDB) { 'Solo codigo' } else { 'Codigo + restore DB' })" -ForegroundColor White
Write-Host ""

# === PASO 2: Backup actual a la inversa (por las dudas) ===
if (-not $NoDB) {
    $preRollbackBackup = "backup_pre_rollback_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
    Write-Host "[VPS] Backup del estado actual antes del rollback ($preRollbackBackup)..." -ForegroundColor Yellow
    ssh "$VPS_USER@$VPS_HOST" "docker exec moovy-db pg_dump -U $VPS_DB_USER $VPS_DB_NAME > $VPS_BACKUP_DIR/$preRollbackBackup"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [WARN] Backup pre-rollback fallo. Continuando bajo tu cuenta." -ForegroundColor Yellow
    } else {
        Write-Host "  OK backup pre-rollback guardado" -ForegroundColor Green
    }
}

# === PASO 3: Confirmacion ===
Write-Host ""
$confirm = Read-Host "Confirmar rollback a $Tag? Esto va a REVERTIR codigo (y DB si NoDB no esta seteado). (s/n) [n]"
if ($confirm -ine "s") {
    Stop-WithError "Cancelado por usuario."
}

# === PASO 4: Rollback de codigo en VPS ===
Write-Host ""
Write-Host "[VPS] Reverting code to $Tag..." -ForegroundColor Yellow
$tagCommit = (git rev-parse "$Tag^{commit}").Trim()

# Maintenance ON
'UPDATE "StoreSettings" SET "isMaintenanceMode" = true WHERE id = ''settings'';' | ssh "$VPS_USER@$VPS_HOST" "docker exec -i moovy-db psql -U $VPS_DB_USER -d $VPS_DB_NAME" | Out-Null

$rollbackCmd = "cd $VPS_PATH && " +
    "git fetch origin --tags && " +
    "git reset --hard $tagCommit && " +
    "npm ci && " +
    "npx prisma generate && " +
    "npm run build && " +
    "pm2 reload all --update-env"

ssh "$VPS_USER@$VPS_HOST" "$rollbackCmd" 2>&1 | Out-Host
$codeOk = ($LASTEXITCODE -eq 0)

if (-not $codeOk) {
    Write-Host "[ERROR] Rollback de codigo fallo. Estado del VPS desconocido." -ForegroundColor Red
    Write-Host "Hace SSH manual y verifica: ssh $VPS_USER@$VPS_HOST" -ForegroundColor Yellow
    Stop-Transcript | Out-Null
    exit 1
}

# === PASO 5: Restore DB (opcional) ===
if (-not $NoDB) {
    Write-Host ""
    Write-Host "[VPS] Buscando backup mas reciente correspondiente a $Tag..." -ForegroundColor Yellow

    # Listar backups de pre-deploy (los que se hicieron antes del deploy que rompio)
    $availableBackups = ssh "$VPS_USER@$VPS_HOST" "ls -t $VPS_BACKUP_DIR/backup_pre_deploy_*.sql 2>/dev/null | head -10"
    Write-Host ""
    Write-Host "Backups disponibles:" -ForegroundColor Cyan
    Write-Host $availableBackups
    Write-Host ""
    $backupFile = Read-Host "Cual backup querés restaurar? (path completo, o ENTER para skipear restore DB)"

    if (-not [string]::IsNullOrWhiteSpace($backupFile)) {
        Write-Host "[VPS] Restaurando DB desde $backupFile..." -ForegroundColor Yellow
        $restoreCmd = "docker exec moovy-db psql -U $VPS_DB_USER -d $VPS_DB_NAME -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public; CREATE EXTENSION IF NOT EXISTS postgis;' && docker exec -i moovy-db psql -U $VPS_DB_USER -d $VPS_DB_NAME < $backupFile"
        ssh "$VPS_USER@$VPS_HOST" "$restoreCmd" 2>&1 | Out-Host
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] Restore DB fallo. La DB puede estar en estado intermedio." -ForegroundColor Red
        } else {
            Write-Host "  OK restore DB" -ForegroundColor Green
            # Reiniciar app despues del restore
            ssh "$VPS_USER@$VPS_HOST" "cd $VPS_PATH && pm2 reload all --update-env" | Out-Null
        }
    } else {
        Write-Host "  Skipped restore DB" -ForegroundColor Gray
    }
}

# === PASO 6: Maintenance OFF + Smoke test ===
'UPDATE "StoreSettings" SET "isMaintenanceMode" = false WHERE id = ''settings'';' | ssh "$VPS_USER@$VPS_HOST" "docker exec -i moovy-db psql -U $VPS_DB_USER -d $VPS_DB_NAME" | Out-Null
Write-Host "  OK maintenance OFF" -ForegroundColor Green

Write-Host ""
Write-Host "[VPS] Smoke test post-rollback..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

try {
    $health = Invoke-WebRequest -Uri "https://somosmoovy.com/api/health" -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
    if ($health.StatusCode -eq 200) {
        Write-Host "  OK /api/health 200" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] /api/health: $($health.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [WARN] /api/health no responde: $_" -ForegroundColor Yellow
}

# === PASO 7: Resumen ===
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "[ROLLBACK COMPLETADO]" -ForegroundColor Green
Write-Host "  Tag:       $Tag" -ForegroundColor Gray
Write-Host "  URL:       https://somosmoovy.com" -ForegroundColor Gray
Write-Host "  Logs:      $logFile" -ForegroundColor Gray
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

Stop-Transcript | Out-Null
