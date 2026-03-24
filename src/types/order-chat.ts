/**
 * Order Chat Types
 * Chat directo entre roles dentro de un pedido activo
 * Comprador ↔ Comercio/Vendedor | Comprador ↔ Repartidor
 */

export type OrderChatType = "BUYER_MERCHANT" | "BUYER_DRIVER" | "BUYER_SELLER";

export interface OrderChat {
    id: string;
    orderId: string;
    subOrderId?: string;
    chatType: OrderChatType;
    participantAId: string;
    participantBId: string;
    status: "active" | "closed";
    createdAt: Date;
    updatedAt: Date;
    participantA?: ChatParticipant;
    participantB?: ChatParticipant;
    messages?: OrderChatMessage[];
    unreadCount?: number;
    order?: {
        id: string;
        orderNumber: string;
        status: string;
    };
}

export interface OrderChatMessage {
    id: string;
    chatId: string;
    senderId: string;
    content: string;
    isRead: boolean;
    isSystem: boolean;
    createdAt: Date;
    sender?: ChatParticipant;
}

export interface ChatParticipant {
    id: string;
    name?: string;
    email?: string;
    role?: string;
}

// Quick responses predefinidas por rol
export interface QuickResponse {
    id: string;
    label: string;
    message: string;
}

export const BUYER_QUICK_RESPONSES: QuickResponse[] = [
    { id: "b1", label: "Estado del pedido", message: "Hola, ¿cómo va mi pedido?" },
    { id: "b2", label: "Tiempo estimado", message: "¿Cuánto falta para que esté listo?" },
    { id: "b3", label: "Cambio en pedido", message: "¿Puedo hacer un cambio en mi pedido?" },
    { id: "b4", label: "Estoy en la puerta", message: "Ya estoy en la puerta esperando" },
    { id: "b5", label: "Problema con pedido", message: "Tengo un problema con mi pedido" },
    { id: "b6", label: "Gracias", message: "¡Muchas gracias!" },
];

export const MERCHANT_QUICK_RESPONSES: QuickResponse[] = [
    { id: "m1", label: "En preparación", message: "Tu pedido está en preparación" },
    { id: "m2", label: "Listo para retirar", message: "Tu pedido ya está listo para ser retirado" },
    { id: "m3", label: "Demora extra", message: "Va a demorar unos minutos más de lo estimado, disculpá las molestias" },
    { id: "m4", label: "Producto agotado", message: "Lamentablemente uno de los productos no está disponible. ¿Querés que lo reemplacemos por otro?" },
    { id: "m5", label: "Pedido entregado", message: "Tu pedido ya fue entregado. ¡Esperamos que lo disfrutes!" },
];

export const SELLER_QUICK_RESPONSES: QuickResponse[] = [
    { id: "s1", label: "Preparando envío", message: "Estoy preparando tu pedido para el envío" },
    { id: "s2", label: "Enviado", message: "Tu pedido ya fue despachado" },
    { id: "s3", label: "Stock agotado", message: "Lamentablemente el producto se agotó. ¿Te interesa otra opción?" },
    { id: "s4", label: "Consulta recibida", message: "Recibí tu consulta, te respondo a la brevedad" },
    { id: "s5", label: "Gracias por tu compra", message: "¡Gracias por tu compra! Cualquier duda estoy a disposición" },
];

export const DRIVER_QUICK_RESPONSES: QuickResponse[] = [
    // Pickup phase
    { id: "d1", label: "En camino al comercio", message: "Estoy en camino a retirar tu pedido" },
    { id: "d2", label: "Llegué al comercio", message: "Ya llegué al comercio, esperando tu pedido" },
    { id: "d3", label: "Pedido retirado", message: "Ya retiré tu pedido, voy en camino a tu domicilio" },

    // Delivery phase
    { id: "d4", label: "Estoy cerca (5 min)", message: "Estoy a 5 minutos de tu dirección" },
    { id: "d5", label: "Llegué a la puerta", message: "Llegué a tu dirección. Toco timbre en un momento" },

    // Building/access issues
    { id: "d6", label: "¿Piso/Apto?", message: "¿Cuál es tu número de piso/apartamento?" },
    { id: "d7", label: "Portería cerrada", message: "La portería está cerrada, ¿cómo entro?" },
    { id: "d8", label: "No veo portero", message: "No veo portero automático, ¿a qué nombre está el timbre?" },

    // Driver status
    { id: "d9", label: "No encuentro la dirección", message: "No encuentro la dirección, ¿podés darme alguna referencia?" },
    { id: "d10", label: "Demora en comercio", message: "El comercio está demorando un poco, te aviso cuando salga" },
    { id: "d11", label: "Problema de navegación", message: "Tuve un inconveniente en el camino, pero estoy en marcha de nuevo" },

    // Buyer requests
    { id: "d12", label: "Confirmando dirección", message: "¿Vos sos? (confirmando que encontré el lugar correcto)" },
];
