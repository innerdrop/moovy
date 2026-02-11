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
});

export const AddressDataSchema = z.object({
    street: z.string().min(1, "Calle requerida"),
    number: z.string().min(1, "Número requerido"),
    floor: z.string().optional(),
    city: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
});

export const CreateOrderSchema = z.object({
    items: z.array(OrderItemSchema).min(1, "El carrito está vacío"),
    addressId: z.string().optional(),
    addressData: AddressDataSchema.optional(),
    paymentMethod: z.enum(["cash", "transfer", "card"]).default("cash"),
    deliveryFee: z.number().min(0).default(0),
    distanceKm: z.number().min(0).optional(),
    isPickup: z.boolean().default(false),
    deliveryNotes: z.string().max(500).nullish(),
    customerNotes: z.string().max(500).nullish(),
    pointsUsed: z.number().int().min(0).default(0),
    discountAmount: z.number().min(0).default(0),
    merchantId: z.string().min(1, "Comercio requerido"),
});

export const UpdateOrderSchema = z.object({
    status: z.enum([
        "PENDING", "CONFIRMED", "PREPARING", "READY",
        "DRIVER_ASSIGNED", "PICKED_UP",
        "IN_DELIVERY", "DELIVERED", "CANCELLED"
    ]).optional(),
    paymentStatus: z.enum(["PENDING", "PAID", "REFUNDED"]).optional(),
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
    password: z.string().min(6, "Contraseña mínimo 6 caracteres"),
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
        error: firstError
            ? `${firstError.path.join(".")}: ${firstError.message}`
            : "Datos inválidos",
    };
}
