# Auditoría de seguridad pre-launch — Moovy

> Corrida: 2026-06-18 · Modo **read-only** (no se tocó código). Prompt 7.C.
> 5 áreas auditadas en paralelo: IDOR/autorización · autenticación · inputs/inyección · datos AAIP · pagos MP + irreversibles.
> Cada hallazgo serio entra al ciclo normal (rama por fix con `start.ps1` → `finish.ps1`). NADA se arregló todavía.

---

## Veredicto general

**La base está sólida.** El core de pagos (webhook MP) está muy bien: valida firma HMAC timing-safe, idempotencia determinística, monto vs total con tolerancia $1, stock-restore y refund en reject. Los patrones de autorización a nivel recurso (ownership contra DB) están bien aplicados en casi todos los endpoints de dinero, pedidos y perfiles. El cifrado AES-256-GCM y el scrubbing de Sentry existen y funcionan. **No hay agujeros de doble cobro ni IDOR de mutación financiera.**

Pero hay **un patrón crítico sistémico** y **fugas de tokens/PII** que conviene cerrar antes de abrir la cortina. Lo más importante:

1. **Toda la autorización de ADMIN se hace contra el JWT (cache), no contra la DB** — contradice tu propia regla #28. Un admin degradado sigue operando hasta 7 días.
2. **El token OAuth de MercadoPago del repartidor se guarda en texto plano y se devuelve al browser** — y los CBU de drivers también quedan sin cifrar.
3. **Un comercio autenticado puede comprar paquetes gratis** con el código mágico `FUNDADOR` hardcodeado.

---

## 🔴 CRÍTICOS (recomiendo cerrarlos antes del launch)

### C-1 — Autorización de ADMIN por JWT cache, no DB (sistémico)
**Dónde**: `src/app/ops/(protected)/layout.tsx:11`, `src/proxy.ts:231`, y ~75 endpoints `/api/admin/*` + `/api/ops/*` (ej. `ops/refund/route.ts:23`, `admin/broadcast/route.ts:14`, `admin/payouts/*`).
**Qué pasa**: todos autorizan con `hasAnyRole(session, ["ADMIN"])` / `session.user.role === "ADMIN"`, leyendo el rol del **JWT de 7 días**. El helper correcto DB-based (`requireAdminAccess()` en `src/lib/roles.ts:629`) **ya existe pero no se usa en ningún lado**.
**Escenario**: degradás a un admin (`UPDATE User SET role='USER'`). Su JWT sigue diciendo `role:"ADMIN"`. Durante hasta 7 días entra a `/ops`, **procesa refunds**, dispara broadcasts masivos, marca payouts y borra usuarios. No hay nada que invalide la sesión al degradar.
**Fix sugerido**: helper `requireApiAdmin()` DB-based (espejo de `requireMerchantApi`/`requireDriverApi`) + cambiar el layout `/ops` a `requireAdminAccess()` + mecanismo de invalidación al degradar (bump de `tokenVersion` por usuario, o `expired`). El proxy queda como filtro barato; el layout + APIs consultan DB.
**Esfuerzo**: medio (helper + ~75 callers, mecánico). **Compounding**: esto agrava todos los hallazgos "admin-gated" de inputs (abajo), porque el gating es más débil de lo que parece.

### C-2 — Token OAuth de MercadoPago del driver expuesto al cliente
**Dónde**: `src/app/api/driver/profile/route.ts:104-107`.
**Qué pasa**: el GET hace `return NextResponse.json({ ...decryptedDriver })` con la fila **completa** del Driver → arrastra `mpAccessToken`, `mpRefreshToken`, `bankCbu`, `bankAlias`, `fraudScore`.
**Escenario**: el repartidor (o un XSS en el portal driver) recibe en el JSON un **access token OAuth de MP** que permite operar contra su cuenta de MercadoPago. Token de pago en el browser.
**Fix**: respuesta curada con whitelist explícita (como ya hace `merchant/me/route.ts:18-23`). Nunca devolver `mp*Token`.
**Esfuerzo**: bajo.

### C-3 — Tokens MP y CBU de driver sin cifrar at-rest
**Dónde**: `src/lib/fiscal-crypto.ts:20-21` (`DRIVER_ENCRYPTED_FIELDS = ["cuit"]` — falta `bankCbu`/`bankAlias`); `mpAccessToken`/`mpRefreshToken` de Driver/Merchant/SellerProfile escritos en plaintext en `src/app/api/mp/callback/route.ts:49-67` y `src/app/api/driver/bank-account/route.ts:130-137`.
**Qué pasa**: tu regla AAIP dice "CUIT/CBU/DNI/MP tokens cifrados". Hoy el CBU del repartidor y **todos** los tokens OAuth de MP se guardan en texto plano.
**Escenario**: si se filtra la DB (dump, backup robado, SQLi futura), quedan expuestos CBU de repartidores y tokens MP de todos los actores → fraude financiero directo.
**Fix**: sumar `bankCbu`/`bankAlias` a `DRIVER_ENCRYPTED_FIELDS`; cifrar tokens MP antes de persistir (callback + bank-account PATCH); **migración de backfill** para registros existentes (todo en la misma rama para no dejar estado mixto). Descifrar en los GET correspondientes.
**Esfuerzo**: medio (incluye backfill).

### C-4 — Bypass de pago "FUNDADOR" en compra de paquetes
**Dónde**: `src/app/api/merchant/packages/purchase/route.ts:116`.
**Qué pasa**: `promoCode === "FUNDADOR"` (string hardcodeado) crea `PackagePurchase{ amount:0, paymentStatus:"approved" }` + auto-importa todo el catálogo de la categoría, sin validar elegibilidad ni tabla de redención.
**Escenario**: cualquier comercio autenticado hace `POST /api/merchant/packages/purchase` con `{ promoCode:"FUNDADOR" }` → paquete pago **gratis**, marcado como pagado. Pérdida de revenue sin rastro.
**Fix**: validar `promoCode` contra una tabla de promos redimibles scoped al merchant (uso único + expiry). Eliminar el string hardcodeado.
**Esfuerzo**: medio.

---

## 🟡 IMPORTANTES (cerrar pronto; algunos pueden ir post-launch)

| ID | Dónde | Qué pasa | Fix | Esf. |
|----|-------|----------|-----|------|
| I-1 | `api/orders/[id]/tracking/route.ts:6-63` | GET **sin auth** por `orderId` enumerable expone dirección + lat/lng + **nombre y teléfono del driver**. Des-anonimizante en ciudad de 80k. | Token de tracking opaco (no el orderId) + no exponer teléfono del driver, o requerir sesión del buyer. | M |
| I-2 | `api/driver/[driverId]/location/route.ts:8-44` | GET **sin auth** devuelve ubicación en vivo de cualquier driver. | Requerir sesión del buyer de un pedido activo asignado a ese driver (o admin). | M |
| I-3 | `webhooks/mercadopago/route.ts:307-358` | El webhook de **compra de paquetes** (`pkg_`) NO valida `transaction_amount` vs `PackagePurchase.amount` (el path de orders sí lo hace). | Replicar el check de tolerancia $1 antes de aprobar + importar. | Bajo |
| I-4 | `lib/auth.ts:36-37` | Rate limit de login es **por email**, no por IP. | Credential stuffing distribuido: 1 password contra 10.000 emails, cada uno cuenta 1 intento. Agregar contador por IP. | Bajo-M |
| I-5 | `api/moovyx/register/route.ts` | **Sin auth, sin rate limit, sin Zod**; `name`/`email` interpolados crudos en HTML de emails y `email` usado como `to:`. | Zod + rate limit + escape. Spam de emails desde el dominio. | S |
| I-6 | `api/seller/listings/[id]/route.ts` PUT (l.92) | PUT toma `price`/`stock` crudos sin validar (el POST sí valida `price>0`). | Reusar el schema Zod del POST. Precio negativo vendible. | S |
| I-7 | `api/seller/profile/route.ts:86` (PUT) y `api/admin/merchants/[id]/route.ts:55,171` | Devuelven `mpAccessToken`/`mpRefreshToken` al cliente (el GET del seller sí los strippea; el PUT no). | Strip de tokens MP en el response. | Bajo |
| I-8 | `lib/auth.ts:482-489` | Secret de dev hardcodeado en el repo (en prod exige env, OK). | Riesgo si un entorno no-prod expuesto no setea el secret → forja de JWT. Nunca usar literal. | Bajo |
| I-9 | `api/admin/slides/upload` + `promo/upload` | Validan solo MIME del cliente (spoofeable), sin magic bytes. | Replicar `detectFileType` de `/api/upload`. Stored XSS vía SVG/HTML. | S |
| I-10 | rating endpoints (`orders/[id]/rate*`) | `rating` sin `int` (acepta float). | `z.number().int().min(1).max(5)`. Contamina promedios. | S |
| I-11 | `api/listings/route.ts:9` (público) | `limit`/`offset` sin clamp → `?limit=999999`. | `Math.min(limit, 100)`. DoS/memoria. | S |
| I-12 | `webhooks/mercadopago/route.ts:170-177` | Early-return de monto inválido no marca `processed` → loop de reintentos MP. | Marcar `processed`/flag antes del return. | Bajo |

**Set admin-gated de validación de inputs** (defensa en profundidad — agrava con C-1): `ops/config/global` (key arbitraria a MoovyConfig), `admin/users/[id]/points` (amount sin signo/int), `ops/merchant-loyalty/tiers` (commissionRate sin rango), `driver/profile` (vehicleType sin whitelist → rompe pricing), `ops/config/rates` (Number() sin NaN/signo), `ops/coupons`, `admin/points-config`, mass-assignment en PATCH de `admin/slides` y `admin/categories`. **Fix común**: Zod con enums/rangos, replicando los patrones que los endpoints hermanos ya usan bien.

---

## 🟢 HARDENING (post-launch)

- `requireSellerApi()` DB-based para consistencia con merchant/driver (`seller/orders/[id]/confirm:35` usa `hasAnyRole` JWT — falla cerrado, no es bug de seguridad).
- Refund manual de OPS (`ops/refund`) exige `reason ≥ 5` pero **no** confirmación textual literal como hard-delete/mark-paid (regla #26).
- State OAuth de MP truncado a 64 bits, sin nonce/expiración (`mercadopago.ts:163-194`).
- `auth.ts:173` loguea el email en `console.log` (Sentry sí lo scrubbea; stdout no).
- `admin/support/operators:112` escribe a la tabla legacy `UserRole` (inerte, pero drift — viola "nunca escribir a UserRole").

---

## Lo que está BIEN (verificación positiva)

- **Webhook MP principal**: firma HMAC timing-safe (rechaza si falta secret/firma), idempotencia determinística (`xRequestId || payment-${dataId}`, no UUID), monto vs total tolerancia $1, stock-restore + refund en reject, late-payment post-cancelación con refund automático. Replicado en el cron de reconciliación.
- **Split payments**: `marketplace_fee` 100% server-side desde el snapshot inmutable, con `Math.round` y clamp `[0, total-1]` (nunca negativo ni ≥ total). Refund con el token del vendedor correcto.
- **Puntos**: earn solo post-DELIVERED idempotente, burn cap 20%/min 500 recalculado server-side, tx Serializable con retry P2034, balance nunca negativo, `reverseOrderPoints` idempotente.
- **IDOR**: ~35 endpoints de dinero/pedidos/perfiles/listings/chats verifican ownership contra DB. Sin IDOR de mutación.
- **Acciones irreversibles**: hard-delete (`"ELIMINAR DEFINITIVAMENTE"`) y mark-paid payouts (`"CONFIRMAR PAGO"`) con confirmación literal + tx Serializable + audit log antes del side effect.
- **Reset password**: token hasheado SHA-256 en DB, plaintext solo por email, comparación `timingSafeEqual`, expiry 1h, sin enumeración.
- **SQL**: los 17 `$queryRaw`/`$executeRaw` son tagged templates parametrizados (incluido PostGIS). Cero `Unsafe`. Cero concatenación.
- **XSS**: los 4 `dangerouslySetInnerHTML` son seguros (JSON-LD estático o DOMPurify con allowlist).
- **Sentry**: `scrubSentryEvent` aplicado en los 3 configs, redacta email/CBU/CUIT/DNI/tokens MP/JWT/PIN/headers.
- **Cifrado**: AES-256-GCM con IV random, falla cerrado en prod. CUIT cifrado en los 3 actores. `merchant/me` curado.
- **Uploads** `/api/upload` y `/api/upload/registration`: magic bytes + 10MB + allowlist + anti-path-traversal.
- **CSRF**: el proxy valida origin/referer en métodos mutantes. Crons con `CRON_SECRET` timing-safe. Debug endpoints devuelven 404.

---

## Orden de ramas recomendado (de a una, con tu OK)

1. **C-2** (whitelist en `driver/profile` GET) — fix chico, corta la fuga de token MP al browser **ya**.
2. **C-1** (auth admin DB-based + invalidación de sesión) — el de mayor impacto; el helper ya existe.
3. **C-4** (matar `FUNDADOR`) — chico, corta pérdida de revenue.
4. **C-3** (cifrar tokens MP + CBU driver + backfill) — medio, va junto para no dejar estado mixto.
5. **I-1 / I-2** (tracking + location sin auth) — antes de abrir la cortina, por el contexto de ciudad chica.
6. Resto de 🟡 (validación de inputs, rate limit por IP, webhook paquetes) — pueden entrar en batch o post-launch según tu llamado.
7. 🟢 — post-launch.
