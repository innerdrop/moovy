# 📦 Instalación de k6

## Windows (Recomendado: Chocolatey)

### Opción 1: Chocolatey (más fácil)
```powershell
# Instalar Chocolatey si no lo tenés
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Instalar k6
choco install k6
```

### Opción 2: Winget
```powershell
winget install k6 --source winget
```

### Opción 3: Descarga manual
1. Descargar desde: https://github.com/grafana/k6/releases/latest
2. Extraer `k6.exe` a una carpeta (ej: `C:\k6`)
3. Agregar a PATH:
   ```powershell
   $env:Path += ";C:\k6"
   ```

## Verificar instalación

```powershell
k6 version
```

Debería mostrar algo como:
```
k6 v0.49.0 (2024-01-15T12:00:00+0000/v0.49.0-0-gXXXXXXXX, go1.21.5, windows/amd64)
```

## Próximo paso

Una vez instalado k6, ejecutar:
```powershell
.\scripts\setup-monitoring.ps1
```
