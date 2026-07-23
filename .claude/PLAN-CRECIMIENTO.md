# MOOVY — Plan de crecimiento (lanzamiento por etapas + catálogo por rubro)

> Documento canónico de estrategia de rollout. Decidido con el founder (sesión 2026-07-21).
> Objetivo: crecer paso a paso sin dejar nada incompleto y sin complicar el lanzamiento.
> Regla de fondo: **validar → curar → recién ahí automatizar.**

---

## 1. Las 3 etapas del rollout

### Etapa 1 — PILOTO (estamos acá)
- **Socio de prueba #1: Pixel Point** (kiosco/almacén + panchería). Hay confianza con el dueño para probar.
- Objetivo: validar el **loop completo** una sola vez — pedido → pago → asignación de repartidor → entrega (PIN) → **cobro al instante** → puntos MOOVER.
- **El sitio público está CERRADO** (candado `LAUNCH_GATE`). Lo único público es la cortina `/proximamente`.
- **Onboarding de Pixel Point = a mano, por preview.** Se entra con `?preview=PREVIEW_TOKEN` (saltea el candado). Moovy le crea/aprueba la cuenta y carga (o lo ayuda a cargar) su catálogo. Testers (founder, allegados) también entran por preview.
- **La cortina junta INTERESADOS** (lead-capture) de comercio, repartidor y cliente/moover. NO hay auto-registración pública todavía.

### Etapa 2 — INVITACIÓN por rubro
- Se suman comercios **de a poco, elegidos por Moovy**, tirando de la lista de interesados (priorizada por rubro).
- Cada comercio se onboardea con aprobación (Moovy controla el ritmo y la calidad).
- Rubros de **catálogo simple primero** (build cero): kioscos/almacenes, bebidas, farmacia, retail, rotiserías, carritos.
- El sitio sigue mayormente cerrado / soft-launch por preview según convenga.

### Etapa 3 — PÚBLICO
- Se abre el candado a los consumidores (`abrir-tienda.ps1`).
- Se **prende la auto-registración pública** de comercios y repartidores (los formularios `/comercio/registro` y `/repartidor/registro` ya están construidos y esperando).
- La oferta ya está cargada → se abre con tiendas llenas y repartidores listos, no con las góndolas vacías.

---

## 2. Qué está abierto/cerrado por etapa

| | Cortina pública | Registros (`/comercio/registro`, `/repartidor/registro`) | Paneles comercio/repartidor | Tienda del cliente |
|---|---|---|---|---|
| **1 · Piloto** | Lead-capture (interés) | Solo por preview | Solo por preview (Pixel Point) | Cerrada |
| **2 · Invitación** | Lead-capture | Invitación / preview | Invitados aprobados | Soft-launch |
| **3 · Público** | — (se abre la tienda) | Auto-registración pública ON | Abiertos con aprobación | Abierta |

- **Lead-capture (etapa 1/2):** `LaunchHub.tsx` → los mundos de comercio y repartidor terminan en `LeadForm` (POST `/api/prelaunch/signup`, roles `COMERCIO` / `DRIVER` / `CLIENTE`). Campos nuevos en `PreLaunchLead`: `rubro`, `businessName` (para priorizar por rubro).
- **Candado:** `proxy.ts` — solo `/proximamente` es público; todo lo demás requiere cookie de preview. Deployar NO expone el sitio.
- **Auto-registración (etapa 3):** ya construida (página única comercio/repartidor). Se "prende" quitando el gateo cuando toque.

---

## 3. Roadmap de catálogo (por qué el loader actual alcanza para arrancar)

El loader de productos de hoy modela un producto **plano** (nombre, precio, foto, categoría, tamaño). Alcanza para todo rubro de **catálogo simple** y para el piloto:

- **Kiosco/almacén** → productos planos. ✅ ya funciona.
- **Panchería (Pixel Point)** → cada variante como producto (Pancho simple / completo / especial, combo con papas). La personalización ("sin mostaza, extra mayo") va por el campo **`customerNotes`** (aclaraciones del pedido, ya existe end-to-end). **Cero build para el piloto.**

### Fases del catálogo

- **Fase 0 (piloto):** loader actual, tal cual. Validar el loop.
- **Fase 1 (invitación):** rubros de catálogo simple. Build cero.
- **Fase 2 (primer rubro de comida "de verdad"):** se construye la **capa de opciones de personalización** (ver abajo). Desbloquea heladería, pizzería, hamburguesería, cafetería, restó.
- **Fase 3 (si hay demanda):** combos, media pizza, disponibilidad por horario del producto, stock por variante.

**Principio:** se hace coincidir la complejidad del rubro con lo que el catálogo ya soporta. Nunca se traba el lanzamiento esperando una feature.

---

## 4. Feature Fase 2 — "Opciones de personalización por producto" (idea del founder)

> Anotada para construir DESPUÉS del lanzamiento del piloto. NO se construye ahora.

**Concepto (founder):** en el mismo loader, un checkbox "habilitar personalización" en el producto. El comercio escribe a mano las opciones. Ej: producto "PANCHO PERSONALIZADO" con opciones que el cliente elige.

**Cómo modelarlo bien (una sola vez, que escale a todos los rubros de comida):** guardarlo como un **grupo de opciones** (modifier group), aunque la UI muestre un bloque simple. Es el modelo estándar (PedidosYa, Uber, Toast).

Estructura de datos (aditiva, no rompe pedidos cerrados):
- **OptionGroup** (colgado del producto): `label` (ej. "Elegí tus aderezos"), `required` (bool), `minSelect`, `maxSelect`, `order`.
  - `required` + `minSelect=maxSelect=1` → elección obligatoria de una.
  - `maxSelect>1` → multi-selección.
- **Option** (dentro del grupo): `label` (ej. "Mayonesa"), `priceDelta` (0 o +$X), `available` (bool).
- Un producto tiene **0..N grupos** (aunque en la UI v1 se muestre uno).

Cobertura con un solo feature:
- Panchería → "Aderezos" (opcional, varias, gratis).
- Heladería → "Sabores" (obligatorio, elegí N).
- Pizzería → "Tamaño" (obligatorio, uno) + "Agregados" (opcional, varias, con precio).
- Restó/hamburguesería → "Punto de cocción" (obligatorio, uno) + "Extras" (opcional, varias).

**Regla de dinero:** el precio final = precio base + suma de `priceDelta` de las opciones elegidas. Server-side autoritativo (nunca confiar en el precio del cliente). Snapshot inmutable en el ítem del pedido.

---

## 5. Secuencia de rubros sugerida

1. **Piloto:** Pixel Point (kiosco + panchería).
2. **Ola 1 (catálogo simple, build cero):** kioscos/almacenes, bebidas/vinoteca, farmacia, retail, rotiserías, carritos.
3. **Ola 2 (con la capa de opciones ya construida):** heladería, pizzería, hamburguesería, cafetería/panadería, sushi, restó.
4. **Ola 3 (refinamientos):** combos, media pizza, horarios por producto, stock por variante.

> La lista de interesados (`PreLaunchLead.rubro`) es la que dice **qué rubro conviene sumar primero** según demanda real.
