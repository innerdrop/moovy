# Guía de Colaboración - Moovy

## 📋 Flujo de Trabajo

### Sincronizarse con el equipo (Bajar cambios)
```powershell
.\scripts\sync.ps1
```
Esto actualiza código, dependencias y la base de datos (datos compartidos).

### Publicar mis cambios (Subir cambios)
```powershell
.\scripts\publish.ps1 -Message "descripcion del cambio"
```
Esto guarda tu código, exporta tu base de datos actual para el equipo y sube todo a GitHub.

### Reiniciar base de datos desde cero
```powershell
.\scripts\reset-db.ps1
```
Útil cuando hay conflictos de datos o querés empezar limpio.

---

## 🌿 Flujo Completo de Trabajo

### 1. Iniciar nuevos cambios
```powershell
.\scripts\start.ps1
```
Te permite elegir el tipo (feature/fix/hotfix/refactor) y crea la rama automaticamente.

### 2. Trabajar normalmente
### Comandos Básicos (PowerShell)
- `.\scripts\sync.ps1`: Sincroniza código y base de datos con el equipo.
- `.\scripts\publish.ps1`: Sube tus cambios de tu rama a `develop`.
- `.\scripts\devmain.ps1`: Pasa los cambios finales de `develop` a `main` (Producción).
- `.\scripts\finish.ps1`: Finaliza una tarea, mergea y limpia ramas.

---

## ⚠️ Reglas Importantes

| ✅ Hacer | ❌ No hacer |
|----------|-------------|
| Trabajar en ramas `feature/x` | Commitear directo a `develop` o `main` |
| Usar `sync.ps1` antes de empezar | Hacer `db push --force-reset` sin avisar |
| Enriquecer el seed con datos demo | Compartir dumps de base de datos |

---

## 🔐 Credenciales Demo

Todas las cuentas usan contraseña: `demo123`

- **Admin:** admin@somosmoovy.com
- **Comercios:** comercio1@somosmoovy.com, comercio2@..., comercio3@...
- **Riders:** rider1@somosmoovy.com, rider2@..., rider3@...
