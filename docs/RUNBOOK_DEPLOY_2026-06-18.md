# Runbook de deploy — batch 2026-06-18

> Deploy del batch acumulado (campana OPS + Puntos + las ~5 ramas previas de la sesión + Biblia previas).
> Ejecutás vos, comando por comando. Yo no corro nada de esto.
> **Modo SCHEMA** (hay ramas que tocaron `prisma/schema.prisma`) → `devmain.ps1` SIN `-NoDB`.

---

## Antes de empezar (chequeo rápido, local)

`devmain.ps1` ya valida esto solo y aborta si algo falla, pero para no perder tiempo:

1. Estás en **develop**, sin cambios sin commitear, y develop pusheado a origin.
   ```powershell
   git checkout develop
   git status        # debe decir "nothing to commit, working tree clean"
   git push origin develop
   ```
2. Docker corriendo en local (devmain hace build local antes de subir nada).

> **Importante**: `devmain.ps1` corre tsc + `validate-ops-config.ts` + `npm run build` ANTES de tocar prod. Si la campana o Puntos tuvieran un error de tipos, lo caza acá y aborta sin haber tocado nada. Esa es tu red de seguridad (yo no pude correr tsc desde mi entorno).

---

## Paso 1 — Deploy (local, PowerShell)

```powershell
.\scripts\devmain.ps1
```

- SIN flags = **modo schema seguro** (código + `prisma db push`). NO uses `-NoDB`.
- Te va a mostrar un resumen (commits a deployar, si cambió el schema, etc.) y pedir confirmación → `s`.
- Hace todo solo: backup de la DB de prod, maintenance ON, merge develop→main, deploy en el VPS, `prisma db push`, build limpio, `pm2 reload`, smoke test (`/api/health`), maintenance OFF, tag de git, y te devuelve a develop.
- Si algo falla, te lo dice y podés hacer `.\scripts\rollback.ps1`.

**Esperá a que diga `[DEPLOY OK]` antes de seguir.**

---

## Paso 2 — Scripts post-deploy (en el VPS, vía SSH)

Estos NO los corre devmain. Entrás al VPS y los corrés ahí (usan la DB de prod automáticamente porque leen el `.env` del VPS). Todos son **idempotentes** (podés correrlos de nuevo sin romper nada).

```bash
ssh root@31.97.14.156
cd /var/www/moovy
```

**2.1 — Re-seed de DeliveryRate** (tarifas del motor de envío; `db push` puede haberlas reseteado):
```bash
npx tsx prisma/seed-delivery.ts
```
> ⚠️ Esto toca tarifas (dinero). `prisma/seed-delivery.ts` hace upsert de `DeliveryRate` + `PackageCategory` + `MoovyConfig`. Si tus valores canónicos de lanzamiento viven en `scripts/seed-biblia-launch.ts`, confirmá cuál es el bueno ANTES de correr y usá ese. Ante la duda, frená y avisame.

**2.2 — Crear los flags de documentos del comercio** (los 5 `merchant.doc.*`, quedan en ON):
```bash
npx tsx scripts/seed-feature-flags.ts
```

**2.3 — Borrar el flag fantasma de efectivo** (`buyer.cash-payment`) — pide confirmación `SI LIMPIAR`:
```bash
npx tsx scripts/cleanup-deprecated-feature-flags.ts --execute
```

**2.4 — Migrar pedidos viejos COMPLETED → DELIVERED** — pide confirmación `SI MIGRAR`:
```bash
npx tsx scripts/fix-orders-completed-to-delivered.ts --execute
```

Salí del VPS:
```bash
exit
```

---

## Paso 3 — Dejar la cortina puesta (local, PowerShell)

El sitio queda privado (fail-closed). Vos seguís entrando con tu link de preview.

```powershell
.\scripts\cerrar-tienda.ps1
```
- Setea `PREVIEW_TOKEN` + `LAUNCH_GATE=closed` y recarga la app.
- Público ve "Próximamente". Vos entrás con: `https://somosmoovy.com/?preview=moovy2026preview`

---

## Paso 4 — Verificación rápida en prod (detrás de la cortina)

Entrá con el link de preview y chequeá lo nuevo:

- **Campana OPS**: entrá a `/ops`, mirá la campana arriba (badge + dropdown + links). En prod opcional: `ssh root@31.97.14.156 "cd /var/www/moovy && npx tsx scripts/verify-ops-notifications.ts"` para ver los conteos.
- **Puntos**: logueado, que aparezca el chip de saldo en el header y lleve a `/puntos`; que el wording esté estilo Amex.
- **Logo del comercio**: que TEST/MOOVY ahora muestren logo si lo cargaste (o cargalo y verificá que persiste).
- **Pagos** (MP en credenciales de prod): si vas a probar un pago real, hacelo con cuidado.

---

## Datos del VPS (referencia)

| | |
|---|---|
| SSH | `ssh root@31.97.14.156` |
| App | `/var/www/moovy` |
| DB | docker `moovy-db`, `moovy_db` / user `postgres` / puerto `5436` |
| Backup pre-deploy | automático en `/var/www/moovy/backups/` (devmain) |
| Rollback | `.\scripts\rollback.ps1` (local) |
| Logs del deploy | `deploys/deploy_YYYYMMDD_HHMMSS.log` (local) |

---

## Si algo sale mal

- **devmain aborta en pre-flight (tsc/build)**: hay un error de código. Copiame el error y lo arreglo en una rama.
- **Smoke test falla (`/api/health`)**: la app no levantó bien. `ssh root@31.97.14.156 "pm2 logs moovy --err --lines 50"` y mandame el output.
- **db push pide algo raro / data loss inesperado**: FRENÁ. El backup ya está hecho; avisame antes de aceptar.
