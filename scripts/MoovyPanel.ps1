# Panel de Control Moovy - GUI
# Ejecutar desde la raiz del proyecto

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName Microsoft.VisualBasic

# Detectar ruta del proyecto (donde esta el exe o el script)
$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$projectPath = if ($scriptDir -like "*scripts*") { Split-Path -Parent $scriptDir } else { $scriptDir }
if (-not (Test-Path "$projectPath\package.json")) {
    $projectPath = Get-Location
}

# Funcion para mostrar notificacion Windows
function Show-Notification {
    param($Title, $Message, $Type = "Info")
    
    $notify = New-Object System.Windows.Forms.NotifyIcon
    $notify.Icon = [System.Drawing.SystemIcons]::Information
    $notify.BalloonTipIcon = $Type
    $notify.BalloonTipTitle = $Title
    $notify.BalloonTipText = $Message
    $notify.Visible = $true
    $notify.ShowBalloonTip(3000)
    
    Start-Sleep -Milliseconds 3500
    $notify.Dispose()
}

# Funcion para ejecutar script
function Run-Script {
    param($ScriptName, $Args = "")
    
    $statusLabel.Text = "Ejecutando $ScriptName..."
    $statusLabel.ForeColor = [System.Drawing.Color]::Orange
    $form.Refresh()
    
    try {
        $scriptPath = Join-Path $projectPath "scripts\$ScriptName"
        
        if ($Args) {
            $process = Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -File `"$scriptPath`" $Args" -WorkingDirectory $projectPath -Wait -PassThru -NoNewWindow
        } else {
            $process = Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -File `"$scriptPath`"" -WorkingDirectory $projectPath -Wait -PassThru -NoNewWindow
        }
        
        if ($process.ExitCode -eq 0) {
            $statusLabel.Text = "$ScriptName completado!"
            $statusLabel.ForeColor = [System.Drawing.Color]::Green
            Show-Notification "Moovy" "$ScriptName ejecutado exitosamente" "Info"
        } else {
            $statusLabel.Text = "$ScriptName finalizado"
            $statusLabel.ForeColor = [System.Drawing.Color]::Yellow
            Show-Notification "Moovy" "$ScriptName finalizado" "Info"
        }
    } catch {
        $statusLabel.Text = "Error: $_"
        $statusLabel.ForeColor = [System.Drawing.Color]::Red
        Show-Notification "Moovy" "Error ejecutando $ScriptName" "Error"
    }
}

# Crear ventana principal
$form = New-Object System.Windows.Forms.Form
$form.Text = "Moovy - Panel de Control"
$form.Size = New-Object System.Drawing.Size(320, 400)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedSingle"
$form.MaximizeBox = $false
$form.BackColor = [System.Drawing.Color]::FromArgb(30, 30, 35)
$form.ForeColor = [System.Drawing.Color]::White

# Titulo
$titleLabel = New-Object System.Windows.Forms.Label
$titleLabel.Text = "MOOVY"
$titleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 18, [System.Drawing.FontStyle]::Bold)
$titleLabel.ForeColor = [System.Drawing.Color]::FromArgb(100, 149, 237)
$titleLabel.AutoSize = $true
$titleLabel.Location = New-Object System.Drawing.Point(110, 15)
$form.Controls.Add($titleLabel)

# Subtitulo
$subLabel = New-Object System.Windows.Forms.Label
$subLabel.Text = "Panel de Desarrollo"
$subLabel.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$subLabel.ForeColor = [System.Drawing.Color]::Gray
$subLabel.AutoSize = $true
$subLabel.Location = New-Object System.Drawing.Point(100, 50)
$form.Controls.Add($subLabel)

# Estilo de botones
function Create-Button {
    param($Text, $Y, $Color, $OnClick)
    
    $btn = New-Object System.Windows.Forms.Button
    $btn.Text = $Text
    $btn.Size = New-Object System.Drawing.Size(260, 45)
    $btn.Location = New-Object System.Drawing.Point(20, $Y)
    $btn.FlatStyle = "Flat"
    $btn.BackColor = $Color
    $btn.ForeColor = [System.Drawing.Color]::White
    $btn.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
    $btn.Cursor = "Hand"
    $btn.Add_Click($OnClick)
    return $btn
}

# Boton Sync
$btnSync = Create-Button "Sincronizar (Bajar cambios)" 85 ([System.Drawing.Color]::FromArgb(46, 139, 87)) {
    Run-Script "sync.ps1" "-SkipDev"
}
$form.Controls.Add($btnSync)

# Boton Start
$btnStart = Create-Button "Iniciar Nueva Rama" 140 ([System.Drawing.Color]::FromArgb(70, 130, 180)) {
    Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -NoExit -File `"$projectPath\scripts\start.ps1`"" -WorkingDirectory $projectPath
    $statusLabel.Text = "Nueva rama iniciada en terminal"
    $statusLabel.ForeColor = [System.Drawing.Color]::Cyan
}
$form.Controls.Add($btnStart)

# Boton Publish
$btnPublish = Create-Button "Publicar Cambios" 195 ([System.Drawing.Color]::FromArgb(255, 140, 0)) {
    $message = [Microsoft.VisualBasic.Interaction]::InputBox("Descripcion del cambio:", "Publicar Cambios", "feat: ")
    if ($message -and $message -ne "") {
        Run-Script "publish.ps1" "-Message `"$message`""
    }
}
$form.Controls.Add($btnPublish)

# Boton Finish
$btnFinish = Create-Button "Finalizar y Mergear a Develop" 250 ([System.Drawing.Color]::FromArgb(138, 43, 226)) {
    $message = [Microsoft.VisualBasic.Interaction]::InputBox("Descripcion del cambio:", "Finalizar Cambios", "feat: ")
    if ($message -and $message -ne "") {
        Run-Script "finish.ps1" "-Message `"$message`""
    }
}
$form.Controls.Add($btnFinish)

# Label de estado
$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Text = "Listo - Proyecto: $projectPath"
$statusLabel.Font = New-Object System.Drawing.Font("Segoe UI", 8)
$statusLabel.ForeColor = [System.Drawing.Color]::Gray
$statusLabel.AutoSize = $false
$statusLabel.Size = New-Object System.Drawing.Size(280, 40)
$statusLabel.Location = New-Object System.Drawing.Point(20, 310)
$statusLabel.TextAlign = "MiddleCenter"
$form.Controls.Add($statusLabel)

# Mostrar ventana
$form.Add_Shown({$form.Activate()})
[void]$form.ShowDialog()
