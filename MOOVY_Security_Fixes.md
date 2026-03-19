# MOOVY - Codigo de Correccion: Top 10 Vulnerabilidades Criticas

> Fecha: 19 de Marzo de 2026 | Clasificacion: CONFIDENCIAL

---

## FIX 1 — V-002: Eliminar Secrets Hardcodeados (socket-server.ts)

**Archivo:** `scripts/socket-server.ts` lineas 12-13

**Antes:**
```typescript
const SOCKET_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret";
const CRON_SECRET = process.env.CRON_SECRET || "moovy-cron-secret-change-in-production";
```

**Despues:**
```typescript
const SOCKET_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
const CRON_SECRET = process.env.CRON_SECRET;

if (!SOCKET_SECRET) {
  console.error("FATAL: AUTH_SECRET or NEXTAUTH_SECRET must be set");
  process.exit(1);
}
if (!CRON_SECRET) {
  console.error("FATAL: CRON_SECRET must be set");
  process.exit(1);
}
```

---

## FIX 2 — V-005: Eliminar Endpoints Debug

**Archivos a eliminar:**
- `src/app/api/debug-cookies/route.ts`
- `src/app/api/debug-session/route.ts`

**Alternativa (si se necesitan en dev):**
```typescript
// src/app/api/debug-session/route.ts
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const session = await auth();
  if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    roles: (session.user as any).roles || [],
    // NUNCA exponer: cookies, headers, tokens, stack traces
  });
}
```

---

## FIX 3 — V-006: Restringir CORS de Socket.IO

**Archivo:** `scripts/socket-server.ts` linea ~60

**Antes:**
```typescript
cors: { origin: true, methods: ["GET", "POST"], credentials: true }
```

**Despues:**
```typescript
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  // Agregar dominios adicionales si es necesario
].filter(Boolean);

cors: {
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      console.warn(`Socket.IO CORS rejected origin: ${origin}`);
      callback(new Error("CORS not allowed"));
    }
  },
  methods: ["GET", "POST"],
  credentials: true
}
```

---

## FIX 4 — V-012: Requerir MP_WEBHOOK_SECRET

**Archivo:** `src/app/api/webhooks/mercadopago/route.ts` linea ~27

**Antes:**
```typescript
if (process.env.MP_WEBHOOK_SECRET) {
  const isValid = verifyWebhookSignature(/* ... */);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
}
// Si no hay secret, se skipea la validacion
```

**Despues:**
```typescript
if (!process.env.MP_WEBHOOK_SECRET) {
  console.error("CRITICAL: MP_WEBHOOK_SECRET is not configured. Rejecting webhook.");
  return NextResponse.json({ error: "Webhook validation not configured" }, { status: 500 });
}

const isValid = verifyWebhookSignature(
  request.headers.get("x-signature") || "",
  request.headers.get("x-request-id") || "",
  dataId,
  process.env.MP_WEBHOOK_SECRET
);

if (!isValid) {
  console.warn(`Invalid webhook signature from ${request.headers.get("x-forwarded-for")}`);
  return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
}
```

---

## FIX 5 — V-014: Validar Montos de Refund

**Archivo:** `src/app/api/ops/refund/route.ts`

**Codigo corregido completo:**
```typescript
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { orderId, amount, reason } = await request.json();

  if (!orderId || typeof orderId !== "string") {
    return NextResponse.json({ error: "orderId requerido" }, { status: 400 });
  }
  if (!reason || typeof reason !== "string" || reason.trim().length < 10) {
    return NextResponse.json({ error: "Motivo requerido (minimo 10 caracteres)" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  // Validar estado de pago (solo refundir pagos completados)
  if (!["COMPLETED", "PAID"].includes(order.paymentStatus || "")) {
    return NextResponse.json({
      error: `No se puede reembolsar un pedido con estado de pago: ${order.paymentStatus}`
    }, { status: 400 });
  }

  if (order.paymentStatus === "REFUNDED") {
    return NextResponse.json({ error: "Este pedido ya fue reembolsado" }, { status: 400 });
  }

  // Validar monto
  const refundAmount = amount ? Number(amount) : order.total;
  if (isNaN(refundAmount) || refundAmount <= 0 || refundAmount > order.total) {
    return NextResponse.json({
      error: `Monto invalido. Debe ser entre $0.01 y $${order.total}`
    }, { status: 400 });
  }

  // Idempotency key
  const idempotencyKey = `refund-${orderId}-${crypto.randomUUID()}`;

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "REFUNDED",
      adminNotes: `${order.adminNotes || ""}\n[REEMBOLSO ${new Date().toISOString()}] $${refundAmount} por ${session.user.email} | Motivo: ${reason.trim()} | Key: ${idempotencyKey}`.trim()
    }
  });

  // Audit log
  await logAudit({
    action: "REFUND_PROCESSED",
    entityType: "order",
    entityId: orderId,
    userId: session.user.id,
    details: { refundAmount, reason: reason.trim(), idempotencyKey, originalTotal: order.total }
  });

  return NextResponse.json({ success: true, order: updatedOrder });
}
```

---

## FIX 6 — V-003/V-027: Unificar Validacion de Password

**Archivo:** `src/app/api/auth/reset-password/route.ts` y `change-password/route.ts`

**En ambos archivos, reemplazar:**
```typescript
if (!password || password.length < 6) {
  return NextResponse.json({ error: "..." }, { status: 400 });
}
```

**Con:**
```typescript
import { validatePasswordStrength } from "@/lib/security";

const passwordValidation = validatePasswordStrength(password);
if (!passwordValidation.isValid) {
  return NextResponse.json({
    error: `Password invalido: ${passwordValidation.errors.join(", ")}`
  }, { status: 400 });
}
```

**Tambien en `src/app/api/auth/register/route.ts`:**
```typescript
// Reemplazar la validacion simple con:
const passwordValidation = validatePasswordStrength(password);
if (!passwordValidation.isValid) {
  return NextResponse.json({
    error: `La contrasena debe tener al menos 8 caracteres, una mayuscula, una minuscula y un numero`
  }, { status: 400 });
}
```

---

## FIX 7 — V-018: Validar Magic Bytes en Uploads

**Archivo:** `src/app/api/upload/route.ts`

**Agregar antes del procesamiento con sharp:**
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Validar tamano ANTES de leer
if (file.size > MAX_FILE_SIZE) {
  return NextResponse.json(
    { error: `Archivo demasiado grande. Maximo: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
    { status: 400 }
  );
}

const buffer = Buffer.from(await file.arrayBuffer());

// Validar magic bytes
const MAGIC_BYTES: Record<string, number[][]> = {
  jpeg: [[0xFF, 0xD8, 0xFF]],
  png: [[0x89, 0x50, 0x4E, 0x47]],
  gif: [[0x47, 0x49, 0x46, 0x38]],
  webp: [[0x52, 0x49, 0x46, 0x46]], // RIFF header
};

function validateMagicBytes(buf: Buffer): boolean {
  for (const signatures of Object.values(MAGIC_BYTES)) {
    for (const sig of signatures) {
      if (sig.every((byte, i) => buf[i] === byte)) {
        return true;
      }
    }
  }
  return false;
}

if (!validateMagicBytes(buffer)) {
  return NextResponse.json(
    { error: "Formato de imagen no soportado. Solo JPEG, PNG, GIF y WebP." },
    { status: 400 }
  );
}

// Validar extension
const ext = file.name?.split(".").pop()?.toLowerCase();
if (!ext || !["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
  return NextResponse.json(
    { error: "Extension de archivo no permitida" },
    { status: 400 }
  );
}
```

---

## FIX 8 — V-028: Timing-Safe Comparison en Crons

**Archivos:** `src/app/api/cron/assignment-tick/route.ts` y `seller-resume/route.ts`

**Antes:**
```typescript
const token = authHeader?.replace("Bearer ", "");
if (!token || token !== process.env.CRON_SECRET) {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}
```

**Despues:**
```typescript
import crypto from "crypto";

function verifyToken(provided: string | undefined, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  if (provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(provided, "utf-8"),
    Buffer.from(expected, "utf-8")
  );
}

const token = authHeader?.replace("Bearer ", "");
if (!verifyToken(token, process.env.CRON_SECRET)) {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}
```

---

## FIX 9 — V-024: Audit Logging en Exports

**Archivo:** `src/app/api/ops/export/route.ts`

**Agregar despues de la validacion de auth y antes del return:**
```typescript
import { logAudit } from "@/lib/audit";

// Despues de generar el CSV y antes de retornarlo:
await logAudit({
  action: "DATA_EXPORT",
  entityType: type, // "orders" | "users" | "merchants"
  entityId: `export-${type}-${new Date().toISOString()}`,
  userId: session.user.id,
  details: {
    exportType: type,
    recordCount: data.length,
    filters: { dateFrom, dateTo, search },
    ip: request.headers.get("x-forwarded-for") || "unknown",
    userAgent: request.headers.get("user-agent") || "unknown"
  }
});
```

---

## FIX 10 — V-001/V-030: Validacion de Env Vars al Startup

**Nuevo archivo:** `src/lib/env-validation.ts`

```typescript
/**
 * Validates required environment variables at application startup.
 * Import this in layout.tsx or middleware to ensure early failure.
 */

const REQUIRED_VARS = [
  "AUTH_SECRET",
  "DATABASE_URL",
  "CRON_SECRET",
  "NEXT_PUBLIC_APP_URL",
] as const;

const REQUIRED_IN_PRODUCTION = [
  "MP_ACCESS_TOKEN",
  "MP_PUBLIC_KEY",
  "MP_WEBHOOK_SECRET",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASS",
  "VAPID_PRIVATE_KEY",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
] as const;

const WEAK_SECRET_PATTERNS = [
  /moovy.*secret/i,
  /cambiar.*produccion/i,
  /change.*production/i,
  /fallback/i,
  /default/i,
  /your_.*_here/i,
];

export function validateEnv(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required vars
  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) {
      errors.push(`Missing required env var: ${key}`);
    }
  }

  // Check production-required vars
  if (process.env.NODE_ENV === "production") {
    for (const key of REQUIRED_IN_PRODUCTION) {
      if (!process.env[key]) {
        errors.push(`Missing production env var: ${key}`);
      }
    }
  }

  // Check for weak secrets
  const secretVars = ["AUTH_SECRET", "NEXTAUTH_SECRET", "CRON_SECRET"];
  for (const key of secretVars) {
    const value = process.env[key];
    if (value) {
      if (value.length < 32) {
        warnings.push(`${key} is too short (${value.length} chars, minimum 32)`);
      }
      for (const pattern of WEAK_SECRET_PATTERNS) {
        if (pattern.test(value)) {
          errors.push(`${key} matches weak pattern: ${pattern}. Generate a strong random secret.`);
          break;
        }
      }
    }
  }

  if (warnings.length > 0) {
    console.warn("[ENV WARNING]", warnings.join(" | "));
  }

  if (errors.length > 0) {
    console.error("[ENV FATAL]", errors.join(" | "));
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Environment validation failed: ${errors.join("; ")}`);
    }
  }
}
```

**Uso:** Importar en `src/lib/auth.ts` al inicio:
```typescript
import { validateEnv } from "./env-validation";
validateEnv();
```

---

## Resumen de Esfuerzo Estimado

| Fix | Vulnerabilidad | Esfuerzo |
|-----|---------------|----------|
| FIX 1 | V-002: Secrets hardcodeados | 1 hora |
| FIX 2 | V-005: Debug endpoints | 30 min |
| FIX 3 | V-006: Socket CORS | 1 hora |
| FIX 4 | V-012: Webhook validation | 1 hora |
| FIX 5 | V-014: Refund validation | 3 horas |
| FIX 6 | V-003/V-027: Password policy | 2 horas |
| FIX 7 | V-018: Upload magic bytes | 2 horas |
| FIX 8 | V-028: Timing-safe cron | 1 hora |
| FIX 9 | V-024: Export audit logging | 1 hora |
| FIX 10 | V-001/V-030: Env validation | 2 horas |
| **TOTAL** | | **~14 horas** |
