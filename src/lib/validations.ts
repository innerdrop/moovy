// Zod validation schemas for MOOVY API routes
// Centralized validation for all input data

import { z } from "zod";

// ─── Order Schemas ──────────────────────────────────────────────────────────

export const OrderItemSchema = z.object({
    productId: z.string().min(1, "ID de producto requerido"),
    name: z.string().min(1, "Nombre requerido"),
    price: z.number().positive("El precio debe ser positivo"),
    quantity: z.number().int().min(1, "Cantidad mínima: 1"),
    variantName: z.string().nullish(),
    type: z.enum(["product", "listing"]).default("product"),
});

export const AddressDataSchema = z.object({
    street: z.string().min(1, "Calle requerida"),
    number: z.string().min(1, "Número requerido"),
    floor: z.string().optional(),
    city: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
});

export const OrderGroupSchema = z.object({
    merchantId: z.string().optional(),
    sellerId: z.string().optional(),
    vendorName: z.string().optional(),
    deliveryFee: z.number().min(0).default(0),
    distanceKm: z.number().min(0).default(0),
    items: z.array(OrderItemSchema).min(1),
});

export const CreateOrderSchema = z.object({
    items: z.array(OrderItemSchema).min(1, "El carrito está vacío"),
    groups: z.array(OrderGroupSchema).optional(),
    addressId: z.string().optional(),
    addressData: AddressDataSchema.optional(),
    paymentMethod: z.enum(["cash", "transfer", "card", "mercadopago"]).default("cash"),
    deliveryFee: z.number().min(0).default(0),
    distanceKm: z.number().min(0).optional(),
    isPickup: z.boolean().default(false),
    deliveryNotes: z.string().max(500).nullish(),
    customerNotes: z.string().max(500).nullish(),
    pointsUsed: z.number().int().min(0).default(0),
    discountAmount: z.number().min(0).default(0),
    merchantId: z.string().optional(),
    deliveryType: z.enum(["IMMEDIATE", "SCHEDULED"]).default("IMMEDIATE"),
    scheduledSlotStart: z.string().datetime().optional(),
    scheduledSlotEnd: z.string().datetime().optional(),
    couponCode: z.string().max(50).optional(),
}).refine(
    (data) => {
        if (data.deliveryType === "SCHEDULED") {
            return !!data.scheduledSlotStart && !!data.scheduledSlotEnd;
        }
        return true;
    },
    { message: "Se requiere horario de entrega para pedidos programados", path: ["scheduledSlotStart"] }
).refine(
    (data) => {
        if (data.deliveryType !== "SCHEDULED" || !data.scheduledSlotStart) return true;
        const start = new Date(data.scheduledSlotStart);
        const now = new Date();
        // Slot must be at least 1.5 hours from now
        const minTime = new Date(now.getTime() + 90 * 60_000);
        return start >= minTime;
    },
    { message: "El horario programado debe ser al menos 1.5 horas desde ahora", path: ["scheduledSlotStart"] }
).refine(
    (data) => {
        if (data.deliveryType !== "SCHEDULED" || !data.scheduledSlotStart || !data.scheduledSlotEnd) return true;
        const start = new Date(data.scheduledSlotStart);
        const end = new Date(data.scheduledSlotEnd);
        // End must be after start
        return end > start;
    },
    { message: "El horario de fin debe ser posterior al de inicio", path: ["scheduledSlotEnd"] }
).refine(
    (data) => {
        if (data.deliveryType !== "SCHEDULED" || !data.scheduledSlotStart || !data.scheduledSlotEnd) return true;
        const start = new Date(data.scheduledSlotStart);
        const end = new Date(data.scheduledSlotEnd);
        // Slot duration must be between 1 and 3 hours
        const durationMs = end.getTime() - start.getTime();
        const durationHours = durationMs / (60 * 60_000);
        return durationHours >= 1 && durationHours <= 3;
    },
    { message: "La duración del slot debe ser entre 1 y 3 horas", path: ["scheduledSlotEnd"] }
).refine(
    (data) => {
        if (data.deliveryType !== "SCHEDULED" || !data.scheduledSlotStart) return true;
        const start = new Date(data.scheduledSlotStart);
        // Usar timezone de Ushuaia para validar horario de negocio (VPS corre en UTC)
        const ushuaiaHour = parseInt(
            new Intl.DateTimeFormat("en-US", {
                timeZone: "America/Argentina/Ushuaia",
                hour: "numeric",
                hourCycle: "h23",
            }).formatToParts(start).find(p => p.type === "hour")?.value || "0",
            10
        );
        // Must be within business hours (9 AM - 10 PM Ushuaia time)
        return ushuaiaHour >= 9 && ushuaiaHour < 22;
    },
    { message: "El horario debe estar dentro del horario de atención (9:00 - 22:00)", path: ["scheduledSlotStart"] }
).refine(
    (data) => {
        if (data.deliveryType !== "SCHEDULED" || !data.scheduledSlotStart) return true;
        const start = new Date(data.scheduledSlotStart);
        const now = new Date();
        // Cannot schedule more than 48 hours ahead
        const maxTime = new Date(now.getTime() + 48 * 60 * 60_000);
        return start <= maxTime;
    },
    { message: "No se puede programar con más de 48 horas de anticipación", path: ["scheduledSlotStart"] }
);

export const UpdateOrderSchema = z.object({
    status: z.enum([
        "PENDING", "AWAITING_PAYMENT", "CONFIRMED", "PREPARING", "READY",
        "DRIVER_ASSIGNED", "PICKED_UP",
        "IN_DELIVERY", "DELIVERED", "CANCELLED",
        "SCHEDULED", "SCHEDULED_CONFIRMED"
    ]).optional(),
    paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]).optional(),
    driverId: z.string().optional(),
    deliveryStatus: z.string().optional(),
    adminNotes: z.string().max(1000).optional(),
    estimatedTime: z.number().min(0).optional(),
    cancelReason: z.string().max(500).optional(),
});

// ─── Product Schemas ────────────────────────────────────────────────────────

export const CreateProductSchema = z.object({
    name: z.string().min(1, "Nombre requerido").max(200),
    description: z.string().max(2000).optional(),
    price: z.number().positive("El precio debe ser positivo"),
    compareAtPrice: z.number().positive().nullish(),
    stock: z.number().int().min(0).default(0),
    categoryId: z.string().optional(),
    merchantId: z.string().min(1),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    tags: z.array(z.string()).optional(),
});

// ─── Delivery Calculation Schema ────────────────────────────────────────────

export const DeliveryCalcSchema = z.object({
    lat: z.string().regex(/^-?\d+\.?\d*$/, "Latitud inválida"),
    lng: z.string().regex(/^-?\d+\.?\d*$/, "Longitud inválida"),
    merchantId: z.string().min(1, "Comercio requerido"),
});

// ─── Auth Schemas ───────────────────────────────────────────────────────────

export const LoginSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(8, "Contraseña mínimo 8 caracteres"),
});

export const RegisterSchema = z.object({
    name: z.string().min(2, "Nombre mínimo 2 caracteres").max(100),
    email: z.string().email("Email inválido"),
    password: z.string().min(8, "Contraseña mínimo 8 caracteres"),
    phone: z.string().min(8, "Teléfono inválido").optional(),
    referralCode: z.string().optional(),
});

// ─── Helper ─────────────────────────────────────────────────────────────────

/**
 * Validate input data with a Zod schema
 * Returns { success, data, error } for easy use in API routes
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean;
    data?: T;
    error?: string;
} {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    // Format first error for user-facing response
    const firstError = result.error.issues[0];
    return {
        success: false,
        error: firstError?.message || "Datos inválidos",
    };
}