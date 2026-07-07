# Auditoría integral — Panel del Comercio
Fecha: 2026-07-07 · Método: barrido exhaustivo de pantallas + APIs + cruces de datos (2 agentes + verificación manual de críticos)

> Estado: hallazgos confirmados con archivo:línea. Plan de fixes: ramas A (dinero), B (auth), C (pulido) + decisión founder (widget lealtad).

---

## 🔴 CRÍTICOS — Dinero mostrado falso (rama A: `fix/dashboard-dinero-real`)

| # | Hallazgo | Dónde | Detalle |
|---|----------|-------|---------|
| A1 | **"Ingresos Hoy/Semana" incluyen el ENVÍO** | `api/merchant/stats/route.ts` (aggregate `_sum: total`) | El KPI principal del dashboard suma `order.total`, que incluye el delivery fee (plata del repartidor/Moovy). Debe sumar el subtotal de productos (o mejor: `merchantPayout` del snapshot). Un comercio que compare contra su caja ve números inflados el día 1. |
| A2 | **"Pedidos Hoy (completados)" cuenta TODO** | `api/merchant/stats/route.ts` (count sin filtro de status) | Cuenta pendientes y cancelados. O se filtra por DELIVERED o se cambia el label a "Pedidos de hoy". |
| A3 | **"Pedidos Recientes" muestra total con envío + estados en inglés** | `comercios/(protected)/dashboard/page.tsx` | Muestra `order.total` (inconsistente con /comercios/pedidos que ya muestra "Tu venta") y el status crudo ("PENDING", "PREPARING") sin traducir. |
| A4 | **"Ventas totales" de Pagos suma `total`** | `api/merchant/earnings/route.ts` + `ingresos/page.tsx` | Mismo pecado que A1 en la pantalla de ganancias. Además cada fila muestra "de $X" con el total del pedido. |
| A5 | **% de comisión mostrado = valor VIVO, no el cobrado** | `ingresos/page.tsx` (banner de comisión) | Muestra la comisión actual del merchant; los pedidos históricos se liquidaron con `merchantCommissionRate` del snapshot. En mes 1 gratis o cambio de tier, el % del banner no coincide con los montos listados. |

## 🔴 CRÍTICOS — Auth patrón prohibido (rama B: `fix/comercios-actions-db-auth`)

| # | Hallazgo | Dónde |
|---|----------|-------|
| B1 | `importCatalogProducts` confía en `session.user.merchantId` (JWT crudo, sin lookup DB) | `comercios/actions.ts:126` |
| B2 | 7 server actions con `hasAnyRole(JWT)`: createProduct, updateProduct, deleteProduct, toggleProductActive, **updateMerchant**, updateMerchantSchedule, toggleMerchantOpen — reintroducen el bug del 403 post-aprobación (JWT stale 7 días) | `actions.ts:237,334,442,477,533,704,741` |
| B3 | `suggest-weight` con `hasAnyRole(JWT)` | `api/comercios/products/suggest-weight/route.ts:57` |
| B4 | 4 endpoints `comercios/*` con auth artesanal (`auth()` + `findFirst(ownerId)`) en vez del helper canónico — funcionan, pero duplican lógica | `adquisiciones:7`, `mis-paquetes:9`, `mis-paquetes/[id]/productos:12`, `soporte/notificaciones:7` |

## 🟡 MEDIANOS (rama C: `chore/panel-comercio-pulido`)

| # | Hallazgo | Dónde |
|---|----------|-------|
| C1 | Pantalla `desde-paquetes` NO respeta el flag `merchant.paquetes` (OFF) + link "Mis Paquetes" siempre visible en el menú | `comercios/(protected)/desde-paquetes/` + menú |
| C2 | Endpoint MUERTO `api/merchant/import` (0 referencias; además usa `paymentStatus:"approved"`) | borrar |
| C3 | Endpoint MUERTO `api/comercios/adquisiciones` (0 referencias) | borrar |
| C4 | Reseñas dispara la query PESADA de earnings solo para extraer el merchantId — debe usar `/api/merchant/me` | `resenas/page.tsx` |
| C5 | Paquetes: precio fallback **$500 inventado** si falta pricing en DB + errores de compra tragados sin toast | `adquirir-paquetes/page.tsx` |
| C6 | Errores de red silenciosos (sin toast/estado de error): pedidos (polling), soporte, pagos | varias |
| C7 | `window.confirm()` nativos (regla #24: modal Moovy) en eliminar producto y otros | `productos/page.tsx` + |
| C8 | Acentos/typos user-facing ("configuracion", "Todavia") | varias |
| C9 | Montos sumados con `reduce` de floats sin round2 (drift de centavos en display) | `earnings:60`, `packages/history:26` |

## ⚪ MENORES / ANOTADOS (post-launch u observación)

- `merchant/tier` es público y expone `commissionRate` (dato comercial) — evaluar.
- `PackagePurchase` usa vocabulario MP ("approved"/"pending") — consistente internamente; documentar que la regla "PAID" aplica a Order, no acá.
- `mis-paquetes/[id]/productos` expone catálogo maestro de paquetes no comprados (sin fuga cross-merchant).
- KPIDashboard tiene skeleton pero sin estado de error diferenciado.

## ✅ SÓLIDO (verificado OK)

- IDOR bien cubierto en todos los `orders/[id]/*` y `ad-placements/[id]` (ownership check).
- `merchant/me` con respuesta curada (regla AAIP #23); `update-docs` cifra CUIT/CBU; PINs sanitizados en orders.
- Estado pagado "PAID" correcto en stats y reject (fix de ayer aplicado).
- Zod en actions y endpoints principales.
- Onboarding checklist, horarios con timezone Ushuaia, flujo de confirmación de pedidos: bien atados.

## DECISIÓN FOUNDER PENDIENTE

- **`MerchantLoyaltyWidget` (tiers BRONCE→DIAMANTE) es código muerto completo** — existe el componente y el endpoint `/api/merchant/loyalty`, nadie lo renderiza. Opciones: (a) cablearlo al dashboard — el comercio VE su tier y cuánto le falta para pagar menos comisión (incentivo alineado al negocio); (b) borrarlo; (c) post-launch.
