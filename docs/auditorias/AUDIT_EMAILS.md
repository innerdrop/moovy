# Auditoría Completa del Sistema de Emails — MOOVY

**Fecha**: 20 de marzo de 2026
**Alcance**: 180 emails analizados en 13 categorías
**Proyecto**: Moovy — Marketplace + Delivery (Ushuaia, Tierra del Fuego)

---

## ENTREGABLE 1 — Inventario Cruzado de Emails

### Estado actual del sistema

**Emails implementados: 8 de 180 (4.4%)**

| Email implementado | Función | Archivo | Línea | Trigger |
|---|---|---|---|---|
| Bienvenida comprador | `sendWelcomeEmail()` | `src/lib/email.ts` | L19 | POST `/api/auth/register` (L152) |
| Confirmación de pedido (cash) | `sendOrderConfirmationEmail()` | `src/lib/email.ts` | L73 | POST `/api/orders` (L507-519) |
| Confirmación de pedido (MP) | `sendOrderConfirmationEmail()` | `src/lib/email.ts` | L73 | Webhook MP approved (L187-199) |
| Reset de contraseña | `sendPasswordResetEmail()` | `src/lib/email.ts` | L190 | POST `/api/auth/forgot-password` (L50) |
| Contraseña cambiada | Inline transporter | `src/app/api/auth/change-password/route.ts` | L95 | POST `/api/auth/change-password` |
| Solicitud repartidor (→ admin) | `sendDriverRequestNotification()` | `src/lib/email.ts` | L233 | POST `/api/auth/activate-driver` (L39) |
| Repartidor aprobado | `sendDriverApprovalEmail()` | `src/lib/email.ts` | L273 | PUT `/api/admin/drivers/[id]/approve` (L53) |
| MOOVY X interés (→ prospecto + admin) | Inline transporter | `src/app/api/moovyx/register/route.ts` | L27-87 | POST `/api/moovyx/register` |

---

### Inventario completo: 180 emails × estado

#### CATEGORÍA 1 — Registro y Onboarding

**1.1 — Comprador**

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 1 | Bienvenida | ✅ Implementado | `src/lib/email.ts` L19 | HTML inline, responsive, con código referido | POST `/api/auth/register` éxito | P0 |
| 2 | Verificación de email | ❌ Falta | — | — | No existe verificación de email | P1 |
| 3 | Verificación de teléfono | ❌ Falta | — | — | No existe verificación de teléfono | P2 |
| 4 | Perfil completado | ❌ Falta | — | — | — | P3 |
| 5 | Primera compra incentivo | ❌ Falta | — | — | — | P2 |

**1.2 — Comercio / Vendedor**

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 6 | Solicitud recibida | ❌ Falta | — | — | POST `/api/auth/register/merchant` no envía email al comercio | P0 |
| 7 | Verificación de email comercio | ❌ Falta | — | — | — | P1 |
| 8 | Documentación pendiente | ❌ Falta | — | — | — | P1 |
| 9 | Tienda aprobada | ❌ Falta | — | — | El admin verifica desde OPS pero no se envía email | P0 |
| 10 | Tienda rechazada | ❌ Falta | — | — | — | P0 |
| 11 | Bienvenida + onboarding | ❌ Falta | — | — | — | P1 |
| 12 | Vinculación MercadoPago | ❌ Falta | — | — | — | P2 |
| 13 | Datos bancarios confirmados | ❌ Falta | — | — | — | P2 |

**1.3 — Repartidor**

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 14 | Solicitud recibida | ⚠️ Parcial | `src/lib/email.ts` L233 | Solo notifica al ADMIN, NO al repartidor | POST `/api/auth/activate-driver` | P0 |
| 15 | Verificación de email | ❌ Falta | — | — | — | P1 |
| 16 | Documentación pendiente | ❌ Falta | — | — | — | P1 |
| 17 | Aprobado como repartidor | ✅ Implementado | `src/lib/email.ts` L273 | HTML con CTA al panel rider | PUT `/api/admin/drivers/[id]/approve` | P0 |
| 18 | Rechazado como repartidor | ❌ Falta | — | — | — | P0 |
| 19 | Bienvenida + onboarding | ❌ Falta | — | — | — | P1 |

---

#### CATEGORÍA 2 — Autenticación y Seguridad

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 20 | Recuperar contraseña | ✅ Implementado | `src/lib/email.ts` L190 | Link con token 1h expiración | POST `/api/auth/forgot-password` | P0 |
| 21 | Contraseña cambiada | ✅ Implementado | `change-password/route.ts` L95 | HTML con fecha/hora y alerta "¿No fuiste vos?" | POST `/api/auth/change-password` éxito | P0 |
| 22 | Email cambiado | ❌ Falta | — | — | — | P1 |
| 23 | Teléfono cambiado | ❌ Falta | — | — | — | P2 |
| 24 | Login desde nuevo dispositivo | ❌ Falta | — | — | — | P1 |
| 25 | Intentos de login fallidos | ❌ Falta | — | — | — | P2 |
| 26 | Cuenta bloqueada | ❌ Falta | — | — | — | P1 |
| 27 | Cuenta desbloqueada | ❌ Falta | — | — | — | P2 |
| 28 | MFA/2FA activado | ❌ Falta | — | — | No existe 2FA en el sistema | P3 |
| 29 | MFA/2FA desactivado | ❌ Falta | — | — | — | P3 |
| 30 | Sesiones cerradas | ❌ Falta | — | — | — | P3 |
| 31 | Datos personales actualizados | ❌ Falta | — | — | — | P3 |

---

#### CATEGORÍA 3 — Ciclo de Vida del Pedido (Comprador)

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 32 | Pedido confirmado | ✅ Implementado | `src/lib/email.ts` L73 | HTML itemizado con precios, dirección, método de pago | POST `/api/orders` (cash) + webhook MP (approved) | P0 |
| 33 | Pago aprobado | ⚠️ Parcial | — | Se fusiona con #32 (confirmación = pago OK). No hay email separado para "pago aprobado" | — | P1 |
| 34 | Pago pendiente | ❌ Falta | — | — | — | P0 |
| 35 | Pago rechazado | ❌ Falta | — | — | Webhook MP con status rejected no envía email | P0 |
| 36 | Pedido aceptado por comercio | ❌ Falta | — | — | Socket emit existe pero no email | P1 |
| 37 | Pedido rechazado por comercio | ❌ Falta | — | — | — | P0 |
| 38 | Pedido en preparación | ❌ Falta | — | — | Solo push notification | P2 |
| 39 | Repartidor asignado | ❌ Falta | — | — | Solo push notification | P2 |
| 40 | Pedido en camino | ❌ Falta | — | — | Solo push notification | P1 |
| 41 | Pedido entregado | ❌ Falta | — | — | Solo push notification | P0 |
| 42 | Pedido cancelado por comprador | ❌ Falta | — | — | — | P0 |
| 43 | Pedido cancelado por comercio | ❌ Falta | — | — | — | P0 |
| 44 | Pedido cancelado por sistema | ❌ Falta | — | — | merchant-timeout existe pero no envía email | P0 |
| 45 | Reembolso procesado | ❌ Falta | — | — | POST `/api/ops/refund` no envía email | P0 |
| 46 | Reembolso parcial | ❌ Falta | — | — | — | P1 |
| 47 | Pedido con problema reportado | ❌ Falta | — | — | — | P1 |
| 48 | Problema resuelto | ❌ Falta | — | — | — | P1 |
| 49 | Calificación recordatorio | ❌ Falta | — | — | — | P2 |
| 50 | Comprobante / factura | ❌ Falta | — | — | — | P1 |

---

#### CATEGORÍA 4 — Ciclo de Vida del Pedido (Comercio)

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 51 | Nuevo pedido recibido | ❌ Falta | — | — | Solo push notification vía socket | P0 |
| 52 | Recordatorio pedido sin aceptar | ❌ Falta | — | — | merchant-timeout cancela pero no notifica por email | P0 |
| 53 | Pedido cancelado (comprador) | ❌ Falta | — | — | — | P1 |
| 54 | Pedido cancelado (sistema) | ❌ Falta | — | — | — | P1 |
| 55 | Repartidor asignado al pedido | ❌ Falta | — | — | — | P2 |
| 56 | Pedido retirado por repartidor | ❌ Falta | — | — | — | P2 |
| 57 | Pedido entregado | ❌ Falta | — | — | — | P1 |
| 58 | Reclamo de comprador | ❌ Falta | — | — | — | P1 |
| 59 | Reclamo resuelto | ❌ Falta | — | — | — | P2 |
| 60 | Calificación recibida | ❌ Falta | — | — | POST rate-merchant no envía email | P2 |
| 61 | Calificación negativa alerta | ❌ Falta | — | — | — | P2 |

---

#### CATEGORÍA 5 — Ciclo de Vida del Pedido (Repartidor)

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 62 | Pedido asignado | ❌ Falta | — | — | Solo push notification | P1 |
| 63 | Pedido reasignado | ❌ Falta | — | — | — | P2 |
| 64 | Pedido cancelado | ❌ Falta | — | — | — | P1 |
| 65 | Entrega confirmada | ❌ Falta | — | — | — | P2 |
| 66 | Propina recibida | ❌ Falta | — | — | — | P3 |
| 67 | Calificación recibida | ❌ Falta | — | — | — | P3 |
| 68 | Calificación negativa alerta | ❌ Falta | — | — | — | P3 |

---

#### CATEGORÍA 6 — Emails Financieros (Comprador)

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 69 | Resumen de compra | ⚠️ Parcial | — | El email #32 incluye desglose, pero no es un comprobante formal post-entrega | — | P1 |
| 70 | Método de pago agregado | ❌ Falta | — | — | — | P3 |
| 71 | Método de pago eliminado | ❌ Falta | — | — | — | P3 |
| 72 | Transferencia pendiente recordatorio | ❌ Falta | — | — | — | P1 |
| 73 | Transferencia confirmada | ❌ Falta | — | — | — | P1 |
| 74 | Cupón recibido | ❌ Falta | — | — | No existe sistema de cupones | P2 |
| 75 | Cupón por vencer | ❌ Falta | — | — | — | P3 |

---

#### CATEGORÍA 7 — Emails Financieros (Comercio)

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 76 | Pago recibido (por pedido) | ❌ Falta | — | — | El comercio cobra instantáneamente pero no recibe email | P0 |
| 77 | Resumen diario de ventas | ❌ Falta | — | — | — | P1 |
| 78 | Resumen semanal de ventas | ❌ Falta | — | — | — | P2 |
| 79 | Resumen mensual + facturación | ❌ Falta | — | — | — | P1 |
| 80 | Factura de comisión Moovy | ❌ Falta | — | — | — | P2 |
| 81 | Cambio en tasa de comisión | ❌ Falta | — | — | — | P1 |
| 82 | Problema con cuenta de MP | ❌ Falta | — | — | — | P0 |
| 83 | Problema con CBU/CVU | ❌ Falta | — | — | — | P1 |
| 84 | Contracargo recibido | ❌ Falta | — | — | — | P1 |
| 85 | Contracargo resuelto | ❌ Falta | — | — | — | P2 |
| 86 | Rendición de efectivo pendiente | ❌ Falta | — | — | — | P2 |

---

#### CATEGORÍA 8 — Emails Financieros (Repartidor)

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 87 | Resumen diario de ganancias | ❌ Falta | — | — | — | P2 |
| 88 | Resumen semanal | ❌ Falta | — | — | — | P2 |
| 89 | Liquidación / pago procesado | ❌ Falta | — | — | — | P1 |
| 90 | Retiro solicitado | ❌ Falta | — | — | — | P2 |
| 91 | Retiro procesado | ❌ Falta | — | — | — | P2 |
| 92 | Retiro rechazado | ❌ Falta | — | — | — | P2 |
| 93 | Efectivo pendiente de rendir | ❌ Falta | — | — | — | P1 |
| 94 | Rendición de efectivo confirmada | ❌ Falta | — | — | — | P2 |
| 95 | Alerta efectivo acumulado alto | ❌ Falta | — | — | — | P1 |
| 96 | Deuda neteada | ❌ Falta | — | — | — | P2 |

---

#### CATEGORÍA 9 — Gestión de Tienda (Comercio)

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 97 | Producto aprobado | ❌ Falta | — | — | — | P2 |
| 98 | Producto rechazado | ❌ Falta | — | — | — | P2 |
| 99 | Producto con stock bajo | ❌ Falta | — | — | — | P2 |
| 100 | Producto sin stock | ❌ Falta | — | — | — | P1 |
| 101 | Tienda pausada por inactividad | ❌ Falta | — | — | — | P2 |
| 102 | Tienda suspendida | ❌ Falta | — | — | OPS puede suspender pero no envía email | P0 |
| 103 | Tienda reactivada | ❌ Falta | — | — | — | P1 |
| 104 | Horario de atención actualizado | ❌ Falta | — | — | — | P3 |
| 105 | Zona de delivery modificada | ❌ Falta | — | — | — | P3 |

---

#### CATEGORÍA 10 — Gestión de Cuenta del Repartidor

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 106 | Documentación por vencer | ❌ Falta | — | — | No hay tracking de vencimiento | P1 |
| 107 | Documentación vencida | ❌ Falta | — | — | — | P1 |
| 108 | Documentación actualizada | ❌ Falta | — | — | — | P2 |
| 109 | Cuenta suspendida | ❌ Falta | — | — | — | P0 |
| 110 | Cuenta reactivada | ❌ Falta | — | — | — | P1 |
| 111 | Zona/horario actualizado | ❌ Falta | — | — | — | P3 |
| 112 | Nivel/categoría alcanzado | ❌ Falta | — | — | Niveles MOOVER existen pero no notifican | P2 |
| 113 | Bono o incentivo ganado | ❌ Falta | — | — | — | P3 |

---

#### CATEGORÍA 11 — Administrativos y de Sistema

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 114 | Solicitud eliminación de cuenta | ❌ Falta | — | — | POST `/api/profile/delete` existe pero no envía email | P0 |
| 115 | Cuenta eliminada | ❌ Falta | — | — | — | P0 |
| 116 | Cambios en TyC | ❌ Falta | — | — | — | P1 |
| 117 | Cambios en política privacidad | ❌ Falta | — | — | — | P1 |
| 118 | Mantenimiento programado | ❌ Falta | — | — | — | P2 |
| 119 | Incidente resuelto | ❌ Falta | — | — | — | P2 |

---

#### CATEGORÍA 12 — Engagement y Retención

**Comprador**

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 120 | Carrito abandonado | ❌ Falta | — | — | Carrito es Zustand client-side, no persiste en server | P2 |
| 121 | Win-back 15 días | ❌ Falta | — | — | — | P2 |
| 122 | Win-back 30 días | ❌ Falta | — | — | — | P3 |
| 123 | Nuevo comercio en tu zona | ❌ Falta | — | — | — | P3 |
| 124 | Promo comercio favorito | ❌ Falta | — | — | — | P3 |
| 125 | Cumpleaños | ❌ Falta | — | — | No se guarda fecha de nacimiento | P3 |
| 126 | Aniversario en la plataforma | ❌ Falta | — | — | — | P3 |
| 127 | Pedido recurrente sugerido | ❌ Falta | — | — | — | P3 |

**Comercio**

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 128 | Tips para vender más | ❌ Falta | — | — | — | P3 |
| 129 | Estadísticas mensuales | ❌ Falta | — | — | — | P2 |
| 130 | Oportunidad de promoción | ❌ Falta | — | — | — | P3 |
| 131 | Inactividad del comercio | ❌ Falta | — | — | — | P2 |

**Repartidor**

| # | Email | Estado | Archivo | Template | Trigger | Prioridad |
|---|---|---|---|---|---|---|
| 132 | Resumen desempeño semanal | ❌ Falta | — | — | — | P2 |
| 133 | Zona con alta demanda | ❌ Falta | — | — | — | P3 |
| 134 | Incentivo activo | ❌ Falta | — | — | — | P3 |

---

#### CATEGORÍA 13 — Emails para el Owner de MOOVY

**13.1 — Alertas financieras críticas**

| # | Email | Estado | Prioridad |
|---|---|---|---|
| 135 | Pasarela de pagos caída | ❌ Falta | P0 |
| 136 | Webhooks no se reciben | ❌ Falta | P0 |
| 137 | Split de pago falló al comercio | ❌ Falta | P0 |
| 138 | Contracargo recibido | ❌ Falta | P1 |
| 139 | Reembolsos inusuales | ❌ Falta | P1 |
| 140 | Repartidor con efectivo alto | ❌ Falta | P1 |
| 141 | Efectivo global sin rendir | ❌ Falta | P2 |
| 142 | Liquidación a repartidor falló | ❌ Falta | P1 |
| 143 | Facturación AFIP falló | ❌ Falta | P2 |
| 144 | Ingresos diarios anómalos | ❌ Falta | P2 |

**13.2 — Alertas de seguridad y sistema**

| # | Email | Estado | Prioridad |
|---|---|---|---|
| 145 | Servidor caído | ❌ Falta | P0 |
| 146 | Tasa de errores HTTP alta | ❌ Falta | P1 |
| 147 | Base de datos en riesgo | ❌ Falta | P1 |
| 148 | Intentos acceso panel admin | ❌ Falta | P1 |
| 149 | Posible fraude de usuario | ❌ Falta | P1 |
| 150 | Creación masiva de cuentas | ❌ Falta | P2 |
| 151 | Scraping detectado | ❌ Falta | P3 |
| 152 | Certificado SSL por vencer | ❌ Falta | P2 |
| 153 | Vulnerabilidad en dependencia | ❌ Falta | P2 |
| 154 | Backup falló | ❌ Falta | P1 |
| 155 | Datos sensibles en logs | ❌ Falta | P1 |

**13.3 — Alertas operativas del negocio**

| # | Email | Estado | Prioridad |
|---|---|---|---|
| 156 | Nuevo comercio solicita registro | ❌ Falta | P1 |
| 157 | Nuevo repartidor solicita registro | ⚠️ Parcial — notifica al admin pero sin link directo de acción | P1 |
| 158 | Comercio con calificación en caída | ❌ Falta | P2 |
| 159 | Repartidor con calificación en caída | ❌ Falta | P2 |
| 160 | Reclamos sin responder | ❌ Falta | P1 |
| 161 | Pedidos sin repartidor | ❌ Falta | P0 |
| 162 | Zona sin cobertura | ❌ Falta | P1 |
| 163 | Comercio no responde pedidos | ❌ Falta | P1 |
| 164 | Comercio con alta tasa de rechazo | ❌ Falta | P2 |
| 165 | Delivery demorado sistémico | ❌ Falta | P2 |
| 166 | Primer pedido comercio nuevo | ❌ Falta | P3 |

**13.4 — Reportes periódicos ejecutivos**

| # | Email | Estado | Prioridad |
|---|---|---|---|
| 167 | Reporte diario resumido | ❌ Falta | P0 |
| 168 | Reporte semanal de negocio | ❌ Falta | P1 |
| 169 | Reporte mensual financiero | ❌ Falta | P1 |
| 170 | Reporte mensual de crecimiento | ❌ Falta | P2 |
| 171 | Reporte de salud de la plataforma | ❌ Falta | P2 |

**13.5 — Alerts de compliance y legales**

| # | Email | Estado | Prioridad |
|---|---|---|---|
| 172 | Comercio sin datos fiscales | ❌ Falta | P1 |
| 173 | Umbral facturación AFIP | ❌ Falta | P1 |
| 174 | Solicitud eliminación de datos | ❌ Falta | P0 |
| 175 | Vencimiento de habilitaciones | ❌ Falta | P2 |
| 176 | Usuario reportó contenido ilegal | ❌ Falta | P1 |

**13.6 — Hitos y celebraciones**

| # | Email | Estado | Prioridad |
|---|---|---|---|
| 177 | Hito de pedidos | ❌ Falta | P3 |
| 178 | Hito de comercios | ❌ Falta | P3 |
| 179 | Hito de facturación | ❌ Falta | P3 |
| 180 | Récord diario de pedidos | ❌ Falta | P3 |

---

### Resumen numérico

| Estado | Cantidad | % |
|---|---|---|
| ✅ Implementado | 6 | 3.3% |
| ⚠️ Parcial | 3 | 1.7% |
| ❌ Falta | 171 | 95.0% |
| **Total** | **180** | **100%** |

Por prioridad de los faltantes:

| Prioridad | Cantidad | Descripción |
|---|---|---|
| **P0** | 27 | Obligatorios para lanzar |
| **P1** | 53 | Importantes primer mes |
| **P2** | 52 | Segundo mes |
| **P3** | 39 | Nice-to-have |

---

## ENTREGABLE 2 — Análisis de Infraestructura de Emails

### Servicio de envío

**Servicio**: Nodemailer con Gmail SMTP (smtp.gmail.com:587, TLS)

**Configuración actual** (de `.env` y `src/lib/email.ts`):
- Host: `smtp.gmail.com`
- Puerto: `587` (STARTTLS)
- Auth: Gmail App Password (16 chars)
- From: `"MOOVY" <somosmoovy@gmail.com>`

**Problemas críticos**:

1. **Gmail tiene límite de 500 emails/día** (2000 con Google Workspace). Para producción con múltiples comercios y usuarios, esto es insuficiente. Un día con 100 pedidos ya genera ~300-500 emails solo transaccionales.

2. **No es un servicio transaccional dedicado**: Gmail no ofrece estadísticas de entrega, tasas de apertura, bounce handling, ni cumple con los estándares de deliverability que requiere una plataforma de marketplace.

3. **Credenciales duplicadas**: Hay 3 instancias de `nodemailer.createTransport()` — una centralizada en `email.ts` y dos inline en `change-password/route.ts` y `moovyx/register/route.ts`. Inconsistencia de mantenimiento.

### Cola de emails (queue/worker)

**Estado: NO EXISTE**. Todos los emails se envían de forma síncrona dentro del request HTTP. Si el SMTP tarda o falla, el response del API se retrasa pero no se rompe (try-catch silencioso).

**Riesgo**: Si Gmail tiene un timeout de 30s, el usuario espera 30s adicionales en su request. Si el email falla, se pierde para siempre — nadie se entera.

### Retry automático

**Estado: NO EXISTE**. Los 8 emails implementados usan try-catch que loguea a `console.error` y sigue. Si falla, el email se pierde definitivamente. No hay dead letter queue, no hay reintento, no hay alerta.

### Logging de emails enviados

**Estado: NO EXISTE**. Solo hay `console.log("[Email] Welcome email sent to:", email)`. No hay tabla en la base de datos, no hay registro persistente. Imposible auditar si un email se envió o no, o diagnosticar quejas de usuarios.

### Tracking (apertura / clic)

**Estado: NO EXISTE**. No hay pixel de tracking ni redirección de links. Imposible medir tasas de apertura, engagement, o efectividad de los emails.

### SPF, DKIM, DMARC

**Estado: PARCIAL POR DEFECTO**. Al enviar desde `@gmail.com`, Google gestiona SPF y DKIM automáticamente. Sin embargo, si migran a un dominio propio (`@somosmoovy.com`), necesitarán configurar:
- SPF: registro TXT en DNS de somosmoovy.com
- DKIM: firma del servicio de email
- DMARC: política de rechazo

**Actualmente**: Los emails salen como `somosmoovy@gmail.com`, lo cual es aceptable para MVP pero no profesional para producción.

### Templates responsive

**Estado: SÍ, BÁSICO**. Los templates usan `max-width: 600px; margin: 0 auto` lo cual los hace razonablemente responsive. Usan inline CSS (correcto para email). Sin embargo:
- No tienen dark mode support
- No usan `<table>` para layout (algunos clientes de email no soportan `<div>` bien)
- No hay media queries para mobile
- El `grid-template-columns` en order confirmation NO funciona en Outlook

### Branding de Moovy

**Estado: SÍ, PARCIAL**. Todos los templates incluyen:
- Logo: `https://somosmoovy.com/logo-moovy.png` (NOTA: es el PNG viejo, el nuevo es SVG)
- Gradiente rojo MOOVY (`#e60012` a `#ff4d5e`)
- Footer: `© MOOVY™. Ushuaia, Tierra del Fuego.`
- Pero: el logo apunta a un PNG que está en la deuda técnica como "requiere reemplazo"

### Sistema de templates centralizado

**Estado: NO**. Cada email tiene su HTML inline embebido en la función. No hay base template compartido, no hay header/footer reutilizable, no hay sistema de layouts. Si cambia el logo o el footer, hay que editar 8+ lugares.

### Unsubscribe en emails marketing

**Estado: NO EXISTE**. Ningún email tiene link de unsubscribe. Para emails transaccionales (confirmación pedido, reset password) no es obligatorio. Pero para emails de engagement (cuando se implementen) es **obligatorio por ley** (CAN-SPAM, GDPR, Ley 25.326 Argentina).

### Preferencias de notificaciones

**Estado: PARCIAL**. El perfil del usuario tiene toggle de notificaciones push en `mi-perfil/page.tsx`, pero NO hay preferencias para emails. No existe campo `emailPreferences` en el modelo User.

---

## ENTREGABLE 3 — Lista Priorizada de Emails Faltantes

### P0 — Obligatorios para lanzar (27 emails)

Sin estos, el negocio no puede operar de forma confiable. Los usuarios quedan sin información crítica.

**Flujo de pedido (comprador) — 7 emails**:
- #34 Pago pendiente — El comprador no sabe si su pago se procesó
- #35 Pago rechazado — Sin este, el comprador piensa que pagó cuando no
- #37 Pedido rechazado por comercio — Dinero cobrado, pedido cancelado, usuario sin info
- #41 Pedido entregado — Confirmación + invitación a calificar
- #42 Pedido cancelado por comprador — Estado del reembolso
- #43 Pedido cancelado por comercio — Motivo + reembolso
- #44 Pedido cancelado por sistema — Timeout, sin repartidor
- #45 Reembolso procesado — El comprador DEBE saber que le devolvieron la plata

**Onboarding comercio — 3 emails**:
- #6 Solicitud recibida (comercio) — El comercio se registra y no recibe ningún email
- #9 Tienda aprobada — Se activa su tienda y no se entera por email
- #10 Tienda rechazada — Se rechaza y no sabe por qué

**Onboarding repartidor — 2 emails**:
- #14 Solicitud recibida (al repartidor, no solo al admin) — El repartidor no sabe si se registró bien
- #18 Rechazado como repartidor — Se rechaza y no se entera

**Comercio operativo — 2 emails**:
- #51 Nuevo pedido recibido — Email de backup si push falla o está apagado
- #76 Pago recibido (por pedido) — Diferenciador del negocio: el comercio cobra al instante y debe saberlo

**Repartidor operativo — 1 email**:
- #109 Cuenta suspendida — Sin este, el repartidor no sabe por qué no le llegan pedidos

**Comercio moderación — 1 email**:
- #102 Tienda suspendida — El comercio pierde ventas y no sabe por qué

**Administrativo — 2 emails**:
- #114 Solicitud eliminación de cuenta — Obligatorio legalmente (GDPR/Ley 25.326)
- #115 Cuenta eliminada — Confirmación legal

**Owner — 4 emails**:
- #135 Pasarela de pagos caída — Sin esto el owner no se entera que la plataforma está rota
- #136 Webhooks no se reciben — Pedidos quedan en limbo
- #137 Split de pago falló — Comercio no cobró, riesgo operativo
- #145 Servidor caído / downtime — El negocio está muerto y nadie sabe
- #161 Pedidos sin repartidor — Compradores esperando, experiencia destruida
- #167 Reporte diario resumido — Visibilidad mínima del negocio
- #174 Solicitud eliminación de datos — Plazo legal, compliance obligatorio

### P1 — Importantes primer mes (53 emails)

Mejoran confianza, seguridad y operación del día a día.

- #2 Verificación de email
- #7 Verificación email comercio
- #8 Documentación pendiente (comercio)
- #11 Bienvenida + onboarding comercio
- #15 Verificación email repartidor
- #16 Documentación pendiente (repartidor)
- #19 Bienvenida + onboarding repartidor
- #22 Email cambiado
- #24 Login nuevo dispositivo
- #26 Cuenta bloqueada
- #33 Pago aprobado (separado de confirmación)
- #36 Pedido aceptado por comercio
- #40 Pedido en camino
- #46 Reembolso parcial
- #47 Pedido con problema reportado
- #48 Problema resuelto
- #50 Comprobante / factura
- #52 Recordatorio pedido sin aceptar
- #53 Pedido cancelado por comprador (→ comercio)
- #54 Pedido cancelado por sistema (→ comercio)
- #57 Pedido entregado (→ comercio con desglose)
- #58 Reclamo de comprador (→ comercio)
- #62 Pedido asignado (→ repartidor)
- #64 Pedido cancelado (→ repartidor)
- #69 Resumen de compra formal
- #72 Transferencia pendiente recordatorio
- #73 Transferencia confirmada
- #77 Resumen diario de ventas (comercio)
- #79 Resumen mensual + facturación (comercio)
- #81 Cambio en tasa de comisión
- #82 Problema con cuenta de MP (comercio)
- #83 Problema con CBU/CVU
- #89 Liquidación / pago procesado (repartidor)
- #93 Efectivo pendiente de rendir
- #95 Alerta efectivo acumulado alto
- #100 Producto sin stock
- #103 Tienda reactivada
- #106 Documentación por vencer
- #107 Documentación vencida
- #110 Cuenta reactivada (repartidor)
- #116 Cambios en TyC
- #117 Cambios política privacidad
- #138 Contracargo recibido (owner)
- #139 Reembolsos inusuales (owner)
- #140 Repartidor con efectivo alto (owner)
- #146 Tasa errores HTTP alta (owner)
- #147 Base de datos en riesgo (owner)
- #148 Intentos acceso panel admin (owner)
- #149 Posible fraude (owner)
- #154 Backup falló (owner)
- #155 Datos sensibles en logs (owner)
- #156 Nuevo comercio solicita registro (owner)
- #160 Reclamos sin responder (owner)
- #162 Zona sin cobertura (owner)
- #163 Comercio no responde pedidos (owner)
- #168 Reporte semanal (owner)
- #169 Reporte mensual financiero (owner)
- #172 Comercio sin datos fiscales (owner)
- #173 Umbral facturación AFIP (owner)
- #176 Usuario reportó contenido ilegal (owner)

### P2 — Segundo mes (52 emails)

Retención, engagement, métricas. Los emails de la lista #3-5, #12-13, #23, #25, #27, #38-39, #49, #55-56, #59-61, #63, #65, #74, #78, #80, #84-88, #90-92, #94, #96-99, #101, #108, #112, #118-122, #129, #131-132, #141-144, #150, #152-153, #158-159, #164-165, #170-171, #175.

### P3 — Nice-to-have (39 emails)

Gamification, celebrations, advanced engagement. Los emails #4, #28-31, #66-68, #70-71, #75, #104-105, #111, #113, #122-128, #130, #133-134, #151, #166, #177-180.

---

## ENTREGABLE 4 — Análisis de Infraestructura Actual y Problemas

### Problemas detectados en el código actual

**1. Logo roto en emails de producción**
```
const companyLogo = "https://somosmoovy.com/logo-moovy.png";
```
El CLAUDE.md dice: "logo-moovy.png (PNG viejo) — aún referenciados en emails, requieren reemplazo en producción por versiones rojas actualizadas". Todos los emails en producción muestran un logo desactualizado o potencialmente roto.

**2. Link roto en email de aprobación repartidor**
```typescript
// email.ts L291
href="${baseUrl}/rider"
```
La ruta del portal repartidor es `/repartidor`, no `/rider`. Este link lleva a un 404.

**3. Transporter duplicado sin centralizar**
`change-password/route.ts` y `moovyx/register/route.ts` crean sus propios transporters inline en lugar de usar el centralizado de `email.ts`. Si cambian credenciales SMTP, hay que recordar cambiar en 3 lugares.

**4. Email de confirmación no se envía en todos los flujos de pago**
En `api/orders/route.ts`, el email de confirmación solo se envía para pagos en efectivo (L507-519). Para MercadoPago, se envía desde el webhook (L187-199). Pero si el webhook falla o se retrasa, el comprador no recibe confirmación. No hay verificación de que el email se haya enviado.

**5. Sin fallback si SMTP falla**
Si Gmail está caído, los 8 emails del sistema simplemente se pierden. No hay cola, no hay retry, no hay proveedor alternativo.

**6. console.log expone emails en producción**
```typescript
console.log("[Email] Welcome email sent to:", email);
```
Todos los emails enviados se loguean con la dirección del destinatario en la consola de producción.

---

## ENTREGABLE 5 — Arquitectura Recomendada de Emails

### Servicio recomendado: Resend

**¿Por qué Resend y no otros?**

| Criterio | Gmail SMTP (actual) | SendGrid | Resend | Amazon SES |
|---|---|---|---|---|
| Límite free | 500/día | 100/día | 3000/mes | 62.000/mes (solo con EC2) |
| Precio escalable | No escala | $19.95/mes 50k | $20/mes 50k | $0.10/1000 |
| API moderna (REST) | No | Sí | Sí (TypeScript native) | Sí |
| React Email support | No | No | Sí (creadores) | No |
| Dashboard analytics | No | Sí | Sí | Básico |
| Webhooks (bounce/open) | No | Sí | Sí | Sí |
| Setup para Next.js | Nodemailer | SDK pesado | 1 línea import | SDK pesado |
| Dominio custom | Requiere Workspace | Sí | Sí | Sí |

**Resend es ideal para Moovy** porque: es TypeScript nativo, se integra con Next.js en 1 import, tiene plan free de 3000 emails/mes (suficiente para el lanzamiento en Ushuaia), soporta React Email para templates, tiene dashboard de analytics, y escala a $20/mes para 50k emails.

### Arquitectura propuesta

```
[Evento en la app] → [emailQueue.add()] → [Worker procesa cola] → [Resend API] → [Webhook bounce/delivery] → [EmailLog DB]
                                                                                                                      ↓
                                                                                               [Retry automático si falla]
```

**Componentes**:

1. **`src/lib/email-service.ts`** — Servicio centralizado con Resend SDK
2. **`src/lib/email-queue.ts`** — Cola en memoria (para MVP) o BullMQ (para escala)
3. **`src/lib/email-templates/`** — Templates con React Email (JSX → HTML)
4. **`src/app/api/webhooks/email/route.ts`** — Webhook de Resend para bounce/delivery tracking
5. **Modelo `EmailLog`** en Prisma — Registro de cada email enviado
6. **Modelo `EmailPreference`** en Prisma — Preferencias por usuario

### Modelo de datos propuesto

```prisma
model EmailLog {
  id          String   @id @default(cuid())
  to          String
  subject     String
  template    String   // e.g., "order_confirmed", "welcome"
  status      String   // "sent", "delivered", "bounced", "failed"
  resendId    String?  // ID devuelto por Resend
  userId      String?
  orderId     String?
  metadata    Json?    // datos adicionales
  error       String?  // error si falló
  attempts    Int      @default(1)
  openedAt    DateTime?
  clickedAt   DateTime?
  createdAt   DateTime @default(now())

  user        User?    @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([template])
  @@index([status])
  @@index([createdAt])
}

model EmailPreference {
  id              String   @id @default(cuid())
  userId          String   @unique
  transactional   Boolean  @default(true)  // siempre true, no se puede desactivar
  orderUpdates    Boolean  @default(true)
  marketing       Boolean  @default(true)
  weeklyReport    Boolean  @default(true)
  dailyReport     Boolean  @default(true)  // solo para comercios/repartidores
  securityAlerts  Boolean  @default(true)  // siempre true, no se puede desactivar

  user            User     @relation(fields: [userId], references: [id])

  @@index([userId])
}
```

### Configuración SPF, DKIM, DMARC para somosmoovy.com

```dns
; SPF — permitir Resend y Google enviar desde somosmoovy.com
somosmoovy.com.  TXT  "v=spf1 include:_spf.google.com include:send.resend.com ~all"

; DKIM — Resend provee el registro al verificar dominio
resend._domainkey.somosmoovy.com.  TXT  "v=DKIM1; k=rsa; p=MIGf..."

; DMARC — política de cuarentena (no reject inicialmente)
_dmarc.somosmoovy.com.  TXT  "v=DMARC1; p=quarantine; rua=mailto:dmarc@somosmoovy.com; pct=100"
```

---

## ENTREGABLE 6 — Mapa Visual de Touchpoints

### COMPRADOR

```
Registro ──→ [1 Bienvenida ✅] ──→ [2 Verificar email ❌]
                                          │
                                          ▼
                                   Primera compra
                                          │
         ┌────────────────────────────────┤
         ▼                                ▼
    [Pago cash]                    [Pago MP]
         │                                │
         ▼                                ▼
[32 Confirmación ✅]         [34 Pago pendiente ❌]──→[33 Pago aprobado ❌]
         │                                            [35 Pago rechazado ❌]
         ▼                                │
[36 Aceptado por comercio ❌]◄────────────┘
         │
         ├──→ [37 Rechazado por comercio ❌] ──→ [45 Reembolso ❌]
         │
         ▼
[39 Repartidor asignado ❌]
         │
         ▼
[40 Pedido en camino ❌]
         │
         ├──→ [42 Cancelado por comprador ❌] ──→ [45 Reembolso ❌]
         │
         ▼
[41 Pedido entregado ❌] ──→ [49 Calificá ❌] ──→ [50 Comprobante ❌]

         ... (si inactivo) ...

[121 Win-back 15d ❌] ──→ [122 Win-back 30d ❌]
```

### COMERCIO

```
Registro ──→ [6 Solicitud recibida ❌] ──→ [8 Doc pendiente ❌]
                                                   │
                    ┌──────────────────────────────┤
                    ▼                              ▼
           [9 Aprobada ❌]                [10 Rechazada ❌]
                    │
                    ▼
           [11 Onboarding ❌] ──→ [12 Vinculó MP ❌]
                    │
                    ▼
             Primer pedido
                    │
                    ▼
           [51 Nuevo pedido ❌] ──→ [52 Recordatorio ❌] ──→ [54 Cancelado sistema ❌]
                    │
                    ▼
           [55 Repartidor asignado ❌]
                    │
                    ▼
           [57 Entregado ❌] ──→ [76 Pago recibido ❌]
                    │
                    ▼
           [60 Calificación ❌]

                    ... cada día ...
           [77 Resumen diario ❌]

                    ... cada mes ...
           [79 Resumen mensual ❌] ──→ [80 Factura comisión ❌]
```

### REPARTIDOR

```
Registro ──→ [14 Solicitud recibida ⚠️ solo admin] ──→ [16 Doc pendiente ❌]
                                                              │
                         ┌────────────────────────────────────┤
                         ▼                                    ▼
                [17 Aprobado ✅]                     [18 Rechazado ❌]
                         │
                         ▼
                [19 Onboarding ❌]
                         │
                         ▼
                  Primer delivery
                         │
                         ▼
                [62 Pedido asignado ❌] ──→ [63 Reasignado ❌]
                         │
                         ▼
                [65 Entrega confirmada ❌] ──→ [66 Propina ❌]
                         │
                         ▼
                [67 Calificación ❌]

                         ... cada día ...
                [87 Resumen diario ❌]

                         ... cada semana ...
                [88 Resumen semanal ❌]

                         ... documentación ...
                [106 Doc por vencer ❌] ──→ [107 Doc vencida ❌]
```

### OWNER / DUEÑO DE MOOVY

```
                    ┌─── 08:00 AM ───────────────────────────────────┐
                    │ [167 Reporte diario ❌]                         │
                    └────────────────────────────────────────────────┘
                                         │
                    Durante el día (alertas según eventos):
                    │
                    ├──→ [161 Pedidos sin repartidor ❌]  🟠
                    ├──→ [160 Reclamos sin responder ❌]  🟠
                    ├──→ [135 Pasarela caída ❌]          🔴
                    ├──→ [145 Servidor caído ❌]          🔴
                    ├──→ [137 Split falló ❌]             🟠
                    ├──→ [149 Fraude detectado ❌]        🟠
                    ├──→ [156 Nuevo comercio ❌]          🟡
                    ├──→ [157 Nuevo repartidor ⚠️]        🟡
                    │
                    ┌─── Lunes 09:00 AM ─────────────────────────────┐
                    │ [168 Reporte semanal ❌]                        │
                    └────────────────────────────────────────────────┘
                    │
                    ┌─── 1ro de cada mes ────────────────────────────┐
                    │ [169 Reporte mensual financiero ❌]             │
                    │ [170 Reporte mensual crecimiento ❌]            │
                    │ [171 Reporte salud plataforma ❌]               │
                    └────────────────────────────────────────────────┘
                    │
                    ┌─── Hitos (cuando se alcanzan) ─────────────────┐
                    │ [177 Hito pedidos ❌] 🎉                        │
                    │ [179 Hito facturación ❌] 🎉                    │
                    │ [180 Récord diario ❌] 🎉                       │
                    └────────────────────────────────────────────────┘
```

---

## VEREDICTO FINAL

### ¿Está el sistema de emails de Moovy listo para producción?

**NO. El sistema de emails necesita un rediseño completo.**

**Situación actual**: Solo 8 de 180 emails están implementados (4.4%). De los 27 emails P0 (obligatorios para lanzar), solo 4 existen parcialmente. La infraestructura (Gmail SMTP, sin cola, sin retry, sin logging, sin tracking) no es apta para una plataforma de marketplace en producción.

**Riesgos críticos si se lanza así**:

1. **Comprador paga y no recibe confirmación** si el webhook MP falla — sin email de pago pendiente ni rechazado, queda en la oscuridad.

2. **Comercio se registra y no recibe ningún email** — no sabe si fue aprobado, rechazado, o si hay documentación pendiente.

3. **Reembolsos sin notificación** — el comprador no sabe que le devolvieron el dinero.

4. **Owner sin visibilidad** — no hay reportes diarios, ni alertas de sistema caído, ni notificación de pasarela de pagos fallida. Si MercadoPago se cae a las 3 AM, nadie se entera hasta que alguien revise el dashboard.

5. **Sin eliminación de cuenta notificada** — incumplimiento de la Ley 25.326 de Protección de Datos Personales de Argentina y requisito de Google Play.

6. **Gmail como SMTP** — máximo 500 emails/día, sin analytics, sin bounce handling. Un Black Friday con 200 pedidos colapsa el sistema de emails.

**Lo mínimo viable para lanzar**: Implementar los 27 emails P0, migrar de Gmail a Resend, centralizar templates, agregar EmailLog en la DB, y configurar SPF/DKIM/DMARC para somosmoovy.com.

---

*Fin del análisis. Documento generado el 20 de marzo de 2026.*
