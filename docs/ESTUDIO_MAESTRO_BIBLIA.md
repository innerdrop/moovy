# Estudio Maestro — Conectar la Biblia Financiera al runtime

> Objetivo: que TODO parámetro editable de la Biblia (y de los paneles de config relacionados) afecte de verdad el comportamiento de la plataforma. Cero config fantasma, cero código muerto, cero funciones duplicadas. Pre-lanzamiento.

---

## 1. Diagnóstico raíz

El sistema tiene el **puente a medio construir**: los paneles de OPS GUARDAN la config en la DB, y existen funciones para LEERLA, pero los motores de runtime (cobro de envío, asignación, payout, puntos) **no inyectan esa config** — usan constantes hardcodeadas. El patrón se repite en casi todos los fantasmas:

- Las funciones aceptan la config como 2º argumento opcional (`calculateShippingCost(params, deliveryRates)`, `prioritizeOrders(orders, overrides)`, `calculateOrderPriority(o, overrides)`), **pero quien las llama nunca pasa ese argumento**.
- Los loaders de DB (`loadShipmentTypesConfig`, `loadVehicleSpeedsConfig`, `loadOrderPriorityConfig`, `loadShippingDefaultsConfig`) **solo se usan en el GET de su propio panel**, nunca en el runtime.

## 2. Código muerto / duplicado / conflictos (con sector responsable)

| Hallazgo | Detalle | Sector |
|---|---|---|
| **DOS modelos de precio de envío en conflicto** | `delivery.ts:calculateDeliveryCost` (fórmula maestra fuel-based, canónica de CLAUDE.md) está MUERTA. `shipping-cost-calculator.ts:calculateShippingCost` (base+perKm por categoría hardcodeada) es la que COBRA. Modelos distintos → hay que elegir UNO. | ARQUITECTURA / FINANZAS |
| **`calculateDeliveryFeeWithConfig` (ops-config.ts)** | Sólo la usa el simulador del panel. Código muerto. | ARQUITECTURA |
| **`DEFAULT_DELIVERY_RATES` hardcodeado** | Tarifas del cobro real escritas en código, no editables. | FINANZAS |
| **Tabla `DeliveryRate` semi-muerta** | Editable, pero sólo se lee para el monto OFRECIDO al driver, no para el cobro al cliente ni el payout. | LOGÍSTICA / FINANZAS |
| **`validateDeliveryFee` nunca se invoca** | Helper de validación muerto; el override es directo. | QA / ARQUITECTURA |
| **Loaders de config sin consumidor** | `loadShipmentTypesConfig`, `loadVehicleSpeedsConfig`, `loadOrderPriorityConfig`, `loadShippingDefaultsConfig`. | ARQUITECTURA |
| **`SHIPMENT_TYPES`, `VEHICLE_SPEEDS`, `order-priority` consts** | El runtime usa las consts en vez de la DB. | LOGÍSTICA |
| **Keys MoovyConfig duplicadas/muertas** | `max_delivery_distance_km` y `min_order_amount_ars` no se leen; los límites reales viven en `StoreSettings.maxDeliveryDistance` y `merchant.minOrderAmount`. | ARQUITECTURA |
| **Ventana de niveles MOOVER** | `windowDays = 90` hardcodeado en `points.ts:66`. | PRODUCTO |
| **`reviewBonus`** | Ningún endpoint de reseñas otorga puntos. | PRODUCTO |
| **`riderCommissionPercent`** | El driver lo VE pero cobra 80% fijo (`order-totals.ts:120,140`). | PAGOS / LEGAL |
| **`defaultMerchantCommission`** | Fallback 8% hardcodeado (`merchant-loyalty.ts`); el default nunca se alcanza. | FINANZAS |

## 3. Decisión de diseño clave (requiere confirmación del founder)

**Adoptar la fórmula maestra fuel-based (la de tu CLAUDE.md) como ÚNICO motor de precio de envío**, config-driven, y retirar el modelo por-categoría:

```
fee_visible = max(MIN_VEHICULO, costo_km × distancia × 2.2) × zona × clima + subtotal×0.05
costo_km = f(precio_combustible, consumo_por_km, factor_mantenimiento)   ← campos de la Biblia
vehículo = lo determina el tamaño del pedido (ya conectado en fix/asignacion-match-vehiculo)
```

Esto es lo que tus campos de la Biblia (combustible, consumo, mantenimiento, tarifa base, zona, clima, operativo) **siempre debieron alimentar**. El modelo por-categoría (`DEFAULT_DELIVERY_RATES`) se elimina.

## 4. Plan de ramas (mínimo seguro: 3)

### 🔴 Rama 1 — `fix/biblia-motor-envio-y-comisiones` (FINANZAS — la más crítica)
- Implementar la fórmula maestra como motor ÚNICO, leyendo TODO de la Biblia (`StoreSettings` + `DeliveryRate` por vehículo: costo_km/min).
- **Preview = cobro**: que `/api/delivery/calculate` y `orders/route.ts` usen el mismo motor.
- Conectar: tarifa base, combustible, consumo, mantenimiento, **envío gratis**, distancia máxima.
- Conectar **comisión repartidor** al payout real (`order-totals.ts`).
- Conectar **comisión merchant default**.
- Eliminar código muerto: `calculateShippingCost`/`DEFAULT_DELIVERY_RATES`, `calculateDeliveryFeeWithConfig`, `validateDeliveryFee`.
- Verificación: **simulación financiera** (varios escenarios) + preview=cobro=historial=MP.

### 🟠 Rama 2 — `fix/biblia-asignacion-y-logistica` (LOGÍSTICA)
- Conectar shipment-types (recargos, **equipamiento de frío**, vehículos permitidos), velocidades de vehículo, cola de prioridad, ETA, shipping-defaults.
- Hacer editable el **radio de búsqueda** y el **min order** (o consolidar con los campos reales y quitar las keys muertas).
- Conectar el **filtro de equipamiento** (bolsa térmica/frío) a la asignación.
- Verificación: tests de asignación (vehículo, equipamiento, prioridad).

### 🟡 Rama 3 — `fix/biblia-moover-efectivo-y-guardrail` (PRODUCTO + QA)
- MOOVER: conectar `reviewBonus`, ventana de niveles, umbrales de niveles.
- **Protocolo de efectivo**: conectar los límites (o, si no se implementa el flujo completo, ocultar los campos para no mentir).
- Delivery programado: conectar (o ocultar) duración de slot, anticipación, horario.
- **Guardrail anti-fantasma**: test en `validate-ops-config.ts` que falle si un campo editable del panel no es leído por el runtime. Limpieza final de cualquier const/loader muerto restante.

## 5. Criterio CEO

- **Conectar > ocultar**, pero todo lo que NO se conecte antes del launch se OCULTA (un panel con menos botones es mejor que uno que miente).
- Cada rama cierra con `tsc` limpio + su verificación (las de plata, con simulación financiera).
- El guardrail (Rama 3) es lo que garantiza que esto **no vuelva a pasar** en producción.

## 6. Por qué 3 ramas y no 1 ni 8

- **No 1 mega-rama**: mezclar el motor de envío (dinero) con asignación y puntos es imposible de testear sin riesgo. PAGOS = cero tolerancia.
- **No 8 micro-ramas**: ceremonia innecesaria; los fantasmas se agrupan naturalmente en 3 dominios cohesivos.
- 3 = el mínimo que mantiene cada dominio testeable de forma aislada.
- (Opción: si querés MÁS seguridad, la Rama 1 se puede partir en "envío" y "comisiones" → 4 ramas.)
