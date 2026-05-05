# tsc-strict.ps1 — Validación completa de TypeScript pre-commit
# Rama: fix/delivery-fee-preview-vs-cobro
#
# DOBLE VERIFICACIÓN: el día a día usa `npx tsc --noEmit --skipLibCheck`
# (rápido, sin ruido). Antes de commitear, este script:
#   1. Limpia el cache de Next.js (.next/) para matar cualquier archivo
#      a medias que haya dejado Turbopack
#   2. Regenera los tipos de routes haciendo un build parcial
#   3. Corre tsc con tsconfig.strict.json (incluye .next/dev/types/)
#
# Si el strict falla, el script termina con exit code 1 — útil para que
# finish.ps1 aborte el commit.
#
# Uso manual:
#   .\scripts\tsc-strict.ps1
#
# Tarda ~20-30 segundos.

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "[TSC-STRICT] Validación completa pre-commit" -ForegroundColor Cyan
Write-Host ("─" * 60)

# ─── 1. Limpiar cache de Next.js ──────────────────────────────────────
Write-Host "[1/3] Limpiando cache .next/..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
}
Write-Host "      ✓ Cache limpio"

# ─── 2. Regenerar tipos de routes con build parcial ───────────────────
Write-Host "[2/3] Regenerando tipos con build parcial..." -ForegroundColor Yellow
Write-Host "      (esto puede tardar ~20s)"

# Build sin lint (más rápido) — solo necesitamos los tipos generados
$buildExitCode = 0
try {
    $env:NEXT_TELEMETRY_DISABLED = "1"
    npm run build 2>&1 | Out-Null
    $buildExitCode = $LASTEXITCODE
} catch {
    $buildExitCode = 1
}

if ($buildExitCode -ne 0) {
    Write-Host "      ✖ Build falló — los tipos generados pueden estar incompletos" -ForegroundColor Red
    Write-Host "        Vas a ver errores en el TSC strict abajo. Resolvelos y volvé a intentar." -ForegroundColor Yellow
} else {
    Write-Host "      ✓ Tipos regenerados"
}

# ─── 3. TSC strict ────────────────────────────────────────────────────
Write-Host "[3/3] Corriendo tsc con tsconfig.strict.json..." -ForegroundColor Yellow
Write-Host ""

npx tsc --noEmit --skipLibCheck -p tsconfig.strict.json
$tscExitCode = $LASTEXITCODE

Write-Host ""
Write-Host ("─" * 60)

if ($tscExitCode -eq 0) {
    Write-Host "✓ TSC STRICT PASSED — ningún error de tipos" -ForegroundColor Green
    exit 0
} else {
    Write-Host "✖ TSC STRICT FAILED — corregí los errores antes de commitear" -ForegroundColor Red
    exit 1
}
