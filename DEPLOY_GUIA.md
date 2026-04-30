# MOOVY — Guía de Deploy

Última actualización: 2026-04-29

> **Esta guía cubre todo lo que necesitás saber para deployar Moovy a producción.** Reemplaza al `DEPLOY_CHECKLIST.md` viejo. Si algo no está acá, abrí una sesión con Claude y preguntá.

---

## Setup inicial (una sola vez)

### 1. SSH keys al VPS

El sistema de deploy hace ~10 conexiones SSH al VPS por cada deploy. Sin SSH keys, te pediría password 10 veces. Setup en 5 minutos:

**En PowerShell local**:

```powershell
# Si todavía no tenés key (chequear con: Test-Path ~/.ssh/id_ed25519)
ssh-keygen -t ed25519 -C "moovy-deploy"
# Enter Enter Enter (default path, sin passphrase)

# Copiar la pública al portapapeles
Get-Content ~/.ssh/id_ed25519.pub | clip
```

**SSH al VPS** (te pide password una última vez):

```powershell
ssh root@31.97.14.156
```

**Dentro del VPS**:

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Pegar la key (click derecho del mouse en Windows Terminal)
# Ctrl+X, Y, Enter
chmod 600 ~/.ssh/authorized_keys
exit
```

**Test**: `ssh root@31.97.14.156` debe entrar sin pedir password.

### 2. Variables de entorno locales

Ya están en tu `.env` desde el setup inicial. Si agregaste una variable nueva, asegurate de:
1. Agregarla a `.env` local
2. Documentarla en `.claude/CLAUDE.md` sección "Variables de entorno"
3. Setearla en el `.env` del VPS antes del próximo deploy: `ssh root@31.97.14.156 "nano /var/www/moovy/.env"`

---

## Workflow diario de deploy

### Paso 1: Asegurate de estar en `develop` con todas las ramas cerradas

```powershell
git status                    # debe estar limpio
git branch --show-current     # debe decir 'develop'
```

### Paso 2: Dry-run (recomendado siempre)

```powershell
.\scripts\devmain.ps1 -DryRun
```

El dry-run ejecuta los **8 primeros pasos** (verificaciones) sin tocar producción. Si pasa los 8 checks, sabés que el deploy real va a salir bien.

Lo que verifica el dry-run:
1. Estás en `develop`
2. Working tree limpio (sin cambios sin commitear)
3. `develop` sincronizado con `origin/develop`
4. **Pre-flight checks**: TS check + `validate-ops-config` + `npm run build` local
5. VPS accesible por SSH
6. Lock file libre (no hay otro deploy en curso)
7. Env vars críticos presentes en VPS (`DATABASE_URL`, `CRON_SECRET`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `AUTH_SECRET` o `NEXTAUTH_SECRET`)
8. Resumen pre-deploy con confirmación

Tarda ~1-2 minutos (el `npm run build` local es lo más lento).

### Paso 3: Deploy real

```powershell
.\scripts\devmain.ps1
```

Mismo comando que el dry-run pero sin el `-DryRun`. Después del paso 8 te pide confirmación con `(s/n) [s]`. **Apretá Enter** para arrancar el deploy.

Lo que hace después:
9. **Backup de DB** en VPS via `docker exec moovy-db pg_dump` (cleanup automático >30 días)
10. **Maintenance mode ON** vía SQL directo a `StoreSettings`
11. Merge `develop → main` + push GitHub
12. **Deploy en VPS**: `git fetch + reset --hard + npm ci/skip + prisma generate/skip + rm -rf .next + npm run build + pm2 reload all --update-env`
13. **Smoke test** con retry: 5 intentos a `/api/health` con backoff (5s/15s/30s/50s/80s) + verificación `pm2 jlist online`
14. **Maintenance mode OFF** + **tag git automático** `deploy-YYYYMMDD-HHMMSS` + push del tag
15. Resumen final con tiempo total + URL + log persistente

Tarda **40-60 segundos** en deploys típicos sin cambios de schema/deps. Hasta **120 segundos** si cambian dependencias o hay cambios de schema.

### Paso 4: Verificar producción

```powershell
# Status del sistema:
ssh root@31.97.14.156 "curl -s -i http://localhost:3002/api/health | head -3"
```

Esperás `HTTP/1.1 200 OK`.

O abrí en browser: `https://somosmoovy.com/api/health` — debería responder con un JSON `"status": "healthy"` y `database` + `socketServer` ambos en `"ok"`.

---

## Modos del script

| Modo | Comando | Cuándo usar |
|---|---|---|
| Default | `.\scripts\devmain.ps1` | Deploy normal (código + schema seguro) |
| Dry-run | `.\scripts\devmain.ps1 -DryRun` | Validar sin deployar |
| Solo código | `.\scripts\devmain.ps1 -NoDB` | Cuando NO cambió schema (más rápido) |
| Schema only | `.\scripts\devmain.ps1 -SchemaOnly` | Equivalente al default, explícito |
| Clean prod | `.\scripts\devmain.ps1 -CleanProd` | **CUIDADO**: borra toda la DB y corre seed. Solo primera vez o reset manual |

---

## Troubleshooting (problemas reales que tuvimos)

### "TS errors detectados" en paso 4

El pre-flight detecta errores TS antes de deployar. Resolvé los errores en una rama de fix y volvé a intentar. **Es exactamente lo que el sistema tiene que hacer** — atrapar bugs antes de prod.

### "No llego al VPS por SSH" en paso 5

Verificá conectividad manualmente: `ssh root@31.97.14.156 "echo ok"`. Si no llega, el VPS está caído o tu red bloquea SSH. Esperá unos minutos y reintentá.

### "Otro deploy esta en curso (lock con XXX segundos)" en paso 6

Pasa cuando un deploy anterior se interrumpió con Ctrl+C entre los pasos 6-14 sin liberar el lock. Si confirmás que no hay otro deploy corriendo:

```powershell
ssh root@31.97.14.156 "rm /tmp/moovy-deploy.lock"
```

Y reintentá. El script auto-limpia locks de más de 30 minutos.

### "Faltan env vars criticos en VPS .env"

El script chequea estos vars en `/var/www/moovy/.env`:
- **Hard required**: `DATABASE_URL`, `CRON_SECRET`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`
- **Al menos uno de**: `AUTH_SECRET` o `NEXTAUTH_SECRET`

Editá el `.env` del VPS:

```powershell
ssh root@31.97.14.156 "nano /var/www/moovy/.env"
```

### "pg_dump: error: server version mismatch" en paso 9

Bug detectado y resuelto el 2026-04-28: el cliente `pg_dump` del sistema VPS tiene versión 14, el server Postgres es versión 15. **Ya está fixeado** — el script usa `docker exec moovy-db pg_dump` que corre desde dentro del container donde la versión coincide. Si volvés a verlo, abrí sesión con Claude.

### Smoke test "503 No responde en 5 intentos"

El endpoint `/api/health` responde 503 cuando algo del backend falla. Para diagnosticar, abrí `https://somosmoovy.com/api/health` y mirá qué check da `"status": "error"`:

- **`database` error**: Postgres caído o credenciales mal. `ssh root@VPS "docker ps | grep moovy-db"`
- **`socketServer` error**: socket-server caído o en puerto incorrecto. `ssh root@VPS "pm2 list"` y verificá que `moovy-socket` esté `online`. El puerto debería ser 3004 (variable `SOCKET_PORT` en `.env`).

### Endpoint nuevo da 404 después del deploy

Bug raro de Next.js 16 con Turbopack: el manifest interno puede quedar stale después de un `git reset --hard`. **Ya está fixeado** — el script hace `rm -rf .next` antes de cada `npm run build` para garantizar build limpio determinista. Si volvés a verlo, manualmente:

```powershell
ssh root@31.97.14.156 "cd /var/www/moovy && rm -rf .next && npm run build && pm2 restart moovy --update-env"
```

### Bash error "unexpected EOF while looking for matching"

Pasaba con escapes anidados PowerShell → SSH → bash → docker → psql. **Ya está fixeado** — el script usa `docker exec -i ... psql` con SQL via stdin (sin `-c`). Si volvés a verlo, abrí sesión con Claude.

### `pm2 reload moovy` reinició solo Next.js, no el socket-server

El VPS tiene 6 procesos pm2 separados (`mjobs`, `moovy`, `moovy-socket`, `og-deco`, `vora-web`, `vsolutions`). **Ya está fixeado** — el script usa `pm2 reload all --update-env` para recargar todos los procesos del repo Moovy.

### Sitio carga pero `/api/X` da 404 que no debería dar

Verificá el puerto correcto. **Moovy corre en 3002, NO en 3000** (3000 es otra app del VPS):

```powershell
ssh root@31.97.14.156 "curl -s -i http://localhost:3002/api/X | head -3"
```

Si responde 200/401 ahí pero 404 desde `https://somosmoovy.com/api/X`, es caché del browser. Limpiá cache (Ctrl+Shift+R) o probá en incógnito.

---

## Rollback

Si después del deploy detectás un problema grave:

### Listar tags y backups disponibles

```powershell
.\scripts\rollback.ps1 -ListBackups
```

Te muestra los tags `deploy-YYYYMMDD-HHMMSS` recientes y los backups SQL.

### Rollback al tag anterior + restore DB

```powershell
.\scripts\rollback.ps1
```

Sin flag, busca el tag `deploy-*` anterior al actual. Te pide confirmación + qué backup SQL usar para restaurar la DB.

### Rollback solo de código (DB intacta)

```powershell
.\scripts\rollback.ps1 -NoDB
```

Útil cuando el problema es solo de código y la DB está OK.

### Rollback a un tag específico

```powershell
.\scripts\rollback.ps1 -Tag deploy-20260428-225942
```

---

## Logs persistentes

Cada deploy y rollback genera un log en `deploys/deploy_YYYYMMDD_HHMMSS.log` o `deploys/rollback_YYYYMMDD_HHMMSS.log` con todo lo que pasó. Útil para:

- Auditar deploys pasados
- Debug de errores tarde
- Ver qué archivos cambiaron en cada deploy

La carpeta `deploys/` está en `.gitignore` — los logs son locales tuyos.

---

## Checklist mental antes de cada deploy

- [ ] `git status` limpio
- [ ] `git branch --show-current` dice `develop`
- [ ] Las ramas que vas a deployar fueron cerradas con `finish.ps1`
- [ ] Si agregaste env var nueva, está en VPS `.env`
- [ ] Si tocaste schema (`prisma/schema.prisma`), pensaste si rompe data existente
- [ ] Si tocaste código de pagos/PIN/puntos, leíste las reglas en `.claude/CLAUDE.md` antes
- [ ] **Dry-run primero** si es el primer deploy del día o si tenés dudas

---

## Referencias

- **`.claude/CLAUDE.md`** — info canónica del proyecto (stack, modelos, reglas, decisiones)
- **`.claude/CHANGELOG.md`** — histórico cronológico de ramas
- **`ISSUES.md`** — issues abiertos hoy
- **`PROJECT_STATUS.md`** — estado del proyecto en una pantalla
- **`scripts/devmain.ps1`** — el script en sí, comentado paso por paso
- **`scripts/rollback.ps1`** — script de rollback

Si algo en esta guía está desactualizado, decime con Claude y lo arreglamos.
