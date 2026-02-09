/**
 * Centralized Order State Machine
 * 
 * Defines all order statuses and provides utilities for
 * status transitions, route destinations, and customer notifications.
 */

// Order status constants - use these instead of hardcoded strings
export const ORDER_STATUSES = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    PREPARING: 'PREPARING',
    READY: 'READY',
    DRIVER_ASSIGNED: 'DRIVER_ASSIGNED',
    PICKED_UP: 'PICKED_UP',
    IN_DELIVERY: 'IN_DELIVERY',
    ON_THE_WAY: 'ON_THE_WAY',  // Alias for IN_DELIVERY
    DELIVERED: 'DELIVERED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
} as const;

export type OrderStatus = typeof ORDER_STATUSES[keyof typeof ORDER_STATUSES];

// Status display labels in Spanish
export const STATUS_LABELS: Record<OrderStatus, string> = {
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmado',
    PREPARING: 'Preparando',
    READY: 'Listo para retiro',
    DRIVER_ASSIGNED: 'Rider asignado',
    PICKED_UP: 'Retirado',
    IN_DELIVERY: 'En camino',
    ON_THE_WAY: 'En camino',
    DELIVERED: 'Entregado',
    COMPLETED: 'Finalizado',
    CANCELLED: 'Cancelado',
};

// Status colors for UI
export const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-700' },
    PREPARING: { bg: 'bg-purple-100', text: 'text-purple-700' },
    READY: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
    DRIVER_ASSIGNED: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
    PICKED_UP: { bg: 'bg-orange-100', text: 'text-orange-700' },
    IN_DELIVERY: { bg: 'bg-orange-100', text: 'text-orange-700' },
    ON_THE_WAY: { bg: 'bg-orange-100', text: 'text-orange-700' },
    DELIVERED: { bg: 'bg-green-100', text: 'text-green-700' },
    COMPLETED: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-700' },
};

/**
 * Get the route destination based on order status
 * Returns 'MERCHANT' when rider should go to pickup
 * Returns 'CUSTOMER' when rider should go to delivery
 */
export function getRouteDestination(status: string): 'MERCHANT' | 'CUSTOMER' | null {
    const toMerchant = ['DRIVER_ASSIGNED', 'READY', 'CONFIRMED', 'PREPARING'];
    const toCustomer = ['PICKED_UP', 'IN_DELIVERY', 'ON_THE_WAY', 'DELIVERED'];

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
        'PICKED_UP',        // "Rider en camino hacia ti"
        'IN_DELIVERY',      // Alias for pickup confirmation
        'DELIVERED',        // "Tu pedido fue entregado"
    ];
    return notifiable.includes(status);
}

/**
 * Get customer-facing notification message for a status
 */
export const CUSTOMER_NOTIFICATION_MESSAGES: Record<string, string> = {
    PREPARING: '👨‍🍳 El comercio está preparando tu pedido',
    DRIVER_ASSIGNED: '🏍️ Un repartidor va en camino al comercio',
    PICKED_UP: '📦 Tu pedido fue retirado, viene en camino',
    IN_DELIVERY: '🚀 Tu pedido viene en camino hacia ti',
    DELIVERED: '✅ Tu pedido fue entregado, ¡disfrútalo!',
};

/**
 * Check if the order is in an active/ongoing state
 */
export function isActiveOrder(status: string): boolean {
    const activeStatuses = [
        'PENDING', 'CONFIRMED', 'PREPARING', 'READY',
        'DRIVER_ASSIGNED', 'PICKED_UP', 'IN_DELIVERY', 'ON_THE_WAY', 'DELIVERED'
    ];
    return activeStatuses.includes(status);
}

/**
 * Check if the order is completed (delivered or cancelled)
 */
export function isCompletedOrder(status: string): boolean {
    return status === 'DELIVERED' || status === 'COMPLETED' || status === 'CANCELLED';
}

/**
 * Get valid next statuses based on current status (for UI)
 */
export function getNextStatuses(currentStatus: string): OrderStatus[] {
    const transitions: Record<string, OrderStatus[]> = {
        PENDING: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['PREPARING', 'CANCELLED'],
        PREPARING: ['READY', 'CANCELLED'],
        READY: ['DRIVER_ASSIGNED', 'CANCELLED'],
        DRIVER_ASSIGNED: ['PICKED_UP', 'CANCELLED'],
        PICKED_UP: ['IN_DELIVERY'],
        IN_DELIVERY: ['DELIVERED'],
        ON_THE_WAY: ['DELIVERED'],
        DELIVERED: [],
        CANCELLED: [],
    };
    return transitions[currentStatus] || [];
}
