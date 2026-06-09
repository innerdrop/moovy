# cerrar-tienda.ps1 -- Pone la cortina "Proximamente" (LAUNCH_GATE=closed)
#
# Setea LAUNCH_GATE=closed en el .env del VPS y recarga la app (pm2). El publico
# pasa a ver la pantalla "Proximamente". Vos seguis entrando con tu link de
# preview: https://somosmoovy.com/?preview=moovy2026preview
#
# Cerrar es la direccion SEGURA, asi que no pide confirmacion fuerte.
#
# ASCII puro (PowerShell 5.1 sin BOM).
#
# Uso: .\scripts\cerrar-tienda.ps1

$VPS_HOST = "31.97.14.156"
$VPS_USER = "root"
$VPS_PATH = "/var/www/moovy"

# Garantiza que exista PREVIEW_TOKEN (asi nunca te quedas afuera con la cortina
# puesta), quita cualquier LAUNCH_GATE previo y setea LAUNCH_GATE=closed; reload.
$remote = "cd $VPS_PATH && (grep -q '^PREVIEW_TOKEN=' .env || echo 'PREVIEW_TOKEN=moovy2026preview' >> .env) && (grep -v '^LAUNCH_GATE=' .env > .env.tmp 2>/dev/null || true) && echo 'LAUNCH_GATE=closed' >> .env.tmp && mv .env.tmp .env && pm2 reload all --update-env > /dev/null 2>&1 && echo OK_CLOSED"

Write-Host ""
Write-Host "[TIENDA] Poniendo la cortina 'Proximamente' en el VPS..." -ForegroundColor Yellow
$result = ssh "$VPS_USER@$VPS_HOST" $remote 2>&1
Write-Host $result

if ($result -match "OK_CLOSED") {
    Write-Host ""
    Write-Host "[OK] Cortina puesta. El publico ve 'Proximamente'." -ForegroundColor Green
    Write-Host "     Vos entras con: https://somosmoovy.com/?preview=moovy2026preview" -ForegroundColor Gray
    Write-Host "     Para abrir al publico: .\scripts\abrir-tienda.ps1" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "[ERROR] Algo fallo -- la cortina puede no haberse puesto. Revisa el output de arriba." -ForegroundColor Red
    exit 1
}
