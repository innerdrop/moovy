# HANDOFF — Continuar testing MP en próxima conversación

**Fecha**: 2026-05-29
**Estado**: OAuth funciona ✅ — Pago en checkout MP falla con "Oh, no, algo anduvo mal" ❌
**Próximo paso**: Diagnosticar mismatch de ambiente TEST vs PROD

---

## PROMPT PARA RETOMAR EN NUEVA CONVERSACIÓN

Copiá y pegá esto en la próxima conversación:

```
Retomá el testing de MercadoPago en producción donde lo dejamos. Lee
C:\dev\moovy\HANDOFF-MP-TESTING.md para el contexto completo.

Estado: OAuth funciona (ya está cerrada la rama fix/mp-client-secret-separate).
Bloqueo: cuando el buyer intenta pagar, MP muestra "Oh, no, algo anduvo mal"
en la pantalla de checkout. El preference-id empieza con el user_id del vendor.

La consola del navegador mostró:
- payment_method_id "account_money_black" (= cuenta MP real con tier Black)
- Challenge display processing con hasChallengeUrl:false
- Carrito intentando pagar con tarjeta test 5031...0604

Mi hipótesis: el merchant fue vinculado con mi cuenta MP REAL (no con un
TEST-COMERCIO) → vendor token es APP_USR → preference en PROD → pero estoy
usando tarjeta TEST → mismatch de ambiente → MP rechaza.

Empezá pidiéndome los 4 chequeos del HANDOFF y guiame desde ahí.
```

---

## Los 4 chequeos a correr al retomar

### 1. Cerrar sesión MP en navegador
Probar en modo incógnito para garantizar que tu cuenta MP real no está logueada.

### 2. Confirmar que existen test users
```
https://www.mercadopago.com.ar/developers/panel/test-users
```
Necesitás al menos:
- 1 test user rol **Vendedor** (AR) → TEST-COMERCIO
- 1 test user rol **Comprador** (AR) → TEST-COMPRADOR

Si no existen, crearlos. Anotar email + password en .txt local.

### 3. Verificar prefijo del MP_ACCESS_TOKEN en .env
```bash
ssh root@31.97.14.156 "grep -E '^MP_ACCESS_TOKEN|^MP_PUBLIC_KEY' /var/www/moovy/.env | cut -c1-25"
```

Esperás ver:
- Si arranca con `TEST-` → modo sandbox, podés usar tarjetas test
- Si arranca con `APP_USR-` → modo producción, **necesitás tarjetas reales** (o cambiar a TEST y reiniciar PM2)

### 4. Verificar prefijo del token del merchant en DB
```bash
ssh root@31.97.14.156 "psql -U moovy -d moovy -c \"SELECT id, name, LEFT(\\\"mpAccessToken\\\", 12) as token_prefix FROM \\\"Merchant\\\" WHERE \\\"mpAccessToken\\\" IS NOT NULL;\""
```

- `TEST-` → vinculado con test user, OK para testing
- `APP_USR-` → vinculado con cuenta real, hay que desvincular y revincular con TEST-COMERCIO

---

## Tabla canónica de ambientes MP

**Regla de oro**: todos los componentes tienen que estar en el MISMO ambiente.

| Componente | TEST (sandbox) | PROD (real) |
|---|---|---|
| `MP_ACCESS_TOKEN` en `.env` | `TEST-xxx` | `APP_USR-xxx` |
| Vendor token (vinculado vía OAuth) | `TEST-xxx` | `APP_USR-xxx` |
| Cuenta del buyer al pagar | Test user "Comprador" | Cuenta MP real (DISTINTA a la del vendor) |
| Tarjeta | `5031 7557 3453 0604` titular `APRO` | Tarjeta real |

Si UNO de los 4 está en el ambiente equivocado → MP rechaza sin mensaje claro.

---

## Mapeo cuenta MP → rol Moovy

| Rol en Moovy | Cuenta MP que vincula | Cómo |
|---|---|---|
| **Comprador** (buyer) | TEST-COMPRADOR | Logueás en MP cuando llegás a la pantalla de pago |
| **Comercio** (tienda) | TEST-COMERCIO | Click "Vincular MP" en `/comercios/perfil` |
| **Seller** (marketplace) | TEST-SELLER-MKT | Click "Vincular MP" en `/vendedor/perfil` |
| **Repartidor** | NINGUNA | Drivers cobran por payout bancario (CBU/Alias), no vinculan MP en checkout |

---

## `.env` esperado para testing en producción con sandbox

```
MP_ACCESS_TOKEN=TEST-xxxxxxxx        ← Access Token de "Credenciales de prueba"
MP_PUBLIC_KEY=TEST-xxxxxxxx          ← Public Key de "Credenciales de prueba"
MP_APP_ID=3025739602928497           ← Client ID (FIJO, mismo test y prod)
MP_CLIENT_SECRET=xxxxxxxx            ← Client Secret (FIJO, mismo test y prod)
MP_WEBHOOK_SECRET=xxxxxxxx
```

---

## Flujo correcto de pago de prueba

1. **Setup vendor (una vez)**: logueado como dueño del comercio en Moovy → "Vincular MP" → MP login → ingresá email/password de **TEST-COMERCIO** → autorizar → token queda guardado.

2. **Pago**: logueás en Moovy como buyer (tu cuenta normal está OK) → pedido → "Pagar con MP" → redirige al checkout MP.

3. **CRÍTICO**: en esa pantalla de MP, antes de tipear tarjeta, login con **TEST-COMPRADOR**. NUNCA con tu cuenta MP real ni con TEST-COMERCIO (self-purchase).

4. **Tarjeta test**: `5031 7557 3453 0604` / CVV `123` / vence `11/30` / titular `APRO`.

---

## Contexto técnico que ya está resuelto (NO retocar)

- **Rama `fix/mp-client-secret-separate`** ya cerrada y deployada
- Código en `src/lib/mercadopago.ts` usa `MP_CLIENT_SECRET` (separado de `MP_ACCESS_TOKEN`)
- OAuth funciona end-to-end (probado: "FUNCIONÓ!!!!" 2026-05-29)
- `MP_APP_ID=3025739602928497` es el Client ID correcto (NO el N° de aplicación `5300721333238597`)
- URL callback en panel MP: `https://somosmoovy.com/api/mp/callback` (sin PKCE)

---

## Archivos relevantes (para grep si hace falta)

- `src/lib/mercadopago.ts` — buildPreferenceBody, createVendorPreference, exchangeOAuthCode, refreshOAuthToken
- `src/app/api/orders/route.ts` líneas ~1120-1255 — resolución de vendor token y creación de preference
- `src/app/api/mp/callback/route.ts` — handler OAuth callback
- `src/app/api/mp/connect/route.ts` — inicio del flujo OAuth

---

## Otras tareas pendientes (no del MP, para no olvidar)

Recordar revisar después del MP:

1. **CLAUDE.md manual edit** — agregar `MP_CLIENT_SECRET` a la lista de env vars (no se pudo desde sandbox por permisos)
2. **Continuar checklist QA pre-launch** en `prelaunch-checklist.html` — quedaron items abiertos
3. **POST_LAUNCH_TODO.md** en outputs/ — empresa virtual de 32 agentes, redesign programa MOOVER (retención 1% → 3-7%), 12 ítems de deuda técnica
4. **LAUNCH_DAY_CHECKLIST.md** en outputs/ — orden: cleanup → seed-biblia-launch → seed-feature-flags
