$filePath = "$(Get-Location)\database_dump.sql"
Write-Host "Reparando codificación en $filePath..." -ForegroundColor Cyan

# Leer todo el contenido (usando codificación que preserve los ?? si es posible, o simplemente as-is)
$content = [System.IO.File]::ReadAllText($filePath)

$replacements = @(
    @("R??pido", "Rápido"),
    @("Ver m??s", "Ver más"),
    @("est??s", "estás"),
    @("Tama??o", "Tamaño"),
    @("atenci??n", "atención"),
    @("Atenci??n", "Atención"),
    @("Env??o", "Envío"),
    @("Categor??a", "Categoría"),
    @("categor??a", "categoría"),
    @("promoci??n", "promoción"),
    @("Promoci??n", "Promoción"),
    @("??ltimos", "Últimos"),
    @("S??", "Sí"),
    @("Ma??ana", "Mañana"),
    @("ma??ana", "mañana"),
    @("Cerrad??", "Cerrado"),
    @("m??", "más")
)

foreach ($pair in $replacements) {
    $bad = $pair[0]
    $good = $pair[1]
    if ($content.Contains($bad)) {
        Write-Host "Reemplazando: $bad -> $good" -ForegroundColor Yellow
        $content = $content.Replace($bad, $good)
    }
}

# Guardar en UTF-8 puro (sin BOM)
[System.IO.File]::WriteAllText($filePath, $content)
Write-Host "Listo! Dump reparado." -ForegroundColor Green
