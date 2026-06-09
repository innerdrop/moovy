# abrir-tienda.ps1 -- Abre la tienda al publico (LAUNCH_GATE=open)
#
# Setea LAUNCH_GATE=open en el .env del VPS y recarga la app (pm2). En la
# practica esto es "el lanzamiento": despues de correrlo, somosmoovy.com es
# visible para TODO el mundo.
#
# El candado falla CERRADO: si nunca corres este script, la tienda queda con la
# cortina "Proximamente". Un deploy NO cambia este estado.
#
# ASCII puro (PowerShell 5.1 sin BOM, igual que el resto de scripts).
#
# Uso: .\scripts\abrir-tienda.ps1

$VPS_HOST = "31.97.14.156"
$VPS_USER = "root"
$VPS_PATH = "/var/www/moovy"

Write-Host ""
Write-Host "[TIENDA] Vas a ABRIR la tienda al PUBLICO." -ForegroundColor Yellow
Write-Host "         Despues de esto, somosmoovy.com es visible para TODOS." -ForegroundColor Yellow
Write-Host ""
$ok = Read-Host "Estas seguro? Escribi 'abrir' para confirmar"
if ($ok -ne "abrir") {
    Write-Host "[TIENDA] Cancelado. La tienda sigue como estaba." -ForegroundColor Cyan
    exit 0
}

# Garantiza que exista PREVIEW_TOKEN (si falta, lo agrega con el valor por defecto),
# quita cualquier LAUNCH_GATE previo y setea LAUNCH_GATE=open; luego pm2 reload.
$remote = "cd $VPS_PATH && (grep -q '^PREVIEW_TOKEN=' .env || echo 'PREVIEW_TOKEN=moovy2026preview' >> .env) && (grep -v '^LAUNCH_GATE=' .env > .env.tmp 2>/dev/null || true) && echo 'LAUNCH_GATE=open' >> .env.tmp && mv .env.tmp .env && pm2 reload all --update-env > /dev/null 2>&1 && echo OK_OPEN"

Write-Host ""
Write-Host "[TIENDA] Abriendo en el VPS..." -ForegroundColor Yellow
$result = ssh "$VPS_USER@$VPS_HOST" $remote 2>&1
Write-Host $result

if ($result -match "OK_OPEN") {
    Write-Host ""
    Write-Host "[OK] Tienda ABIERTA. somosmoovy.com ya es publico." -ForegroundColor Green
    Write-Host "     Para volver a cerrar: .\scripts\cerrar-tienda.ps1" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "[ERROR] Algo fallo -- la tienda puede no haber cambiado. Revisa el output de arriba." -ForegroundColor Red
    exit 1
}
