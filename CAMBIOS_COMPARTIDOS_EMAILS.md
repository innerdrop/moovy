# Cambios en archivos compartidos necesarios para integrar emails P0

> **Este archivo documenta los cambios que se deben hacer en archivos fuera del módulo de emails**
> para conectar las funciones de email con sus triggers en las rutas API.
>
> Los archivos de email creados son:
> - `src/lib/email.ts` — Refactorizado: layout helper, fixes (logo, link /rider)
> - `src/lib/email-p0.ts` — 23 funciones nuevas P0
> - `src/lib/email-registry.ts` — Registro + preview para panel OPS
> - `src/app/api/ops/emails/preview/route.ts` — API de preview
> - `src/app/ops/(protected)/emails/page.tsx` — Panel OPS de gestión de emails

---

## 1. Onboarding Comercio

### #6 — Solicitud de comercio recibida
**Archivo:** `src/app/api/auth/register/merchant/route.ts`
**Dónde:** Después de crear el merchant exitosamente (antes del return)
```typescript
import { sendMerchantRequestReceivedEmail } from "@/lib/email-p0";

// Después de crear merchant...
sendMerchantRequestReceivedEmail({
    email: merchantUser.email,
    businessName: body.businessName,
    contactName: body.contactName || merchantUser.name || "",
}).catch(console.error);
```

### #9 — Tienda aprobada
**Archivo:** `src/app/api/admin/merchants/[id]/route.ts` (o el endpoint que verifica comercios)
**Dónde:** Cuando se cambia `isVerified` a `true`
```typescript
import { sendMerchantApprovedEmail } from "@/lib/email-p0";

// Después de verificar...
sendMerchantApprovedEmail({
    email: merchant.user.email,
    businessName: merchant.businessName,
    contactName: merchant.user.name || "",
}).catch(console.error);
```

### #10 — Tienda rechazada
**Archivo:** `src/app/api/admin/merchants/[id]/route.ts`
**Dónde:** Cuando se rechaza un comercio
```typescript
import { sendMerchantRejectedEmail } from "@/lib/email-p0";

sendMerchantRejectedEmail({
    email: merchant.user.email,
    businessName: merchant.businessName,
    contactName: merchant.user.name || "",
    reason: body.rejectionReason || undefined,
}).catch(console.error);
```

---

## 2. Onboarding Repartidor

### #14 — Solicitud de repartidor recibida (al repartidor)
**Archivo:** `src/app/api/auth/activate-driver/route.ts`
**Dónde:** Después de `sendDriverRequestNotification()` (línea ~39)
```typescript
import { sendDriverRequestReceivedEmail } from "@/lib/email-p0";

// Después de notificar al admin, también notificar al repartidor
sendDriverRequestReceivedEmail({
    email: user.email,
    driverName: user.name || "",
    vehicleType: body.vehicleType,
}).catch(console.error);
```

### #18 — Repartidor rechazado
**Archivo:** Crear `src/app/api/admin/drivers/[id]/reject/route.ts` o agregar lógica en el endpoint existente
```typescript
import { sendDriverRejectedEmail } from "@/lib/email-p0";

sendDriverRejectedEmail({
    email: driver.user.email,
    driverName: driver.user.name || "",
    reason: body.rejectionReason || undefined,
}).catch(console.error);
```

---

## 3. Ciclo de Vida del Pedido (Comprador)

### #34 — Pago pendiente
**Archivo:** `src/app/api/webhooks/mercadopago/route.ts`
**Dónde:** Cuando `payment.status === "in_process"` o `"pending"`
```typescript
import { sendPaymentPendingEmail } from "@/lib/email-p0";

sendPaymentPendingEmail({
    email: order.user.email,
    customerName: order.user.name || "",
    orderNumber: order.orderNumber,
    total: order.total,
    paymentMethod: "MercadoPago",
}).catch(console.error);
```

### #35 — Pago rechazado
**Archivo:** `src/app/api/webhooks/mercadopago/route.ts`
**Dónde:** Cuando `payment.status === "rejected"`
```typescript
import { sendPaymentRejectedEmail } from "@/lib/email-p0";

sendPaymentRejectedEmail({
    email: order.user.email,
    customerName: order.user.name || "",
    orderNumber: order.orderNumber,
    total: order.total,
    reason: payment.status_detail || undefined,
}).catch(console.error);
```

### #37 — Pedido rechazado por comercio
**Archivo:** Endpoint donde el comercio rechaza (e.g., `/api/orders/[id]/reject` o `/api/merchant/orders/[id]/reject`)
```typescript
import { sendOrderRejectedByMerchantEmail } from "@/lib/email-p0";

sendOrderRejectedByMerchantEmail({
    email: order.user.email,
    customerName: order.user.name || "",
    orderNumber: order.orderNumber,
    merchantName: order.merchant.businessName,
    reason: body.reason || undefined,
    willRefund: order.paymentMethod !== "cash",
    total: order.total,
}).catch(console.error);
```

### #41 — Pedido entregado
**Archivo:** `src/app/api/driver/status/route.ts` (o donde se marca DELIVERED)
**Dónde:** Cuando `status === "DELIVERED"`
```typescript
import { sendOrderDeliveredEmail } from "@/lib/email-p0";

sendOrderDeliveredEmail({
    email: order.user.email,
    customerName: order.user.name || "",
    orderNumber: order.orderNumber,
    total: order.total,
    deliveryTime: `${Math.round((Date.now() - order.createdAt.getTime()) / 60000)} minutos`,
}).catch(console.error);
```

### #42 — Pedido cancelado por comprador
**Archivo:** Endpoint de cancelación por comprador (e.g., `/api/orders/[id]/cancel`)
```typescript
import { sendOrderCancelledByBuyerEmail } from "@/lib/email-p0";

sendOrderCancelledByBuyerEmail({
    email: order.user.email,
    customerName: order.user.name || "",
    orderNumber: order.orderNumber,
    total: order.total,
    willRefund: order.paymentMethod !== "cash",
    paymentMethod: order.paymentMethod,
}).catch(console.error);
```

### #43 — Pedido cancelado por comercio
**Archivo:** Endpoint donde comercio cancela un pedido
```typescript
import { sendOrderCancelledByMerchantEmail } from "@/lib/email-p0";

sendOrderCancelledByMerchantEmail({
    email: order.user.email,
    customerName: order.user.name || "",
    orderNumber: order.orderNumber,
    merchantName: order.merchant.businessName,
    total: order.total,
    reason: body.reason || undefined,
    willRefund: order.paymentMethod !== "cash",
}).catch(console.error);
```

### #44 — Pedido cancelado por sistema
**Archivo:** `src/app/api/cron/merchant-timeout/route.ts` y/o `src/lib/assignment-engine.ts`
**Dónde:** Cuando el cron cancela por timeout
```typescript
import { sendOrderCancelledBySystemEmail } from "@/lib/email-p0";

sendOrderCancelledBySystemEmail({
    email: order.user.email,
    customerName: order.user.name || "",
    orderNumber: order.orderNumber,
    total: order.total,
    reason: "El comercio no respondió dentro del tiempo límite.",
    willRefund: order.paymentMethod !== "cash",
}).catch(console.error);
```

### #45 — Reembolso procesado
**Archivo:** `src/app/api/ops/refund/route.ts`
**Dónde:** Después de marcar `paymentStatus: "REFUNDED"` exitosamente
```typescript
import { sendRefundProcessedEmail } from "@/lib/email-p0";

sendRefundProcessedEmail({
    email: order.user.email,
    customerName: order.user.name || "",
    orderNumber: order.orderNumber,
    refundAmount: body.amount || order.total,
    reason: body.reason || undefined,
    paymentMethod: order.paymentMethod,
}).catch(console.error);
```

---

## 4. Ciclo de Vida del Pedido (Comercio)

### #51 — Nuevo pedido recibido
**Archivo:** `src/app/api/orders/route.ts`
**Dónde:** Después de crear la orden exitosamente (junto con el socket emit)
```typescript
import { sendMerchantNewOrderEmail } from "@/lib/email-p0";

sendMerchantNewOrderEmail({
    email: merchant.user.email || merchant.email,
    merchantName: merchant.businessName,
    orderNumber: order.orderNumber,
    customerName: session.user.name || "",
    total: order.total,
    itemCount: orderItems.length,
    isPickup: body.isPickup || false,
}).catch(console.error);
```

### #52 — Recordatorio pedido sin aceptar
**Archivo:** `src/app/api/cron/merchant-timeout/route.ts`
**Dónde:** Antes de cancelar, cuando el pedido lleva X minutos sin respuesta (agregar un check intermedio)
```typescript
import { sendMerchantOrderReminderEmail } from "@/lib/email-p0";

// Si lleva más de la mitad del timeout, enviar recordatorio (una sola vez)
if (minutesSinceOrder > timeoutMinutes / 2 && !order.reminderSent) {
    sendMerchantOrderReminderEmail({
        email: merchant.user.email,
        merchantName: merchant.businessName,
        orderNumber: order.orderNumber,
        minutesSinceOrder,
        timeoutMinutes,
    }).catch(console.error);
    // NOTA: necesita campo `reminderSent` en Order para evitar duplicados (ver schema changes abajo)
}
```

### #76 — Pago recibido (comercio)
**Archivo:** `src/app/api/webhooks/mercadopago/route.ts` y/o `src/app/api/orders/route.ts` (para cash)
**Dónde:** Cuando se confirma el pago
```typescript
import { sendMerchantPaymentReceivedEmail } from "@/lib/email-p0";

sendMerchantPaymentReceivedEmail({
    email: merchant.user.email,
    merchantName: merchant.businessName,
    orderNumber: order.orderNumber,
    amount: subOrder.total,
    commission: subOrder.commission,
    netAmount: subOrder.total - subOrder.commission,
    paymentMethod: order.paymentMethod,
}).catch(console.error);
```

---

## 5. Moderación

### #102 — Tienda suspendida
**Archivo:** `src/app/api/admin/merchants/[id]/route.ts`
**Dónde:** Cuando se cambia `isActive` a `false` (suspensión)
```typescript
import { sendMerchantSuspendedEmail } from "@/lib/email-p0";

sendMerchantSuspendedEmail({
    email: merchant.user.email,
    businessName: merchant.businessName,
    contactName: merchant.user.name || "",
    reason: body.suspensionReason || undefined,
}).catch(console.error);
```

### #109 — Cuenta repartidor suspendida
**Archivo:** Endpoint donde se suspende un repartidor desde OPS
```typescript
import { sendDriverSuspendedEmail } from "@/lib/email-p0";

sendDriverSuspendedEmail({
    email: driver.user.email,
    driverName: driver.user.name || "",
    reason: body.suspensionReason || undefined,
}).catch(console.error);
```

---

## 6. Eliminación de Cuenta

### #114 + #174 — Solicitud de eliminación (al usuario + al owner)
**Archivo:** `src/app/api/profile/delete/route.ts`
**Dónde:** Después de marcar la eliminación
```typescript
import { sendAccountDeletionRequestEmail, sendOwnerDataDeletionRequestEmail } from "@/lib/email-p0";

// Al usuario
sendAccountDeletionRequestEmail({
    email: user.email,
    userName: user.name || "",
    deletionDate: deletionDate.toLocaleDateString('es-AR'),
}).catch(console.error);

// Al owner (compliance)
sendOwnerDataDeletionRequestEmail({
    userName: user.name || "",
    userEmail: user.email,
    userId: user.id,
    requestDate: new Date().toLocaleDateString('es-AR'),
    roles: userRoles.map(r => r.role),
}).catch(console.error);
```

### #115 — Cuenta eliminada
**Archivo:** Proceso de eliminación final (cron o inmediato)
```typescript
import { sendAccountDeletedEmail } from "@/lib/email-p0";

sendAccountDeletedEmail({
    email: user.email,
    userName: user.name || "",
}).catch(console.error);
```

---

## 7. Alertas Owner

### #135/#136/#137/#145 — Alertas críticas
**Archivos posibles:**
- `src/app/api/health/route.ts` — para #145 servidor caído
- `src/app/api/webhooks/mercadopago/route.ts` — para #135/#136 pasarela/webhooks
- Donde se detecte falla de split — para #137

```typescript
import { sendOwnerCriticalAlertEmail } from "@/lib/email-p0";

// Ejemplo: pasarela caída
sendOwnerCriticalAlertEmail({
    alertType: 'payment_gateway_down',
    title: 'Pasarela de pagos no responde',
    description: 'La API de MercadoPago no está respondiendo. Los pagos con tarjeta están fallando.',
    details: `Error: ${error.message}\nEndpoint: ${url}\nFallas consecutivas: ${failCount}`,
    severity: 'critical',
}).catch(console.error);
```

### #161 — Pedidos sin repartidor
**Archivo:** `src/app/api/cron/assignment-tick/route.ts` o nuevo cron dedicado
```typescript
import { sendOwnerUnassignedOrdersEmail } from "@/lib/email-p0";

if (unassignedOrders.length > 0) {
    sendOwnerUnassignedOrdersEmail({
        unassignedCount: unassignedOrders.length,
        oldestOrderMinutes: Math.round((Date.now() - oldestOrder.createdAt.getTime()) / 60000),
        orderNumbers: unassignedOrders.map(o => o.orderNumber),
    }).catch(console.error);
}
```

### #167 — Reporte diario
**Archivo:** Crear `src/app/api/cron/daily-report/route.ts` (nuevo cron)
```typescript
import { sendOwnerDailyReportEmail } from "@/lib/email-p0";

sendOwnerDailyReportEmail({
    date: new Date().toLocaleDateString('es-AR'),
    totalOrders,
    completedOrders,
    cancelledOrders,
    totalRevenue,
    totalCommission,
    newUsers,
    newMerchants,
    newDrivers,
    avgDeliveryTime,
    topMerchant: topMerchant ? { name: topMerchant.businessName, orders: topMerchant._count.orders } : undefined,
}).catch(console.error);
```

---

## 8. Cambios en el Sidebar de OPS

### Agregar link "Emails" en OpsSidebar
**Archivo:** `src/components/ops/OpsSidebar.tsx`
**Dónde:** En la sección "Sistema" (junto a Backups, Configuración, etc.)
```tsx
<Link href="/ops/emails">
    <span>📧</span> Emails
</Link>
```

---

## 9. Variables de entorno nuevas

Agregar a `.env` y `.env.example`:
```env
# Email del owner para alertas críticas (default: ADMIN_EMAIL)
OWNER_EMAIL=maurod@me.com
```

---

## 10. Cambios opcionales en el schema (Prisma)

Para el #52 (recordatorio sin duplicar), se necesitaría:
```prisma
model Order {
    // ...campos existentes...
    emailReminderSentAt DateTime? // Para evitar enviar recordatorio duplicado
}
```

**Ejecutar** `npx prisma db push` después de agregar este campo.

---

## Resumen de archivos que requieren cambios

| Archivo compartido | Emails a conectar | Cambio necesario |
|---|---|---|
| `src/app/api/auth/register/merchant/route.ts` | #6 | Agregar import + llamada |
| `src/app/api/auth/activate-driver/route.ts` | #14 | Agregar import + llamada |
| `src/app/api/admin/merchants/[id]/route.ts` | #9, #10, #102 | Agregar imports + llamadas condicionales |
| `src/app/api/admin/drivers/[id]/approve/route.ts` | (ya existe) | — |
| `src/app/api/webhooks/mercadopago/route.ts` | #34, #35, #76 | Agregar imports + llamadas por status |
| `src/app/api/orders/route.ts` | #51 | Agregar import + llamada |
| `src/app/api/cron/merchant-timeout/route.ts` | #44, #52 | Agregar imports + llamadas |
| `src/app/api/ops/refund/route.ts` | #45 | Agregar import + llamada |
| `src/app/api/driver/status/route.ts` (o equiv.) | #41 | Agregar import + llamada |
| `src/app/api/profile/delete/route.ts` | #114, #174 | Agregar imports + llamadas |
| `src/app/api/health/route.ts` | #135, #145 | Agregar imports + llamadas |
| `src/app/api/cron/assignment-tick/route.ts` | #161 | Agregar import + llamada |
| `src/components/ops/OpsSidebar.tsx` | — | Link "Emails" |
| `.env` / `.env.example` | — | `OWNER_EMAIL` |
| `prisma/schema.prisma` | #52 | Campo `emailReminderSentAt` (opcional) |

---

*Generado el 20 de marzo de 2026*
