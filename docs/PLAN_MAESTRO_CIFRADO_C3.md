# Plan maestro — Cifrado at-rest de datos sensibles (C-3)

> Generado: 2026-06-23. Basado en relevamiento exhaustivo de TODO el repo (3 agentes read-only).
> Objetivo: cifrar en la base los datos que hoy están en texto plano (tokens de MP + CBU del repartidor)
> **sin romper ningún flujo de plata**, con cero cabos sueltos.

---

## 1. Qué falta cifrar (estado confirmado)

| Modelo | Campo | ¿Cifrado hoy? | Acción |
|---|---|---|---|
| Merchant | `mpAccessToken`, `mpRefreshToken` | ❌ texto plano | **Cifrar** |
| SellerProfile | `mpAccessToken`, `mpRefreshToken` | ❌ texto plano | **Cifrar** |
| Driver | `bankCbu`, `bankAlias` | ❌ texto plano | **Cifrar** |
| Merchant | `cuit`, `cuil`, `ownerDni`, `bankAccount` | ✅ | (ya) |
| SellerProfile | `cuit`, `bankCbu`, `bankAlias` | ✅ | (ya — patrón a copiar) |
| Driver | `cuit` | ✅ | (ya) |
| Driver | `mpAccessToken` | — | **No existe en el schema** (CLAUDE.md desactualizado). Nada que hacer. |
| Merchant/Seller | `mpEmail`, `mpUserId`, `mpLinkedAt` | ❌ | No son secretos (estado de vínculo). No se cifran. |
| User | `password` | hash bcrypt | Correcto (no es cifrado reversible). |
| StoreSettings | `bankCbu`/`bankAlias`/... | ❌ | Es la cuenta **de Moovy** (pública por diseño). No se cifra. |

---

## 2. Principio de seguridad (por qué NO se rompe nada)

`decrypt()` (en `src/lib/encryption.ts`) es **backward-compatible**: si recibe un valor sin cifrar, lo devuelve tal cual (no tira error). `encryptIfNeeded()` es **idempotente** (no re-cifra lo ya cifrado).

Consecuencia: se pueden **agregar todos los descifrados primero** — sobre los datos actuales (texto plano) no hacen nada — y luego prender el cifrado. No hay ventana donde un dato quede ilegible. Y el backfill se puede correr cuando sea, sin riesgo de doble-cifrado.

**Regla de oro del plan**: en cada rama, primero los descifrados (read-use + display), después el cifrado (write + lista). Así, si algo falla, falla "hacia plano" (legible), nunca "hacia basura".

---

## 3. Inventario completo de sitios (de los 3 relevamientos)

### 3.A — Tokens de MP (Merchant + SellerProfile)

**WRITE (cifrar antes de guardar) — 1 sitio:**
- `src/app/api/mp/callback/route.ts:49-55` — objeto `mpData` que se escribe a merchant (L64-67) y seller (L76-79). Cubre ambos.

**READ-USE CRÍTICOS (descifrar antes de usar — si faltan, se rompe la plata) — 2 archivos:**
- `src/app/api/orders/route.ts:1401-1418` (3 selects: merchant, seller, merchant-fallback) → `vendorAccessToken` para el split. **Descifrar.**
- `src/lib/mercadopago.ts:404-415` dentro de `resolveOrderVendorToken` (merchant + seller) → token para refund/reconcile. **Descifrar acá cubre los 4 callers downstream**: `order-refund.ts`, `order-payment-confirm.ts`, `cron/retry-assignments`, `merchant/orders/[id]/reject`.

**READ-DISPLAY (no exponer el token al cliente) — 3 fugas a tapar:**
- `src/app/api/seller/profile/route.ts:80-87` (PUT) — devuelve la fila descifrada SIN strippear los tokens (el GET sí los strippea). **Strippear** `mpAccessToken`/`mpRefreshToken` del response.
- `src/app/api/admin/merchants/[id]/route.ts:55,171` (GET+PATCH) — fuerzan el token al response. **Reemplazar por booleano** `mpLinked: !!token`, y ajustar el consumidor `src/app/ops/(protected)/comercios/[id]/page.tsx:71,1227` (solo usa existencia).

**CLEAR (nada que hacer — setean null):**
- `mp/disconnect/route.ts:21-22`, `admin/users/[id]/delete:149-150,194-195`, `profile/delete:118-119,162-163`.

**Sin acción:** `comercios/(protected)/configuracion/page.tsx` (descifra en server pero NO forwardea el token, solo `mpEmail/mpLinkedAt/mpUserId`). `refreshOAuthToken` (mercadopago.ts:281) **no tiene callers** hoy → cifrar `mpRefreshToken` es seguro; **dejar comentario**: si se implementa el cron de refresh, ese caller deberá descifrar el refresh token y cifrar los tokens nuevos.

### 3.B — Datos bancarios del Driver (`bankCbu`, `bankAlias`)

**RAÍZ:** `src/lib/fiscal-crypto.ts:21` — agregar `"bankCbu", "bankAlias"` a `DRIVER_ENCRYPTED_FIELDS`.

**WRITE (cifrar) — 1 sitio:**
- `src/app/api/driver/bank-account/route.ts:130-137` (PATCH) — envolver con `encryptDriverData({...})` antes del update.

**READ-USE CRÍTICO (★ el más importante — paga al repartidor):**
- `src/lib/payouts.ts:206-239` (`getPendingDriverPayouts`) — descifrar `o.driver.bankCbu`/`bankAlias` ANTES de denormalizarlos en `bankAccount` del PayoutItem (que va al CSV de transferencia). Si no, **se transfiere a un CBU ilegible.** Todo el pipeline (batches, CSV, historial, OPS, EarningsView) hereda este valor → descifrar acá los arregla a todos.

**READ-DISPLAY:**
- `src/app/api/driver/bank-account/route.ts:33-52` (GET) — `decryptDriverData(driver)` antes del response (el driver ve su propio CBU).
- `src/app/api/orders/[id]/route.ts:32,38` — `bankAlias` del driver se devuelve al **comprador** (propina por transferencia). Descifrar antes de responder. Propaga a `mis-pedidos/[orderId]` + `PostDeliveryRatingModal` (heredan).

**Sin acción:** `driver/profile` (ya whitelistea OUT bankCbu/bankAlias — C-2), register/activate driver (no escriben bank), earnings (`!!boolean`), borrados (null), `users-unified` (no selecciona bank).

### 3.C — Bugs preexistentes encontrados (arreglar de paso)

- **`src/lib/payouts.ts:161`** — lee `o.merchant.bankAccount` (que YA está cifrado) **sin descifrar** → snapshotea ciphertext en el PayoutItem del comercio. **Mismo bug-clase**: el pago al comercio hoy podría estar yendo a un CBU ilegible (o el merchant nunca cargó bankAccount en prod). Descifrar acá también.
- **`src/app/vendedor/(protected)/ganancias/page.tsx:19,172,180`** — lee el seller por Prisma directo y muestra `bankCbu`/`bankAlias` SIN `decryptSellerData` → hoy muestra ciphertext en pantalla. Agregar el descifrado.

---

## 4. Plan de ejecución — 2 ramas separadas (blast radius chico, test independiente)

> Cada rama: descifrados primero, cifrado después, backfill, verificación. `tsc` (finish.ps1) + test real.

### RAMA 1 — `fix/cifrar-datos-bancarios-driver` (riesgo bajo, copia el patrón del seller)

1. `fiscal-crypto.ts:21` → `DRIVER_ENCRYPTED_FIELDS = ["cuit", "bankCbu", "bankAlias"]`.
2. **Descifrados primero (no-op sobre lo actual):**
   - `payouts.ts` → `decryptDriverData(o.driver)` antes de armar el bank del payout (★) + descifrar `o.merchant.bankAccount` (bug preexistente).
   - `driver/bank-account` GET → `decryptDriverData`.
   - `orders/[id]` → descifrar `driver.bankAlias` (y subOrders.driver.bankAlias).
   - `vendedor/ganancias/page.tsx` → `decryptSellerData` (bug preexistente).
3. **Cifrado:** `driver/bank-account` PATCH → `encryptDriverData` antes del update.
4. **Backfill:** `scripts/backfill-encrypt-driver-bank.ts` (recorre drivers con bankCbu/bankAlias, `encryptIfNeeded`, idempotente, dry-run + `--execute`).
5. **Verificación:** script que confirma que no quedan CBU en plano + test real: un driver carga CBU → genera un PayoutBatch → el CSV muestra el CBU correcto (no ciphertext). El driver ve su CBU bien en el panel.

### RAMA 2 — `fix/cifrar-tokens-mp` (crítico — toca split + refunds)

1. `fiscal-crypto.ts:15,18` → agregar `"mpAccessToken", "mpRefreshToken"` a `MERCHANT_ENCRYPTED_FIELDS` y `SELLER_ENCRYPTED_FIELDS`.
2. **Descifrados primero (no-op sobre lo actual):**
   - `orders/route.ts:1401-1418` → descifrar los 3 `vendorAccessToken`.
   - `mercadopago.ts` `resolveOrderVendorToken:404-415` → descifrar antes de devolver (cubre los 4 callers de refund).
3. **Tapar fugas de display:**
   - `seller/profile` PUT → strippear tokens.
   - `admin/merchants/[id]` GET+PATCH → booleano `mpLinked`, ajustar `ops/comercios/[id]/page.tsx`.
4. **Cifrado:** `mp/callback` → cifrar `mpData` antes de guardar (merchant + seller). Comentario en `refreshOAuthToken` para el futuro.
5. **Backfill:** `scripts/backfill-encrypt-mp-tokens.ts` (merchants + sellers con token, `encryptIfNeeded`, idempotente, dry-run + `--execute`).
6. **Verificación:** script que confirma que no quedan tokens en plano + **test real con un comercio vinculado**: una compra con envío (el split nuevo) entra OK → confirma que el token cifrado se descifra bien para crear la preferencia. Probar también un refund.

---

## 5. Verificación exhaustiva (la garantía de "cero cabos sueltos")

Por cada rama, antes de cerrar:
1. **`tsc`** vía `finish.ps1` (el real, no el del sandbox).
2. **Script de verificación** que consulta la DB y confirma: (a) ningún registro del/los campo(s) quedó en texto plano post-backfill (`isEncrypted` true en todos), (b) un read de prueba descifra correctamente.
3. **Test funcional real** (el que toca plata):
   - Rama 1: carga de CBU + generación de PayoutBatch + CSV correcto.
   - Rama 2: compra real con comercio vinculado (split) + refund.
4. **Grep de control**: re-correr el inventario (grep de los campos) y confirmar que cada read-use tiene su descifrado y cada write su cifrado.

---

## 6. Orden recomendado

1. **Rama 1 (driver bank)** primero — es la más segura (copia un patrón probado) y arregla 2 bugs preexistentes de payouts.
2. **Rama 2 (tokens MP)** después — su test real coincide con el test del split nuevo que ya tenés pendiente. Dos pájaros de un tiro.

> Nota: ambas ramas tocan el schema sólo si decidimos cifrar también los snapshots `PayoutItem.bankAccount/cuit` (hoy denormalizados). Recomendación: **no** cambiar el shape; descifrar en la fuente (payouts.ts) deja el snapshot ya legible. Sin cambio de schema → deploy más simple. (Las listas de cifrado son código, no schema.)
