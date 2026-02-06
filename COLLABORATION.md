# Guía de Colaboración - Moovy

## 📋 Flujo de Trabajo

### Sincronizarse con el equipo
```powershell
.\scripts\sync.ps1
```
Esto actualiza código, dependencias, base de datos y arranca el servidor.

### Reiniciar base de datos desde cero
```powershell
.\scripts\reset-db.ps1
```
Útil cuando hay conflictos de datos o querés empezar limpio.

---

## 🌿 Crear una Feature

1. **Crear rama desde develop:**
   ```powershell
   git checkout develop
   git pull origin develop
   git checkout -b feature/mi-feature
   ```

2. **Desarrollar y commitear:**
   ```powershell
   git add .
   git commit -m "feat: descripción del cambio"
   ```

3. **Si modificás el schema de Prisma:**
   ```powershell
   npx prisma db push
   ```

4. **Subir cambios:**
   ```powershell
   git push origin feature/mi-feature
   ```

5. **Crear Pull Request** hacia `develop` en GitHub.

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
