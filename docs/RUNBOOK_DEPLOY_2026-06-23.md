# Runbook de deploy — batch 2026-06-23

> Deploy del batch acumulado desde el 2026-06-18. Lo corrés vos, comando por comando. Yo no corro nada.
> **Modo SCHEMA** (la rama del split agregó la columna `StoreSettings.mpReservePercent`) → `devmain.ps1` SIN `-NoDB`.

## Qué incluye este batch
- **fix/split-mp-reserva-y-operativo** — arregla el error CPT01 (reserva de comisión MP) + columna nueva `mpReservePercent` (editable en la Biblia). **← cambio de schema**
- **fix/payout-repartidor-consistente** — el repartidor cobra exactamente lo que ve (panel == pago).
- **fix/quitar-bypass-fundador-paquetes** — mata el código mágico que daba paquetes gratis.
- **fix/driver-profile-no-filtrar-campos-internos** (C-2) — el perfil del repartidor no filtra datos internos.
- **fix/cifrar-datos-bancarios-driver** (C-3 R1) — cifra el CBU/alias del repartidor. **← requiere backfill**
- **fix/cifrar-tokens-mp** (C-3 R2) — cifra los tokens de MP. **← requiere backfill**

---

## Antes de empezar (local)
1. En **develop**, limpio y pusheado:
   ```powershell
   git checkout develop
   git status        # "nothing to commit, working tree clean"
   git push origin develop
   ```
2. **Docker Desktop corriendo** en local (devmain hace build local antes de subir; el build necesita la base, como te pasó en el finish).

> `devmain.ps1` corre tsc + `validate-ops-config.ts` + build ANTES de tocar prod. Si hay un error, aborta sin haber tocado nada. Esa es tu red de seguridad.

---

## Paso 1 — Deploy (local, PowerShell)
```powershell
.\scripts\devmain.ps1 -DryRun     # opcional: te muestra qué haría (commits, cambio de schema, modo)
.\scripts\devmain.ps1             # el real
```
- SIN flags = **modo schema seguro** (código + `prisma db push` → agrega la columna `mpReservePercent`). **NO** uses `-NoDB` (perderías la columna) ni `-CleanProd` (borra la base).
- Te muestra un resumen y pide confirmación → `s`.
- Hace todo: backup de la DB, maintenance ON, develop→main, deploy al VPS, `db push`, build, `pm2 reload`, smoke test, maintenance OFF, tag de git.
- **Esperá el `[DEPLOY OK]` antes de seguir.**

---

## Paso 2 — Post-deploy en el VPS (SSH)
```bash
ssh root@31.97.14.156
cd /var/www/moovy
```

**2.1 — Re-seed de DeliveryRate** (tarifas del envío; precaución estándar post-`db push`):
```bash
npx tsx prisma/seed-delivery.ts
```
> ⚠️ Toca tarifas (dinero). Confirmá que es el seed canónico (vs `scripts/seed-biblia-launch.ts`) ANTES. Ante la duda, frená. (Para este batch el único cambio de schema es agregar una columna con default — no debería resetear DeliveryRate, pero lo dejamos por las dudas.)

**2.2 — Backfill: cifrar el CBU/alias de repartidores ya cargados** (C-3 R1). Dry-run primero:
```bash
npx tsx scripts/backfill-encrypt-driver-bank.ts            # vista previa (no escribe)
npx tsx scripts/backfill-encrypt-driver-bank.ts --execute  # aplica
```

**2.3 — Backfill: cifrar los tokens de MP ya cargados** (C-3 R2). Dry-run primero:
```bash
npx tsx scripts/backfill-encrypt-mp-tokens.ts            # vista previa (no escribe)
npx tsx scripts/backfill-encrypt-mp-tokens.ts --execute  # aplica
```
> Los dos backfills son **idempotentes** (re-correrlos no rompe nada). Si la vista previa dice "en plano: 0", perfecto — no había datos viejos que cifrar, y el cifrado ya queda activo para los nuevos.

> **ORDEN CRÍTICO**: los backfills van DESPUÉS del deploy (el código nuevo, que sabe descifrar, ya tiene que estar vivo). Nunca antes.

Salí del VPS:
```bash
exit
```

---

## Paso 3 — Dejar la cortina puesta (local)
```powershell
.\scripts\cerrar-tienda.ps1
```
- El sitio queda privado. Vos entrás con `https://somosmoovy.com/?preview=moovy2026preview`.

---

## Paso 4 — Verificación detrás de la cortina

- **Biblia**: en `/ops/config-biblia` → sección Comisiones, debe aparecer **"Reserva comisión MP: 8%"** (columna nueva).
- **Split MP (el fix del CPT01)** — el test importante: necesitás **un comercio con MP vinculado**. Hacé una compra real con **envío** → debe **entrar sin el error "Algo salió mal"**. (Es el test del split que teníamos pendiente.)
- **Cifrado de tokens**: que esa misma compra con split funcione confirma que el token cifrado **se descifra bien** para cobrar. Si podés, probá un **reembolso** (confirma `resolveOrderVendorToken`).
- **Cifrado del CBU**: un repartidor carga su CBU → lo ve **legible** en su panel → generás un lote de pago y el CSV muestra el CBU **legible** (no ciphertext).
- **Pago al repartidor consistente**: un pedido entregado → el monto en "Mis ganancias" del repartidor == el monto del lote de pago.
- **FUNDADOR**: (opcional) intentar comprar un paquete con el código `FUNDADOR` → ahora **debe cobrar** (no dar gratis).

---

## Datos del VPS / si algo sale mal
| | |
|---|---|
| SSH | `ssh root@31.97.14.156` · App `/var/www/moovy` |
| DB | docker `moovy-db`, `moovy_db` / `postgres` / puerto `5436` |
| Backup pre-deploy | automático (devmain) en `/var/www/moovy/backups/` |
| Rollback | `.\scripts\rollback.ps1` (local) |

- **devmain aborta en pre-flight (tsc/build)** → error de código. Copiame el error, lo arreglo en una rama.
- **Smoke test falla** → `ssh root@31.97.14.156 "pm2 logs moovy --err --lines 50"` y mandame el output.
- **db push pide algo raro / data loss** → FRENÁ. El backup ya está hecho; avisame antes de aceptar.
