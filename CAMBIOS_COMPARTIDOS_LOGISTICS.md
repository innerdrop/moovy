# Cambios en archivos compartidos necesarios para P0 Logístico

> Este documento lista los cambios que NO se aplicaron por restricción de scope,
> pero que son necesarios para que los módulos P0 funcionen al 100%.
>
> Prioridad: aplicar estos cambios **antes del lanzamiento**.

---

## 1. Schema Prisma — Modelo ShipmentType (NUEVO)

**Archivo**: `prisma/schema.prisma`

Agregar el siguiente modelo:

```prisma
model ShipmentType {
  id                    String   @id @default(cuid())
  code                  String   @unique  // HOT, FRESH, FRAGILE, STANDARD, DOCUMENT
  name                  String             // "Comida caliente", "Perecedero", etc.
  maxDeliveryMinutes    Int                // SLA máximo: HOT=45, FRESH=90, STANDARD=480
  requiresThermalBag    Boolean  @default(false)
  requiresColdChain     Boolean  @default(false)
  requiresCarefulHandle Boolean  @default(false)
  priorityWeight        Int      @default(0)  // Para scoring: HOT=100, FRESH=50
  surchargeArs          Float    @default(0)  // Recargo sobre tarifa base
  allowedVehicles       String[] @default(["BIKE", "MOTO", "CAR", "TRUCK"])
  isActive              Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  orders                Order[]
}
```

**Seed data**: ver `src/lib/shipment-types.ts` → `SHIPMENT_TYPES` para los valores.

---

## 2. Schema Prisma — Campo shipmentTypeCode en Order

**Archivo**: `prisma/schema.prisma` → modelo `Order`

Agregar los siguientes campos:

```prisma
// En el modelo Order, agregar:
shipmentTypeCode  String       @default("STANDARD")
shipmentType      ShipmentType? @relation(fields: [shipmentTypeCode], references: [code])
```

**Nota**: El campo es opcional con default "STANDARD" para que los pedidos existentes no se rompan.

Después de agregar, ejecutar:
```bash
npx prisma db push
```

---

## 3. API de creación de pedidos — Validación server-side del deliveryFee

**Archivo**: `src/app/api/orders/route.ts`

### Cambio requerido:

En el POST handler, después de calcular el subtotal y antes de crear la orden, agregar:

```typescript
import { calculateShippingCost, validateDeliveryFee } from "@/lib/shipping-cost-calculator";
import { autoDetectShipmentType } from "@/lib/shipment-types";
import { calculateOrderCategory } from "@/lib/assignment-engine";

// Después de la línea: let finalTotal = subtotal + (deliveryFee || 0);

// --- P0: Recalcular deliveryFee server-side ---
if (!isPickup && distanceKm) {
  // Determinar categoría de paquete
  const itemCats = items.map((i: any) => ({
    packageCategory: i.packageCategory || null,
    quantity: i.quantity,
    name: i.name || "",
  }));
  const orderCat = await calculateOrderCategory(itemCats, {
    merchantCategoryName: merchant?.category?.name,
  });

  // Calcular costo server-side
  const serverCost = calculateShippingCost({
    distanceKm,
    packageCategory: orderCat.category,
    shipmentTypeCode: orderCat.shipmentTypeCode,
    orderTotal: subtotal,
    freeDeliveryMinimum: merchant?.freeDeliveryMinimum ?? null,
  });

  // Validar y corregir el fee del frontend
  const validation = validateDeliveryFee(deliveryFee || 0, serverCost);
  if (validation.wasModified) {
    console.log(`[Orders] deliveryFee corregido: $${deliveryFee} → $${validation.correctedFee} (${validation.reason})`);
  }
  deliveryFee = validation.correctedFee;
  finalTotal = subtotal + deliveryFee;

  // Guardar el shipmentTypeCode en la orden (cuando el campo exista en schema)
  // shipmentTypeCode = orderCat.shipmentTypeCode;
}
// --- Fin P0 ---
```

### Líneas específicas a modificar:

1. **Línea ~66**: `deliveryFee` — cambiar de `const` a `let` si es const
2. **Línea ~88**: `let finalTotal = subtotal + (deliveryFee || 0);` — mover después del recálculo
3. **Línea ~173**: `deliveryFee: isPickup ? 0 : (deliveryFee || 0)` — ya usa el valor corregido

---

## 4. Schema Prisma — Campos de equipamiento en Driver (P1)

**Archivo**: `prisma/schema.prisma` → modelo `Driver`

Agregar para habilitar el filtro por equipamiento (P1, no bloqueante P0):

```prisma
// En el modelo Driver, agregar:
hasThermalBag        Boolean  @default(false)
hasColdStorage       Boolean  @default(false)
hasExternalRack      Boolean  @default(false)
maxCargoWeightKg     Float?
maxCargoVolumeLiters Float?
```

---

## 5. Fix naming vehicleType en registro de driver (RECOMENDADO)

**Archivo**: `src/app/api/auth/register/driver/route.ts`

### Cambio recomendado:

Al guardar el `vehicleType`, normalizar al enum canónico:

```typescript
import { normalizeVehicleTypeOrDefault } from "@/lib/vehicle-type-mapping";

// Donde se guarda vehicleType, reemplazar:
// vehicleType: body.vehicleType,
// Por:
vehicleType: normalizeVehicleTypeOrDefault(body.vehicleType),
```

**Nota**: El assignment engine ya maneja ambos formatos (P0 fix), pero normalizar en el registro es más limpio a largo plazo.

---

## 6. API de cálculo de delivery — Nuevo endpoint (OPCIONAL)

Crear un nuevo endpoint para que el frontend pueda obtener el costo correcto:

**Archivo**: `src/app/api/delivery/calculate/route.ts` (NUEVO)

```typescript
import { calculateShippingCost } from "@/lib/shipping-cost-calculator";
import { calculatePreCheckoutETA } from "@/lib/eta-calculator";
import { autoDetectShipmentType } from "@/lib/shipment-types";

export async function POST(req: Request) {
  const { distanceKm, packageCategory, merchantId, orderTotal, items } = await req.json();

  // Auto-detect shipment type
  const shipmentTypeCode = autoDetectShipmentType({
    merchantCategoryName: merchant?.category?.name,
    productNames: items?.map((i: any) => i.name) || [],
  });

  // Calculate cost
  const cost = calculateShippingCost({
    distanceKm,
    packageCategory: packageCategory || "MEDIUM",
    shipmentTypeCode,
    orderTotal: orderTotal || 0,
    freeDeliveryMinimum: merchant?.freeDeliveryMinimum ?? null,
  });

  // Calculate ETA
  const eta = calculatePreCheckoutETA({
    distanceMerchantToCustomerKm: distanceKm,
    merchantPrepTimeMin: merchant?.deliveryTimeMin || 30,
    shipmentTypeCode,
  });

  return Response.json({
    cost,
    eta: {
      displayLabel: eta.displayLabel,
      totalMinutes: eta.totalMinutes,
      exceedsSLA: eta.exceedsSLA,
      slaWarning: eta.slaWarning,
    },
    shipmentType: {
      code: shipmentTypeCode,
      name: getShipmentType(shipmentTypeCode).name,
      icon: getShipmentType(shipmentTypeCode).icon,
    },
  });
}
```

---

## 7. Panel OPS — Configuración de ShipmentTypes ✅ IMPLEMENTADO

**Estado**: Completamente implementado vía MoovyConfig (JSON en tabla key-value).

El panel OPS ahora incluye 8 tabs con configuración completa:
- **Global**: Timeouts, comisiones, distancia máx, intentos asignación
- **Paquetes**: Categorías de paquete con dimensiones y vehículos
- **Tipos de Envío**: SLA, prioridad, recargos, vehículos, flags de equipamiento
- **Vehículos**: Velocidades promedio por tipo
- **Prioridad**: Parámetros de la cola de asignación
- **ETA**: Parámetros del calculador de tiempo estimado
- **SLA en Vivo**: Dashboard en tiempo real con pedidos activos
- **Tarifas**: DeliveryRate + tarifas fallback

Todos los campos tienen botón (i) con explicación detallada.

**Nota**: Cuando se agregue el modelo `ShipmentType` en Prisma (punto 1),
se podrá migrar de MoovyConfig a tablas dedicadas sin cambios en la UI.

---

## Resumen de archivos a modificar

| Archivo | Tipo de cambio | Prioridad |
|---------|---------------|-----------|
| `prisma/schema.prisma` | Modelo ShipmentType + campo en Order | P0 |
| `src/app/api/orders/route.ts` | Validación server-side deliveryFee | P0 |
| `src/app/api/auth/register/driver/route.ts` | Normalizar vehicleType | P1 |
| `prisma/schema.prisma` (Driver) | Campos equipamiento | P1 |
| `src/app/api/delivery/calculate/route.ts` | Nuevo endpoint | P1 |
| `src/app/ops/.../configuracion-logistica` | UI de ShipmentTypes | ✅ HECHO |

---

## Dependencias de los nuevos módulos

```
shipment-types.ts       ← sin dependencias externas (constantes puras)
vehicle-type-mapping.ts ← sin dependencias externas (constantes puras)
shipping-cost-calculator.ts ← depende de shipment-types.ts
order-priority.ts       ← depende de shipment-types.ts
eta-calculator.ts       ← depende de vehicle-type-mapping.ts, shipment-types.ts
assignment-engine.ts    ← importa todo lo anterior (ya modificado)
geo.ts                  ← importa vehicle-type-mapping.ts (ya modificado)
```

Ningún módulo nuevo depende de Prisma directamente (excepto `logistics-config.ts` que lee/escribe MoovyConfig).

**Módulos nuevos agregados en esta fase:**
- `src/lib/logistics-config.ts` — Loaders/writers centralizados + info texts
- `src/app/api/ops/config/shipment-types/route.ts` — CRUD ShipmentTypes config
- `src/app/api/ops/config/vehicle-speeds/route.ts` — CRUD velocidades
- `src/app/api/ops/config/priority-queue/route.ts` — CRUD prioridad cola
- `src/app/api/ops/config/eta-calculator/route.ts` — CRUD ETA config
- `src/app/api/ops/config/shipping-defaults/route.ts` — CRUD tarifas fallback
- `src/app/api/ops/logistics/sla-dashboard/route.ts` — Dashboard SLA en vivo

**Módulos modificados:**
- `src/lib/order-priority.ts` — Acepta `PriorityConfigOverrides` opcional
- `src/lib/eta-calculator.ts` — Acepta `ETAConfigOverrides` opcional
- `src/app/ops/(protected)/configuracion-logistica/page.tsx` — Reescrito completo (8 tabs)
