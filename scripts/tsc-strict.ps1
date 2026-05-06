# tsc-strict.ps1 -- Validacion completa de TypeScript pre-commit
# Rama: fix/state-machine-paralela-merchant-driver
#
# DOBLE VERIFICACION: el dia a dia usa `npx tsc --noEmit --skipLibCheck`
# (rapido, sin ruido). Antes de commitear, este script:
#   1. Limpia el cache de Next.js (.next/) para matar cualquier archivo
#      a medias que haya dejado Turbopack
#   2. Regenera los tipos de routes haciendo un build parcial
#   3. Corre tsc con tsconfig.strict.json (incluye .next/dev/types/)
#
# Si el strict falla, el script termina con exit code 1 -- util para que
# finish.ps1 aborte el commit.
#
# IMPORTANTE: este archivo es 100% ASCII puro. No usar em-dashes (--),
# box-drawing chars, checkmarks, ni tildes. PowerShell 5.1 sin BOM
# interpreta UTF-8 con codepage Windows-1252 y rompe el parser cuando
# encuentra bytes que coinciden con smart quotes (0x93, 0x94).
#
# Uso manual:
#   .\scripts\tsc-strict.ps1
#
# Tarda ~20-30 segundos.

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "[TSC-STRICT] Validacion completa pre-commit" -ForegroundColor Cyan
Write-Host ("=" * 60)

# === 1. Limpiar cache de Next.js ===
Write-Host "[1/3] Limpiando cache .next/..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
}
Write-Host "      [OK] Cache limpio"

# === 2. Regenerar tipos de routes con build parcial ===
Write-Host "[2/3] Regenerando tipos con build parcial..." -ForegroundColor Yellow
Write-Host "      (esto puede tardar ~20s)"

# Build sin lint (mas rapido) -- solo necesitamos los tipos generados.
# Capturamos el log a un archivo temporal para poder mostrarlo si falla.
$buildLogFile = Join-Path $env:TEMP ("moovy-build-" + [guid]::NewGuid().ToString() + ".log")
$buildExitCode = 0
try {
    $env:NEXT_TELEMETRY_DISABLED = "1"
    npm run build 2>&1 | Out-File -FilePath $buildLogFile -Encoding utf8
    $buildExitCode = $LASTEXITCODE
} catch {
    $buildExitCode = 1
}

if ($buildExitCode -ne 0) {
    Write-Host "      [FAIL] Build fallo (exit $buildExitCode) -- los tipos generados pueden estar incompletos" -ForegroundColor Red
    Write-Host ""
    Write-Host "      --- ULTIMAS 50 LINEAS DEL LOG DE BUILD ---" -ForegroundColor Yellow
    if (Test-Path $buildLogFile) {
        Get-Content $buildLogFile -Tail 50 | ForEach-Object {
            Write-Host "      $_" -ForegroundColor Gray
        }
        Write-Host ""
        Write-Host "      Log completo en: $buildLogFile" -ForegroundColor DarkGray
    } else {
        Write-Host "      (no se encontro el log -- algo raro paso)" -ForegroundColor Red
    }
    Write-Host "      ------------------------------------------" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "      [OK] Tipos regenerados"
    # Solo borramos el log si el build fue exitoso
    if (Test-Path $buildLogFile) { Remove-Item -Force $buildLogFile -ErrorAction SilentlyContinue }
}

# === 3. TSC strict ===
Write-Host "[3/3] Corriendo tsc con tsconfig.strict.json..." -ForegroundColor Yellow
Write-Host ""

npx tsc --noEmit --skipLibCheck -p tsconfig.strict.json
$tscExitCode = $LASTEXITCODE

Write-Host ""
Write-Host ("=" * 60)

if ($tscExitCode -eq 0) {
    Write-Host "[OK] TSC STRICT PASSED -- ningun error de tipos" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[FAIL] TSC STRICT FAILED -- corregi los errores antes de commitear" -ForegroundColor Red
    exit 1
}
