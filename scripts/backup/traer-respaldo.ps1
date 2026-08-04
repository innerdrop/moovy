# MOOVY — traer una copia de los respaldos a tu computadora.
#
# Ejecutar: .\scripts\backup\traer-respaldo.ps1
#
# ── POR QUÉ ESTE SCRIPT EXISTE ───────────────────────────────────────────────
#
# El VPS empuja los respaldos a la nube. Esta es la copia que va en el otro
# sentido: tu computadora los VA A BUSCAR.
#
# La diferencia parece de forma pero es de fondo. El servidor tiene credenciales
# guardadas; si alguien entra ahí, tiene esas llaves. Tu computadora usa un token
# DISTINTO, de solo lectura, que el servidor nunca vio y que no está en ningún
# lugar al que un atacante del VPS pueda llegar.
#
# Es lo que en las empresas grandes se llama "tirar, no empujar": el destino va
# a buscar la copia. Así, aunque el servidor caiga entero y sus llaves con él,
# esta copia sigue existiendo y sigue siendo alcanzable.
#
# Corrélo una vez por semana. Tarda menos de un minuto.
#
# ── REQUISITOS ───────────────────────────────────────────────────────────────
#
#   rclone instalado en Windows    (winget install Rclone.Rclone)
#   un remoto llamado "r2moovy" configurado con un token de SOLO LECTURA
#
# Ver docs/RESPALDOS.md, sección "La copia que el servidor no puede tocar".

param(
    [int]$Cuantos = 3,
    [string]$Destino = "$env:USERPROFILE\Moovy-respaldos"
)

$ErrorActionPreference = "Stop"
$REMOTO = "r2moovy:moovy-backups"

Write-Host ""
Write-Host "[RESPALDOS] Trayendo copia local" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command rclone -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] rclone no esta instalado." -ForegroundColor Red
    Write-Host "        Instalalo con: winget install Rclone.Rclone" -ForegroundColor Gray
    exit 1
}

New-Item -ItemType Directory -Force -Path $Destino | Out-Null
Write-Host "[INFO] Destino: $Destino" -ForegroundColor Gray

# ── Los ultimos N respaldos diarios ──────────────────────────────────────────
Write-Host ""
Write-Host "[1/3] Ultimos $Cuantos respaldos diarios..." -ForegroundColor Yellow

$lista = rclone lsf "$REMOTO/db/diario" 2>$null | Sort-Object
if (-not $lista) {
    Write-Host "[ERROR] No hay respaldos en $REMOTO/db/diario" -ForegroundColor Red
    Write-Host "        Revisa que el token tenga permiso de lectura sobre ese bucket." -ForegroundColor Gray
    exit 1
}

$aTraer = $lista | Select-Object -Last $Cuantos
foreach ($archivo in $aTraer) {
    $local = Join-Path $Destino $archivo
    if (Test-Path $local) {
        Write-Host "      ya estaba: $archivo" -ForegroundColor DarkGray
    } else {
        rclone copyto "$REMOTO/db/diario/$archivo" $local
        $mb = [math]::Round((Get-Item $local).Length / 1MB, 1)
        Write-Host "      OK $archivo ($mb MB)" -ForegroundColor Green
    }
}

# ── Todas las mensuales (son pocas y valen oro) ──────────────────────────────
Write-Host ""
Write-Host "[2/3] Copias mensuales..." -ForegroundColor Yellow
rclone copy "$REMOTO/db/mensual" (Join-Path $Destino "mensual") 2>$null
$mensuales = @(Get-ChildItem (Join-Path $Destino "mensual") -ErrorAction SilentlyContinue)
Write-Host "      $($mensuales.Count) copia(s) mensual(es) en local" -ForegroundColor Green

# ── Resumen ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[3/3] Resumen" -ForegroundColor Yellow
$todos = @(Get-ChildItem $Destino -Recurse -File -Filter *.enc)
$totalMb = [math]::Round(($todos | Measure-Object Length -Sum).Sum / 1MB, 1)
$masNuevo = $todos | Sort-Object LastWriteTime -Descending | Select-Object -First 1

Write-Host ""
Write-Host "  Archivos en tu maquina : $($todos.Count)" -ForegroundColor Gray
Write-Host "  Espacio ocupado        : $totalMb MB" -ForegroundColor Gray
if ($masNuevo) {
    Write-Host "  Mas reciente           : $($masNuevo.Name)" -ForegroundColor Gray
}
Write-Host ""
Write-Host "  Estan CIFRADOS. Para abrirlos necesitas la frase de cifrado," -ForegroundColor Gray
Write-Host "  que tiene que estar en tu gestor de contrasenas — NO en el VPS." -ForegroundColor Gray
Write-Host "  Si perdes esa frase, estos archivos no sirven para nada." -ForegroundColor Yellow
Write-Host ""
Write-Host "[OK] Copia local al dia." -ForegroundColor Green
Write-Host ""
