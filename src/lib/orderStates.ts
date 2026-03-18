/**
 * Centralized Order State Machine
 * 
 * Defines all order statuses and provides utilities for
 * status transitions, route destinations, and customer notifications.
 */

// Order status constants - use these instead of hardcoded strings
export const ORDER_STATUSES = {
    PENDING: 'PENDING',
    AWAITING_PAYMENT: 'AWAITING_PAYMENT',
    CONFIRMED: 'CONFIRMED',
    PREPARING: 'PREPARING',
    READY: 'READY',
    DRIVER_ASSIGNED: 'DRIVER_ASSIGNED',
    PICKED_UP: 'PICKED_UP',
    IN_DELIVERY: 'IN_DELIVERY',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
} as const;

export type OrderStatus = typeof ORDER_STATUSES[keyof typeof ORDER_STATUSES];

// Status display labels in Spanish
export const STATUS_LABELS: Record<OrderStatus, string> = {
    PENDING: 'Pendiente',
    AWAITING_PAYMENT: 'Esperando pago',
    CONFIRMED: 'Confirmado',
    PREPARING: 'Preparando',
    READY: 'Listo para retiro',
    DRIVER_ASSIGNED: 'Rider asignado',
    PICKED_UP: 'Retirado',
    IN_DELIVERY: 'En camino',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
};

// Delivery status labels in Spanish (for deliveryStatus field, separate from order status)
export const DELIVERY_STATUS_LABELS: Record<string, string> = {
    DRIVER_ASSIGNED: 'En camino al comercio',
    DRIVER_ARRIVED: 'Repartidor en el comercio',
    PICKED_UP: 'Retirado del comercio',
    DELIVERED: 'Entregado',
};

// Status colors for UI
export const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    AWAITING_PAYMENT: { bg: 'bg-amber-100', text: 'text-amber-700' },
    CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-700' },
    PREPARING: { bg: 'bg-red-100', text: 'text-red-700' },
    READY: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
    DRIVER_ASSIGNED: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
    PICKED_UP: { bg: 'bg-orange-100', text: 'text-orange-700' },
    IN_DELIVERY: { bg: 'bg-orange-100', text: 'text-orange-700' },
    DELIVERED: { bg: 'bg-green-100', text: 'text-green-700' },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-700' },
};

/**
 * Get the route destination based on order status
 * Returns 'MERCHANT' when rider should go to pickup
 * Returns 'CUSTOMER' when rider should go to delivery
 */
export function getRouteDestination(status: string): 'MERCHANT' | 'CUSTOMER' | null {
    const toMerchant = ['DRIVER_ASSIGNED', 'DRIVER_ARRIVED', 'READY', 'CONFIRMED', 'PREPARING'];
    const toCustomer = ['PICKED_UP', 'IN_DELIVERY'];

    if (toMerchant.includes(status)) return 'MERCHANT';
    if (toCustomer.includes(status)) return 'CUSTOMER';
    return null;
}

/**
 * Check if a status should be shown as a customer notification
 * Only these critical states trigger user notifications
 */
export function isCustomerNotifiableStatus(status: string): boolean {
    const notifiable = [
        'PREPARING',        // "Comercio preparando tu pedido"
        'DRIVER_ASSIGNED',  // "Rider en camino al comercio"
        'DRIVER_ARRIVED',   // "Repartidor llegó al comercio"
        'PICKED_UP',        // "Rider en camino hacia ti"
        'IN_DELIVERY',      // Alias for pickup confirmation
    ];
    return notifiable.includes(status);
}

/**
 * Get customer-facing notification message for a status
 */
export const CUSTOMER_NOTIFICATION_MESSAGES: Record<string, string> = {
    PREPARING: '👨‍🍳 El comercio está preparando tu pedido',
    DRIVER_ASSIGNED: '🏍️ Un repartidor va en camino al comercio',
    DRIVER_ARRIVED: '📍 El repartidor llegó al comercio',
    PICKED_UP: '📦 Tu pedido fue retirado, viene en camino',
    IN_DELIVERY: '🚀 Tu pedido viene en camino hacia ti',
};

/**
 * Check if the order is in an active/ongoing state
 */
export function isActiveOrder(status: string): boolean {
    const activeStatuses = [
        'PENDING', 'CONFIRMED', 'PREPARING', 'READY',
        'DRIVER_ASSIGNED', 'PICKED_UP', 'IN_DELIVERY'
    ];
    return activeStatuses.includes(status);
}

/**
 * Check if the order is completed (delivered or cancelled)
 */
export function isCompletedOrder(status: string): boolean {
    return status === 'DELIVERED' || status === 'CANCELLED';
}

/**
 * Get valid next statuses based on current status (for UI)
 */
export function getNextStatuses(currentStatus: string): OrderStatus[] {
    const transitions: Record<string, OrderStatus[]> = {
        PENDING: ['CONFIRMED', 'CANCELLED'],
        AWAITING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['PREPARING', 'CANCELLED'],
        PREPARING: ['READY', 'CANCELLED'],
        READY: ['DRIVER_ASSIGNED', 'CANCELLED'],
        DRIVER_ASSIGNED: ['PICKED_UP', 'CANCELLED'],  // Note: deliveryStatus also supports DRIVER_ARRIVED intermediate state
        PICKED_UP: ['IN_DELIVERY'],
        IN_DELIVERY: ['DELIVERED'],
        DELIVERED: [],
        CANCELLED: [],
    };
    return transitions[currentStatus] || [];
}
