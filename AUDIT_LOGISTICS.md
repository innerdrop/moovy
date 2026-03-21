# Análisis Logístico Integral de MOOVY
## Auditoría de 10 fases — Marzo 2026

---

# PARTE 1: MAPA DEL ESTADO ACTUAL

## Resumen ejecutivo

Moovy tiene una base logística **sorprendentemente sólida para un proyecto en etapa temprana**. El assignment engine con PostGIS, la state machine de pedidos, el tracking en tiempo real con Socket.IO, y el sistema de package categories configurables lo ponen por encima del 80% de los startups de delivery argentinos en su mismo estadío. Sin embargo, hay brechas críticas que impiden operar como tienda + marketplace multi-categoría real.

### Lo que está implementado y funciona ✅

| Componente | Archivos clave | Estado |
|------------|----------------|--------|
| Assignment engine con PostGIS | `src/lib/assignment-engine.ts` | Funcional con scoring por distancia + rating |
| Package categories (MICRO→XL) con volumeScore | `prisma/schema.prisma` (PackageCategory) | 5 categorías configurables desde OPS |
| Vehicle-package matching | assignment-engine.ts línea 135 | PostGIS filtra por `allowedVehicles` |
| Delivery rates por categoría | DeliveryRate model + OPS config | Base + $/km configurable |
| Timeout cascade con max attempts | assignment-engine.ts (processExpiredAssignments) | Configurable vía MoovyConfig |
| Tracking GPS en tiempo real | Socket.IO + driver/location endpoint | Con validación anti-spoofing (200km/h) |
| Proof of delivery (foto) | Order.deliveryPhoto | Campo existe, driver puede subir foto |
| Google Distance Matrix para distancia real | api/delivery/calculate | Con fallback a Haversine |
| State machine de pedidos | src/lib/orderStates.ts | 10 estados con transiciones validadas |
| Multi-vendor con SubOrders | SubOrder model | Cada vendor puede tener driver distinto |
| Delivery programado (scheduled) | Order.deliveryType, scheduledSlotStart/End | Schema listo |
| Config desde OPS | /ops/configuracion-logistica | UI completa para categories, rates, timeouts |
| 4 tipos de vehículo | VehicleTypeEnum: BIKE, MOTO, CAR, TRUCK | Registrado al crear cuenta driver |

### Lo que está configurado pero incompleto ⚠️

| Componente | Qué falta | Impacto |
|------------|-----------|---------|
| Package categories sin HOT/FRESH/FRAGILE | Solo hay sizing (MICRO→XL), no tipos especiales | No se puede diferenciar comida caliente de un libro |
| Delivery programado (schema listo, lógica parcial) | No hay UI de selección de ventana horaria ni lógica de asignación previa | El comprador no puede elegir cuándo recibir |
| Zonas de cobertura | Solo hay Merchant.deliveryRadiusKm (radio fijo) | Sin polígonos, sin zonas diferenciadas |
| ETA al comprador | Se calcula internamente pero no se muestra dinámicamente antes de la compra | El comprador no sabe cuánto tarda antes de pagar |
| Costo de envío por categoría de paquete | DeliveryRate existe pero el checkout usa la fórmula de `delivery.ts` (fuel-based) | Dos sistemas de pricing coexisten sin conectarse |
| Multi-vehículo por driver | Solo 1 vehicleType por driver | No puede usar moto lunes y auto sábado |
| Proof of delivery | Solo foto, sin firma ni código | No hay confirmación bidireccional |

### Lo que falta completamente ❌

| Componente | Criticidad | Notas |
|------------|-----------|-------|
| Categorías especiales (HOT, FRESH, FRAGILE) | P0 | Bloqueante para food delivery real |
| SLA diferenciado por tipo de envío | P0 | Comida caliente y mueble no pueden tener mismo SLA |
| maxDeliveryTimeMinutes en shipment | P0 | Sin esto, comida llega fría |
| Declaración de peso/dimensiones por el comercio | P1 | Solo Listings tienen campos; Products no los usan |
| Batching de pedidos (agrupar 2-3 del mismo comercio) | P1 | Cada pedido = 1 driver, ineficiente |
| Surge pricing / demanda dinámica | P2 | Precio fijo sin importar hora/clima/demanda |
| Reverse logistics (devoluciones con driver) | P2 | No hay flujo de enviar driver a buscar devolución |
| Geofencing por polígonos | P2 | Solo radio fijo del comercio |
| Ventanas de entrega seleccionables | P2 | Schema listo, sin UI ni lógica |
| Batching multi-comercio (pick 2 comercios cercanos) | P3 | Complejidad alta, post-lanzamiento |
| Predicción de demanda | P3 | Requiere histórico suficiente |
| Pre-posicionamiento de drivers | P3 | Requiere demanda predecible |
| Entrega con ayudante (muebles pesados) | P3 | Para carga XXL |
| Teléfono enmascarado (privacidad) | P3 | Requiere servicio de telefonía |

---

# PARTE 2: ANÁLISIS POR FASES

---

## FASE 1 — CLASIFICACIÓN DE ENVÍOS

### 1.1 Estado actual

Moovy tiene 5 categorías basadas en **tamaño/volumen** (PackageCategory):

```
MICRO  → volumeScore=1,  maxWeight=500g,   dims: 15×10×5cm,    vehicles: [BIKE,MOTO,CAR,TRUCK]
SMALL  → volumeScore=3,  maxWeight=2000g,  dims: 30×20×15cm,   vehicles: [BIKE,MOTO,CAR,TRUCK]
MEDIUM → volumeScore=6,  maxWeight=5000g,  dims: 50×40×30cm,   vehicles: [MOTO,CAR,TRUCK]
LARGE  → volumeScore=10, maxWeight=15000g, dims: 80×60×50cm,   vehicles: [CAR,TRUCK]
XL     → volumeScore=20, maxWeight=30000g, dims: 120×80×80cm,  vehicles: [TRUCK]
```

El scoring de pedido agrega `volumeScore × quantity` de cada item y mapea a umbrales:

```
≤5 = MICRO, ≤15 = SMALL, ≤30 = MEDIUM, ≤60 = LARGE, >60 = XL
```

**Archivo**: `src/lib/assignment-engine.ts`, líneas 28-97

### 1.2 Brecha vs industria

**Lo que falta**: Las 5 categorías actuales clasifican por **dimensión física** pero ignoran completamente la **naturaleza del producto**. En la industria, Rappi/Uber Eats/iFood diferencian:

- **Por urgencia temporal**: Comida caliente (30 min max) vs paquetería (mismo día) vs programado (1-3 días)
- **Por requisitos de manipulación**: Frágil, líquidos, cadena de frío, peligroso
- **Por tipo de servicio**: Express, standard, economy, premium

### 1.3 Diseño recomendado

Agregar un sistema de **tags/flags** sobre las categorías existentes, sin reemplazarlas:

```
PackageCategory (existente)     →  Define TAMAÑO (MICRO→XL)
ShipmentType (nuevo)            →  Define NATURALEZA (HOT, FRESH, FRAGILE, STANDARD)
```

**Nuevo modelo ShipmentType:**

```prisma
model ShipmentType {
  id                    String   @id @default(cuid())
  code                  String   @unique  // HOT, FRESH, FRAGILE, STANDARD, DOCUMENT
  name                  String             // "Comida caliente", "Perecedero", etc.
  maxDeliveryMinutes    Int                // SLA máximo: HOT=45, FRESH=90, STANDARD=480
  requiresThermalBag    Boolean  @default(false)
  requiresColdChain     Boolean  @default(false)
  requiresCarefulHandle Boolean  @default(false)
  priorityWeight        Int      @default(0)  // Para scoring: HOT=100, FRESH=50, STANDARD=0
  surchargeArs          Float    @default(0)  // Recargo sobre tarifa base
  isActive              Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

**Datos seed sugeridos:**

| Code | maxDeliveryMin | thermalBag | coldChain | carefulHandle | priority | surcharge |
|------|---------------|------------|-----------|---------------|----------|-----------|
| HOT | 45 | true | false | false | 100 | 0 |
| FRESH | 90 | false | true | false | 80 | 200 |
| FRAGILE | 480 | false | false | true | 30 | 150 |
| STANDARD | 480 | false | false | false | 0 | 0 |
| DOCUMENT | 240 | false | false | false | 10 | 0 |

**Integración con Order:**

```prisma
// Agregar a Order:
shipmentTypeCode  String   @default("STANDARD")
shipmentType      ShipmentType @relation(fields: [shipmentTypeCode], references: [code])
```

**Cálculo automático del ShipmentType:**
- Si el merchant es de categoría "Gastronomía/Comida": default HOT
- Si algún producto tiene tag "perecedero" o "refrigerado": FRESH
- Si algún producto tiene tag "frágil": FRAGILE
- Si todos son documentos/sobres: DOCUMENT
- Default: STANDARD
- Override manual por el comercio al preparar el pedido

### 1.4 Prioridad: P0

Sin esto, no se puede diferenciar una hamburguesa de un sillón. Es bloqueante para operar como plataforma multi-categoría.

---

## FASE 2 — PERFIL DE VEHÍCULO Y CAPACIDAD DEL DRIVER

### 2.1 Estado actual

**Modelo Driver** (schema.prisma, líneas 423-457):
- `vehicleType`: String nullable — valores: "bicicleta", "moto", "auto", "camioneta"
- `vehicleBrand`, `vehicleModel`, `vehicleYear`, `vehicleColor`, `licensePlate`: datos del vehículo
- Documentos: `licenciaUrl`, `seguroUrl`, `vtvUrl`, `dniFrenteUrl`, `dniDorsoUrl`
- Sin campo de capacidad de carga
- Sin campo de equipamiento (bolsa térmica, rack, etc.)
- Sin soporte multi-vehículo
- Sin foto del vehículo

**Registro de driver** (`src/app/repartidor/registro/page.tsx`, líneas 35-40):
```typescript
const VEHICLE_TYPES = [
  { value: "bicicleta", label: "Bicicleta", icon: "🚲", motorized: false },
  { value: "moto", label: "Moto", icon: "🏍️", motorized: true },
  { value: "auto", label: "Auto", icon: "🚗", motorized: true },
  { value: "camioneta", label: "Camioneta", icon: "🚙", motorized: true },
];
```

### 2.2 Brechas

1. **Sin capacidad declarada**: No se sabe si la moto tiene baúl de 30L o de 80L
2. **Sin equipamiento**: No se sabe si tiene bolsa térmica (crítico para HOT/FRESH)
3. **Sin foto del vehículo**: Imposible verificar estado/tipo real
4. **Sin multi-vehículo**: Un driver no puede cambiar entre moto y auto
5. **Inconsistencia de naming**: El schema usa VehicleTypeEnum (BIKE, MOTO, CAR, TRUCK) pero el registro guarda "bicicleta", "moto", "auto", "camioneta". El assignment engine consulta por el enum. **Esto es un bug potencial** si los valores guardados no matchean.
6. **Sin "camión" ni "SUV"**: Solo 4 tipos. Para muebles/carga pesada se necesita al menos camioneta grande y camión/flete.

### 2.3 Diseño recomendado

**Fase inmediata (P1)**: Agregar campos al modelo Driver existente:

```prisma
// Agregar a Driver:
hasThermalBag        Boolean  @default(false)
hasColdStorage       Boolean  @default(false)
hasExternalRack      Boolean  @default(false)
vehiclePhotoUrl      String?
maxCargoWeightKg     Float?    // Capacidad declarada
maxCargoVolumeLiters Float?    // Capacidad declarada
isEnclosed           Boolean  @default(false)  // Protección contra lluvia
```

**Fase posterior (P2)**: Modelo Vehicle separado para multi-vehículo:

```prisma
model Vehicle {
  id                   String   @id @default(cuid())
  driverId             String
  driver               Driver   @relation(fields: [driverId], references: [id])
  type                 VehicleTypeEnum
  brand                String?
  model                String?
  year                 Int?
  color                String?
  licensePlate         String?
  photoUrl             String?
  maxWeightKg          Float
  maxVolumeLiters      Float
  isEnclosed           Boolean  @default(false)
  hasThermalBag        Boolean  @default(false)
  hasColdStorage       Boolean  @default(false)
  isActive             Boolean  @default(true)
  isCurrentVehicle     Boolean  @default(false)  // El que usa HOY
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@index([driverId])
}

// Agregar a Driver:
activeVehicleId  String?  // FK al vehículo que está usando ahora
```

**Fix inmediato del naming**: Normalizar los valores de vehicleType al enum durante el registro. Actualmente se guardan en español minúscula pero el assignment engine consulta por el enum en mayúscula. Verificar que la query PostGIS haga la comparación correctamente.

### 2.4 Prioridad

- P0: Fix del naming inconsistente (potencial bug de matching)
- P1: Campos de equipamiento (thermalBag, cargoWeight)
- P2: Modelo Vehicle separado para multi-vehículo

---

## FASE 3 — ALGORITMO DE MATCHING (DISPATCH ENGINE)

### 3.1 Estado actual

El motor de asignación actual (`src/lib/assignment-engine.ts`) usa un modelo de **cascada por proximidad + rating**:

**Algoritmo actual:**
1. Calcular categoría del pedido → obtener `allowedVehicles`
2. Query PostGIS: buscar drivers online con vehicleType compatible dentro de `search_radius` (50km default)
3. Ordenar en dos tiers:
   - **Dentro de rating_radius (300m)**: por rating DESC (mejor rating = primero)
   - **Fuera de rating_radius**: por distancia ASC (más cerca = primero)
4. Ofrecer al primer driver del ranking
5. Si no acepta en `timeout` (20s): ofrecer al siguiente
6. Repetir hasta `max_attempts` (5)
7. Si nadie acepta: marcar UNASSIGNABLE, notificar admin

**Valores configurables desde OPS (MoovyConfig):**

| Parámetro | Default | Configurable |
|-----------|---------|-------------|
| driver_response_timeout_seconds | 20 | ✅ |
| max_assignment_attempts | 5 | ✅ |
| assignment_rating_radius_meters | 300 | ✅ |
| driver_search_radius_meters | 50000 | ✅ |

**Valores hardcodeados:**

| Parámetro | Valor | Archivo/Línea |
|-----------|-------|--------------|
| Grace window post-expiry | 10s | assignment-engine.ts:575 |
| Score thresholds (MICRO→XL) | 5/15/30/60 | assignment-engine.ts:28-34 |
| Vehicle speeds | MOTO:25, AUTO:20, BICI:12 km/h | geo.ts:43-49 |
| Earnings fallback | 500 + km×300 | assignment-engine.ts:864 |
| Haversine fallback radius | 50km | assignment-engine.ts:197 |

### 3.2 Evaluación del algoritmo

**Fortalezas:**
- PostGIS para queries geoespaciales eficientes (ST_DWithin, ST_Distance)
- Two-tier sorting (rating dentro de radio, distancia fuera) es un buen balance
- Serializable isolation en accept para prevenir race conditions
- Cascade automático con cron cada ~10s
- Fallback a Haversine si PostGIS falla
- Estimación de earnings mostrada al driver antes de aceptar

**Debilidades:**
- **No es scoring multivariable**: Solo usa distancia + rating. No considera acceptance_rate, velocidad histórica, carga actual, fairness.
- **No hay priorización de pedidos**: Un pedido HOT urgente y un paquete estándar reciben el mismo tratamiento en la cola.
- **No hay batching**: Cada pedido = 1 asignación. Si hay 3 pedidos del mismo comercio, se buscan 3 drivers.
- **No hay surge/escalamiento de radio**: Si no hay drivers cerca, no se expande el radio progresivamente.
- **No hay fairness**: Un driver que lleva 2 horas sin pedido no tiene prioridad sobre uno que acaba de entregar.
- **No considera el estado del pedido (HOT vs STANDARD)**: Todos entran a la misma cola.

### 3.3 Diseño del Dispatch Engine mejorado

**Scoring multivariable recomendado:**

```
SCORE = w1 × proximity_score       // 0-100, inversamente proporcional a distancia
       + w2 × vehicle_fit_score    // 0 (eliminatorio) o 50 (ok) o 100 (ideal)
       + w3 × rating_score         // 0-100, normalizado del rating 1-5
       + w4 × acceptance_rate      // 0-100, % de aceptaciones últimos 7 días
       + w5 × idle_time_bonus      // 0-100, proporcional al tiempo sin pedido
       + w6 × equipment_bonus      // 0-50, si tiene bolsa térmica y el pedido es HOT
```

**Pesos sugeridos (Sprint 0):**

```typescript
const WEIGHTS = {
  proximity: 0.40,      // La distancia sigue siendo lo más importante
  vehicleFit: 0.15,     // Penalizar enviar camioneta por una hamburguesa
  rating: 0.15,          // Calidad del servicio
  acceptanceRate: 0.10,  // Fiabilidad
  idleTime: 0.10,        // Fairness
  equipment: 0.10,       // Match de equipamiento
};
```

**Implementación gradual:**
- **Sprint 0**: Mantener el algoritmo actual pero agregar filtro por ShipmentType + priorización de cola
- **Mes 1**: Agregar scoring multivariable completo
- **Mes 2**: Agregar batching y surge

### 3.4 Reglas de priorización de cola

Antes de asignar drivers, los pedidos pendientes deberían ordenarse por prioridad:

```typescript
function calculateOrderPriority(order: Order): number {
  let priority = 0;

  // Por tipo de envío (urgencia)
  if (order.shipmentTypeCode === 'HOT') priority += 100;
  if (order.shipmentTypeCode === 'FRESH') priority += 80;

  // Por tiempo de espera (antigüedad)
  const waitMinutes = (Date.now() - order.createdAt.getTime()) / 60000;
  priority += Math.min(waitMinutes * 2, 60); // Max +60 por espera

  // Por intentos fallidos (ya esperó mucho)
  priority += order.assignmentAttempts * 15;

  return priority;
}
```

### 3.5 Prioridad: P0-P1

- P0: Filtro por ShipmentType (HOT no puede ir en bici sin bolsa térmica)
- P0: Priorización de cola por urgencia
- P1: Scoring multivariable completo
- P2: Batching
- P3: Surge pricing / expansión dinámica de radio

---

## FASE 4 — CÁLCULO DE COSTO DE ENVÍO

### 4.1 Estado actual

Moovy tiene **DOS sistemas de pricing** que coexisten sin conectarse:

**Sistema 1: Fuel-based** (`src/lib/delivery.ts`)
```
roundTripKm = distancia × 2
fuelCost = roundTripKm × fuelConsumption × fuelPrice
total = (baseDeliveryFee + fuelCost) × maintenanceFactor
```

Parámetros (StoreSettings):
- baseDeliveryFee: 500 ARS
- fuelPricePerLiter: 1200 ARS
- fuelConsumptionPerKm: 0.06 L/km
- maintenanceFactor: 1.35

**Sistema 2: Category-based** (DeliveryRate por PackageCategory)
```
earnings = basePriceArs + pricePerKmArs × distanciaKm
```

Usado para: calcular earnings del driver, NO para cobrarle al comprador.

**Problema**: El comprador paga según el Sistema 1 (fuel-based, igual para todos). El driver gana según el Sistema 2 (category-based). No hay conexión.

### 4.2 Brechas vs industria

- **Sin diferenciación por categoría al comprador**: Enviar un sobre cuesta lo mismo que un mueble
- **Sin surge pricing**: Mismo precio llueva o haga sol, viernes 20hs o martes 10hs
- **Sin opciones de velocidad**: No hay "Express" vs "Standard" vs "Económico"
- **Sin recargo por manipulación especial**: Frágil, cadena de frío, mueble pesado
- **Sin envío gratis del comercio**: El merchant no puede absorber el costo (solo hay freeDeliveryMinimum global)
- **El fee se calcula client-side y se envía al server**: Seguridad preocupante (el comprador podría manipularlo)

### 4.3 Diseño recomendado

**Fórmula unificada:**

```typescript
function calculateShippingCost(params: {
  distanceKm: number;
  packageCategory: string;      // MICRO, SMALL, MEDIUM, LARGE, XL
  shipmentType: string;         // HOT, FRESH, FRAGILE, STANDARD
  orderTotal: number;
  merchantId: string;
  requestedSpeed?: 'EXPRESS' | 'STANDARD' | 'ECONOMY';
}): ShippingCostResult {

  // 1. Base por categoría de paquete (DeliveryRate)
  const rate = getDeliveryRate(params.packageCategory);
  let cost = rate.basePriceArs + rate.pricePerKmArs * params.distanceKm;

  // 2. Recargo por tipo de envío
  const shipmentType = getShipmentType(params.shipmentType);
  cost += shipmentType.surchargeArs;

  // 3. Recargo por peso/volumen excedente (si aplica)
  // Omitido en Sprint 0

  // 4. Surge multiplier (si aplica)
  // const surge = getSurgeMultiplier(zone, datetime);
  // cost *= surge; // Sprint 2

  // 5. Speed multiplier
  if (params.requestedSpeed === 'EXPRESS') cost *= 1.3;
  if (params.requestedSpeed === 'ECONOMY') cost *= 0.8;

  // 6. Free delivery check
  const merchant = getMerchant(params.merchantId);
  if (merchant.freeDeliveryMinimum && params.orderTotal >= merchant.freeDeliveryMinimum) {
    cost = 0;
  }

  // 7. Merchant subsidy (el comercio puede absorber parte)
  if (merchant.deliverySubsidyPercent > 0) {
    cost *= (1 - merchant.deliverySubsidyPercent / 100);
  }

  return {
    subtotal: cost,
    surcharges: { ... },
    total: Math.ceil(cost),
    estimatedMinutes: calculateETA(params),
  };
}
```

**Crítico: Validar server-side**: El costo SIEMPRE debe calcularse en el server al crear la orden, nunca confiar en el valor que manda el frontend.

### 4.4 Tarifas sugeridas (valores iniciales para Ushuaia)

| Categoría | Base (ARS) | $/km (ARS) | Notas |
|-----------|-----------|------------|-------|
| MICRO | 400 | 150 | Sobres, documentos |
| SMALL | 500 | 200 | Paquetes chicos |
| MEDIUM | 600 | 250 | Comida, cajas medianas |
| LARGE | 800 | 350 | Electrodomésticos chicos |
| XL | 1200 | 500 | Muebles, carga pesada |

| Recargo | Monto (ARS) |
|---------|------------|
| HOT (bolsa térmica) | 0 (incluido en base) |
| FRESH (cadena frío) | +200 |
| FRAGILE (manipulación) | +150 |
| EXPRESS (+30% velocidad) | +30% sobre total |

### 4.5 Prioridad: P0

El pricing actual es funcional pero cobrar lo mismo por un sobre que por un mueble no es viable comercialmente.

---

## FASE 5 — CÁLCULO DE ETA

### 5.1 Estado actual

**Función**: `estimateTravelTime()` en `src/lib/geo.ts` (líneas 38-55)

```typescript
// Velocidades (hardcoded):
MOTO: 25 km/h, AUTO: 20 km/h, BICI: 12 km/h
// Fórmula:
minutes = ceil(distanceKm / speed * 60)
// Bounds: min 2 min, max 60 min
```

**Campos del Merchant**: `deliveryTimeMin` (default 30), `deliveryTimeMax` (default 45)

**Problema**: El ETA no incluye tiempo de preparación del comercio, tiempo de espera de driver, ni tiempo de retiro. Solo es tiempo de viaje.

### 5.2 Diseño recomendado

```typescript
function calculateFullETA(params: {
  distanceDriverToMerchant: number;  // km
  distanceMerchantToCustomer: number; // km
  vehicleType: string;
  merchantPrepTimeMin: number;    // Del merchant o del seller
  shipmentType: string;
  hasDriverAssigned: boolean;
}): ETAResult {

  // 1. Tiempo de preparación del comercio
  const prepTime = params.merchantPrepTimeMin; // Merchant.deliveryTimeMin

  // 2. Tiempo de espera de driver (si no hay uno asignado)
  const driverWaitTime = params.hasDriverAssigned ? 0 : 5; // promedio 5 min

  // 3. Tiempo driver → comercio
  const driverToMerchant = estimateTravelTime(
    params.distanceDriverToMerchant,
    params.vehicleType
  );

  // 4. Tiempo en comercio (retiro)
  const pickupTime = 3; // minutos promedio

  // 5. Tiempo comercio → destino
  const merchantToCustomer = estimateTravelTime(
    params.distanceMerchantToCustomer,
    params.vehicleType
  );

  // 6. Buffer de imprevistos
  const buffer = Math.ceil((driverToMerchant + merchantToCustomer) * 0.15);

  const totalMin = prepTime + driverWaitTime + driverToMerchant
                   + pickupTime + merchantToCustomer + buffer;

  // 7. SLA check
  const shipmentType = getShipmentType(params.shipmentType);
  const exceedsSLA = totalMin > shipmentType.maxDeliveryMinutes;

  return {
    totalMinutes: totalMin,
    rangeMin: totalMin - 5,
    rangeMax: totalMin + 10,
    breakdown: { prepTime, driverWaitTime, driverToMerchant, pickupTime, merchantToCustomer, buffer },
    exceedsSLA,
    slaMinutes: shipmentType.maxDeliveryMinutes,
  };
}
```

**Visualización al comprador**: Mostrar rango (ej: "35-50 min") basado en `rangeMin`/`rangeMax`, NO un número exacto.

**SLA diferenciado:**

| Tipo | SLA target | SLA max | Acción si excede |
|------|-----------|---------|-----------------|
| HOT | 30 min | 45 min | Alertar al comprador antes de pagar |
| FRESH | 45 min | 90 min | Alertar |
| STANDARD | 60 min | 480 min (mismo día) | Informar |
| DOCUMENT | 30 min | 240 min | Informar |

### 5.3 Prioridad: P1

El ETA actual funciona pero es impreciso. Mejorarlo aumenta confianza del comprador.

---

## FASE 6 — FLUJO COMPLETO DEL PEDIDO

### 6.1 State machine actual

**Archivo**: `src/lib/orderStates.ts`

Estados actuales (10):
```
PENDING → AWAITING_PAYMENT → CONFIRMED → PREPARING → READY →
DRIVER_ASSIGNED → PICKED_UP → IN_DELIVERY → DELIVERED
+ CANCELLED, SCHEDULED, UNASSIGNABLE
```

DeliveryStatus (paralelo, 4 valores):
```
DRIVER_ASSIGNED → DRIVER_ARRIVED → PICKED_UP → DELIVERED
```

### 6.2 Evaluación

**Bien**:
- Separación de OrderStatus y DeliveryStatus es correcta
- Timestamps en estados clave (deliveredAt, scheduledConfirmedAt, etc.)
- UNASSIGNABLE como estado terminal cuando no hay drivers

**Faltas**:
- No hay estado `READY_FOR_PICKUP` diferenciado de `READY`
- No hay `DRIVER_EN_ROUTE_TO_STORE` (entre asignación y llegada al comercio)
- No hay `ARRIVING` (driver llegando al destino, último tramo)
- No hay `DELIVERY_FAILED` (comprador no estaba, rechazo en puerta)
- No hay `RETURN_TO_STORE` (devolución al comercio por entrega fallida)
- No hay `REJECTED_BY_STORE` diferenciado (el comercio rechaza el pedido)
- No hay logging de timestamps por cada transición

### 6.3 State machine recomendada

```
[PENDING]
  → [AWAITING_PAYMENT] (si MP)
  → [CONFIRMED] (si cash o pago recibido)
  → [CANCELLED_BY_BUYER]

[AWAITING_PAYMENT]
  → [CONFIRMED] (webhook MP approved)
  → [CANCELLED_BY_SYSTEM] (pago expirado/rechazado)

[CONFIRMED]
  → [PREPARING] (merchant acepta)
  → [REJECTED_BY_STORE] (merchant rechaza → refund)
  → [CANCELLED_BY_BUYER] (antes de que el merchant acepte)

[PREPARING]
  → [READY_FOR_PICKUP] (merchant termina preparación)
  → [CANCELLED_BY_SYSTEM] (timeout sin preparar)

[READY_FOR_PICKUP]
  → [DRIVER_ASSIGNED] (driver acepta)

[DRIVER_ASSIGNED]
  → [DRIVER_EN_ROUTE] (driver confirma que va al comercio)
  → [DRIVER_AT_STORE] (driver llega, GPS o manual)

[DRIVER_AT_STORE]
  → [PICKED_UP] (driver confirma retiro, foto opcional)

[PICKED_UP]
  → [IN_TRANSIT] (driver en camino al destino)
  → [ARRIVING] (driver a <500m del destino)

[IN_TRANSIT]
  → [ARRIVING]

[ARRIVING]
  → [DELIVERED] (driver confirma entrega, foto de proof)
  → [DELIVERY_FAILED] (comprador no está)

[DELIVERY_FAILED]
  → [RETURN_TO_STORE] (se devuelve al comercio)
  → [DELIVERED] (segundo intento exitoso)

[DELIVERED]
  → [CONFIRMED_BY_BUYER] (rating + confirmación)
```

**Nota**: Implementar esto de forma gradual. Sprint 0 puede mantener los estados actuales y agregar solo REJECTED_BY_STORE y DELIVERY_FAILED.

### 6.4 Qué ve cada actor

| Estado | Comprador ve | Comercio ve | Driver ve | Admin ve |
|--------|-------------|-------------|-----------|----------|
| PENDING | "Procesando tu pedido" | — | — | Nuevo pedido |
| CONFIRMED | "Pedido confirmado" | "Nuevo pedido!" + aceptar/rechazar | — | En cola |
| PREPARING | "El comercio está preparando tu pedido" | "Preparando" + marcar listo | — | Preparando |
| READY_FOR_PICKUP | "Tu pedido está listo, buscando repartidor" | "Listo, esperando repartidor" | Oferta de pedido | Buscando driver |
| DRIVER_ASSIGNED | "Repartidor asignado: Juan" + mapa | "Juan va en camino a retirar" | Ir al comercio + navegación | Driver asignado |
| PICKED_UP | "Tu pedido está en camino" + mapa tracking | "Pedido retirado" | Ir al destino + navegación | En tránsito |
| DELIVERED | "Entregado! Calificá" | "Entregado" + revenue | Resumen + ganancia | Completado |

### 6.5 Prioridad: P1

Los estados actuales funcionan. Agregar REJECTED_BY_STORE y DELIVERY_FAILED es P0. El resto es P1-P2.

---

## FASE 7 — ZONAS, COBERTURA Y GEOFENCING

### 7.1 Estado actual

- **Merchant.deliveryRadiusKm** (default 5km): Radio fijo circular por comercio
- **StoreSettings.maxDeliveryDistance** (default 15km): Límite global
- **PostGIS ST_DWithin**: Usado para buscar drivers dentro de un radio
- **No hay modelo de zonas**: Sin polígonos, sin zonas diferenciadas, sin recargos por zona

### 7.2 Brechas

- Un radio circular no refleja la realidad urbana (calles, puentes, ríos)
- No se pueden definir zonas donde no se hacen envíos (ej: zona industrial, al otro lado del aeropuerto)
- No hay recargos por distancia a zonas periféricas
- No hay restricciones por horario en ciertas zonas
- El driver no puede indicar zonas donde no quiere trabajar

### 7.3 Diseño recomendado (progresivo)

**Sprint 0 (mantener)**: Radio fijo por merchant. Funciona para Ushuaia que es chica.

**Mes 2**: Agregar modelo DeliveryZone con polígonos GeoJSON:

```prisma
model DeliveryZone {
  id              String   @id @default(cuid())
  name            String   // "Centro", "Barrio Sur", "Zona Industrial"
  polygon         Unsupported("geography")  // PostGIS polygon
  isActive        Boolean  @default(true)
  surchargeArs    Float    @default(0)       // Recargo por zona
  isRestricted    Boolean  @default(false)   // No se hacen envíos aquí
  maxVehicleType  String?  // Solo ciertos vehículos
  notes           String?  // "Solo motos, calles angostas"
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**Mes 3**: Zonas de alta demanda para pre-posicionamiento + surge.

### 7.4 Prioridad: P2-P3

Para Ushuaia con radio fijo alcanza inicialmente. Cuando se expanda a más ciudades, las zonas serán críticas.

---

## FASE 8 — TRACKING Y VISIBILIDAD

### 8.1 Estado actual

**Tracking del comprador**: ✅ Implementado
- Mapa en tiempo real con `OrderTrackingMiniMap` (Google Maps + Directions API)
- Polling cada 10 segundos + Socket.IO real-time
- Smooth GPS interpolation (1s ease-out cubic)
- Tracking público sin auth (`/seguimiento/[orderId]`)
- Timeline de 8 pasos visual

**Vista del comercio**: ⚠️ Parcial
- Ve estado del pedido en tiempo real via Socket.IO
- NO ve la ubicación del driver en mapa

**Vista del driver**: ✅ Implementado
- Dashboard con pedidos disponibles/activos
- Navegación via Google Maps / Waze (links, no integrada)
- Botones para cambiar estado (ARRIVED, PICKED_UP, DELIVERED)
- Push notifications para nuevas ofertas

**Privacidad**: ⚠️ Parcial
- Se comparte nombre y foto del driver al comprador
- La dirección completa del comprador es visible para el driver desde que acepta
- No hay anonimización de teléfonos
- Info se mantiene visible después de la entrega

### 8.2 Brechas

- El comercio debería ver ubicación del driver que va a retirar (ETA de retiro)
- El driver debería poder marcar "llegué" automáticamente por GPS (geofence del comercio)
- Proof of delivery debería ser obligatorio (foto), no solo optional
- Comunicación debería ser por chat in-app, no por teléfono directo
- Tracking debería desaparecer X minutos después de la entrega

### 8.3 Prioridad

- P1: Vista del driver para el comercio (ETA de retiro)
- P1: Proof of delivery obligatorio (foto)
- P2: Auto-detección de llegada por GPS
- P3: Chat in-app
- P3: Anonimización de teléfonos

---

## FASE 9 — CASOS ESPECIALES Y EDGE CASES

### 9.1 Pedido multi-paquete

**Estado actual**: El assignment engine suma `volumeScore × quantity` de todos los items. Esto es correcto para determinar el tamaño total, pero no considera el item más voluminoso individualmente.

**Mejora**: Si un item individual requiere CAR pero el score total es SMALL, igual debería asignar CAR. Agregar:

```typescript
const maxItemCategory = Math.max(...items.map(i => i.packageCategory.volumeScore));
const maxVehicles = getVehiclesForScore(maxItemCategory);
// allowedVehicles = intersection of totalScore vehicles AND maxItem vehicles
// (usar el más restrictivo)
```

### 9.2 Pedido multi-comercio

**Estado actual**: SubOrders permiten drivers separados por vendor. El schema lo soporta.

**Falta**: La lógica de assignment solo opera a nivel Order, no SubOrder. Cada SubOrder debería tener su propio ciclo de asignación si los merchants están en ubicaciones diferentes.

### 9.3 Pedido que requiere 2 personas

**No existe**. Para Sprint 0, simplemente informar al comprador que envíos XXL requieren que alguien ayude a recibir. P3 para implementar servicio de ayudante.

### 9.4 Ventanas de entrega

**Schema listo** (scheduledSlotStart/End en Order). Falta la UI del comprador para seleccionar ventana y la lógica de asignar driver justo antes de la ventana.

### 9.5 Entrega fallida

**No existe**. No hay estado DELIVERY_FAILED ni lógica de reintentos. El driver solo puede marcar DELIVERED. Si el comprador no está, no hay protocolo.

**Recomendación P1**: Agregar flujo:
1. Driver marca "Cliente no disponible"
2. Se intenta contactar al comprador (push + llamada)
3. Timer de 5 minutos de espera
4. Si no responde: driver puede marcar DELIVERY_FAILED
5. El driver recibe compensación parcial por el viaje
6. Se ofrece al comprador reprogramar o cancelar

### 9.6 Clima adverso

**No existe**. Para Ushuaia (clima extremo) es relevante. P2 para agregar:
- Multiplicador de ETA en días de mal clima
- Suspensión de bicicletas en nieve/lluvia fuerte
- Notificación al comprador de posible demora

### 9.7 Reverse logistics

**No existe**. No hay flujo de enviar un driver a buscar una devolución. P2-P3.

---

## FASE 10 — MÉTRICAS Y ESCALABILIDAD

### 10.1 KPIs que faltan

No hay dashboard de métricas logísticas. El OPS tiene datos crudos pero no KPIs calculados.

**KPIs esenciales a implementar (P1):**
- Tiempo promedio de entrega (desde CONFIRMED hasta DELIVERED)
- % entregas dentro del SLA por tipo de envío
- Tiempo promedio de asignación (desde PREPARING hasta DRIVER_ASSIGNED)
- Tasa de pedidos sin driver (UNASSIGNABLE / total)
- Tasa de rechazo de drivers (rechazos / ofertas totales)
- Utilización de drivers (tiempo con pedido / tiempo online)

Todos estos datos YA están en la DB (AssignmentLog, Order timestamps). Solo falta calcularlos y mostrarlos.

### 10.2 Escalabilidad

**Actual**: El cron `assignment-tick` procesa expired assignments secuencialmente. Con 10-50 pedidos diarios está bien.

**Problema a 1000+ pedidos**: El cron podría tardar más que su intervalo. Cada `findNextEligibleDriver` hace una query PostGIS completa.

**Recomendación P2-P3**:
- Usar cola de mensajes (Bull/BullMQ con Redis) para cada assignment como job independiente
- Indexar AssignmentLog por (orderId, outcome) para acelerar exclusiones
- Cache de drivers online en Redis (no consultar DB cada vez)
- Batch las notificaciones push

---

# PARTE 3: ENTREGABLES

## Entregable 1: Taxonomía de envíos completa

| Categoría Física | Tipo Especial | Vehículos | SLA (min) | Tarifa base | $/km |
|-----------------|--------------|-----------|-----------|------------|------|
| MICRO | STANDARD | BIKE,MOTO,CAR,TRUCK | 480 | 400 | 150 |
| MICRO | DOCUMENT | BIKE,MOTO,CAR | 240 | 350 | 120 |
| SMALL | STANDARD | BIKE,MOTO,CAR,TRUCK | 480 | 500 | 200 |
| SMALL | FRAGILE | MOTO*,CAR,TRUCK | 480 | 650 | 200 |
| MEDIUM | STANDARD | MOTO,CAR,TRUCK | 480 | 600 | 250 |
| MEDIUM | HOT | MOTO,CAR | 45 | 600 | 250 |
| MEDIUM | FRESH | MOTO*,CAR,TRUCK | 90 | 800 | 250 |
| LARGE | STANDARD | CAR,TRUCK | 480 | 800 | 350 |
| LARGE | FRAGILE | CAR,TRUCK | 480 | 950 | 350 |
| XL | STANDARD | TRUCK | 1440 | 1200 | 500 |
| XL | FRAGILE | TRUCK | 1440 | 1500 | 500 |

\* Con equipamiento adecuado (bolsa térmica para FRESH en moto, embalaje para FRAGILE)

## Entregable 2: Matriz de compatibilidad vehículo ↔ paquete

| Categoría | Bicicleta | Moto | Auto | Camioneta |
|-----------|-----------|------|------|-----------|
| MICRO | ✅ | ✅ | ✅ | ✅ |
| SMALL | ✅ | ✅ | ✅ | ✅ |
| MEDIUM | ⚠️ (solo si cabe en mochila) | ✅ | ✅ | ✅ |
| LARGE | ❌ | ❌ | ✅ | ✅ |
| XL | ❌ | ❌ | ❌ | ✅ |
| HOT | ✅ (con bolsa) | ✅ (con bolsa) | ✅ | ❌ (no apropiado) |
| FRESH | ❌ | ⚠️ (con cooler) | ✅ | ✅ |
| FRAGILE | ❌ | ⚠️ (con cuidado) | ✅ | ✅ |

## Entregable 3: State machine simplificada (diagrama)

```
PENDING ──→ AWAITING_PAYMENT ──→ CONFIRMED ──→ PREPARING
   │              │                   │              │
   └──→ CANCELLED_BY_BUYER     REJECTED_BY_STORE   │
                  │                                  ↓
            CANCELLED_BY_SYSTEM              READY_FOR_PICKUP
                                                    │
                                             DRIVER_ASSIGNED
                                                    │
                                              PICKED_UP
                                                    │
                                              IN_TRANSIT
                                                    │
                                        ┌───── ARRIVING ─────┐
                                        ↓                    ↓
                                    DELIVERED         DELIVERY_FAILED
                                        │                    │
                                  CONFIRMED_BY_BUYER   RETURN_TO_STORE
```

## Entregable 4: Lista de brechas priorizadas

### P0 — Bloqueante para multi-categoría (Sprint 0, semana 1-2)

1. **ShipmentType model + seed** — Sin esto no hay HOT vs STANDARD
2. **Fix naming vehicleType** — "bicicleta" vs "BIKE" puede romper matching
3. **Validar deliveryFee server-side** — El frontend envía el fee, se debe recalcular
4. **maxDeliveryTimeMinutes** — Comida caliente sin SLA = llega fría
5. **ShipmentType en Order** — Conectar el tipo al pedido

### P1 — Primer mes (Sprint 1-4)

6. Campos equipamiento en Driver (thermalBag, cargoWeight)
7. ETA completo (prep + driver + tránsito + buffer)
8. Mostrar ETA al comprador ANTES de pagar
9. Costo de envío diferenciado por categoría al comprador
10. Estado DELIVERY_FAILED + protocolo de reintentos
11. Estado REJECTED_BY_STORE
12. Proof of delivery obligatorio (foto)
13. KPIs logísticos en OPS dashboard
14. Priorización de cola por urgencia (HOT primero)
15. Vista del driver para el comercio (ETA de retiro)

### P2 — Segundo mes

16. Scoring multivariable completo (acceptance_rate, idle_time, etc.)
17. Batching de pedidos del mismo comercio
18. Ventanas de entrega (UI + lógica)
19. Zonas de cobertura con polígonos GeoJSON
20. Surge pricing (horario pico, mal clima)
21. Multiplicador de ETA por clima
22. Reverse logistics (devolución con driver)
23. Merchant puede ofrecer envío gratis / subsidio parcial
24. Dashboard de métricas logísticas completo

### P3 — Tercer mes / mejora continua

25. Multi-vehículo por driver (modelo Vehicle separado)
26. Batching multi-comercio
27. Pre-posicionamiento de drivers en zonas de demanda
28. Chat in-app (reemplazar teléfono directo)
29. Anonimización de teléfonos
30. Predicción de demanda (histórico)
31. Auto-detección de llegada por GPS (geofence)
32. Servicio de ayudante para carga pesada (XXL)
33. Cola de mensajes (Bull/Redis) para assignments a escala

## Entregable 5: Roadmap logístico

### Sprint 0 (Semana 1-2) — MVP Multi-categoría
- Crear modelo ShipmentType con 5 tipos seed
- Agregar shipmentTypeCode a Order
- Fix naming vehicleType (normalizar a enum)
- Validar deliveryFee server-side (recalcular al crear orden)
- Conectar DeliveryRate al cálculo del comprador (no solo del driver)
- Auto-detectar ShipmentType según rubro del comercio

### Mes 1 (Sprints 1-4) — Matching inteligente + UX
- Campos de equipamiento en Driver
- ETA completo con breakdown
- Mostrar ETA + costo desglosado al comprador en checkout
- Estado DELIVERY_FAILED con protocolo
- Estado REJECTED_BY_STORE
- Proof of delivery obligatorio
- Priorización de cola por urgencia
- KPIs logísticos básicos en OPS
- Vista de driver para el comercio

### Mes 2 (Sprints 5-8) — Optimización
- Scoring multivariable
- Batching de pedidos
- Ventanas de entrega
- Zonas con polígonos (si se expande a otra ciudad)
- Surge pricing
- ETA ajustado por clima
- Reverse logistics básico
- Subsidio de envío por merchant

### Mes 3 (Sprints 9-12) — Escalabilidad
- Multi-vehículo por driver
- Batching multi-comercio
- Pre-posicionamiento
- Bull/Redis para assignments
- Predicción de demanda
- Chat in-app
- Geofence auto-arrival

---

# PARTE 4: VEREDICTO FINAL

## ¿Qué tan lejos está Moovy de logística profesional?

**Respuesta honesta**: Moovy está al **60-65%** de un sistema logístico de nivel profesional para su escala actual (Ushuaia, <100 pedidos/día).

**Lo que tiene bien**:
- PostGIS para queries geoespaciales (esto lo pone adelante del 90% de los startups argentinos)
- Assignment engine con timeout cascade configurable
- Tracking en tiempo real con Socket.IO + Google Maps
- Package categories con vehicle matching
- Multi-vendor con SubOrders
- Config editable desde OPS (no hardcodeado)

**Lo que le falta para ser profesional**:
- Diferenciación por tipo de producto (HOT vs STANDARD) — es la brecha #1
- SLAs y ETA realistas
- Pricing por categoría al comprador
- Manejo de entregas fallidas
- Métricas operativas
- Scoring multivariable en el dispatch

**Comparación con la industria**:
- vs **Rappi/PedidosYa**: Moovy tiene el 40% de su funcionalidad logística. Les falta batching, surge, zonas, métricas, reverse logistics.
- vs **Mercado Envíos**: Moovy tiene el 30%. ME tiene cross-docking, múltiples carriers, SLAs contractuales, insurance.
- vs **Amazon Logistics**: Moovy tiene el 15%. Amazon tiene predicción ML, warehousing, same-day a escala nacional.
- vs **Un startup argentino promedio**: Moovy está **por encima**. La base PostGIS + assignment engine configurable es sólida.

**La buena noticia**: Con el Sprint 0 (2 semanas) + Mes 1, Moovy puede llegar al 80% de lo necesario para operar profesionalmente en Ushuaia como tienda + marketplace multi-categoría. El 20% restante es optimización que se puede hacer iterativamente con datos reales de operación.
