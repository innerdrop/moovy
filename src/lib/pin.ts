/**
 * PIN doble de entrega (ISSUE-001)
 *
 * - Pickup PIN: lo ve el comercio. El driver lo ingresa al retirar el pedido.
 * - Delivery PIN: se envía al buyer por push cuando el driver sale del comercio.
 *   El driver lo ingresa al entregar.
 *
 * Generación: crypto.randomInt para entropía criptográfica.
 * Comparación: timingSafeEqual para prevenir ataques de timing.
 * Formato: 6 dígitos con leading zeros (ej: "048291").
 */

import { randomInt, timingSafeEqual } from "crypto";

/**
 * Genera un PIN de 6 dígitos con leading zeros.
 * Rango: 000000-999999 (1M posibles combinaciones).
 *
 * Probabilidad de colisión en 100K pedidos/mes: ~0.5% (aceptable porque
 * el PIN es específico al orderId, no es un identificador global).
 */
export function generatePin(): string {
    const n = randomInt(0, 1_000_000);
    return n.toString().padStart(6, "0");
}

/**
 * Genera un par {pickup, delivery} garantizando que NO sean iguales.
 * Si coinciden (0.0001% de probabilidad), regenera el delivery PIN.
 */
export function generatePinPair(): { pickupPin: string; deliveryPin: string } {
    const pickupPin = generatePin();
    let deliveryPin = generatePin();
    while (deliveryPin === pickupPin) {
        deliveryPin = generatePin();
    }
    return { pickupPin, deliveryPin };
}

/**
 * Compara dos PINs con timing constante (resistente a timing attacks).
 * Retorna false si alguno es null/undefined/longitud distinta.
 */
export function verifyPin(input: string | null | undefined, stored: string | null | undefined): boolean {
    if (!input || !stored) return false;
    if (input.length !== stored.length) return false;

    try {
        const a = Buffer.from(input, "utf8");
        const b = Buffer.from(stored, "utf8");
        if (a.length !== b.length) return false;
        return timingSafeEqual(a, b);
    } catch {
        return false;
    }
}

/**
 * Sanitiza un input de PIN (elimina espacios, caracteres no numéricos).
 * Útil para tolerar inputs como "048 291" o "048-291".
 */
export function sanitizePinInput(input: string | null | undefined): string {
    if (!input) return "";
    return input.replace(/\D/g, "").slice(0, 6);
}

/**
 * Formatea un PIN "048291" como "048 291" para mostrar en UI.
 * Facilita la lectura visual y dictado verbal (driver ↔ comercio/buyer).
 */
export function formatPinForDisplay(pin: string | null | undefined): string {
    if (!pin || pin.length !== 6) return pin ?? "";
    return `${pin.slice(0, 3)} ${pin.slice(3)}`;
}

/**
 * Umbral de intentos fallidos antes de bloquear PIN verification.
 * Al 5to intento fallido el pedido queda bloqueado y se dispara alerta a admin.
 */
export const PIN_MAX_ATTEMPTS = 5;

/**
 * Distancia máxima (metros) permitida entre GPS del driver y destino
 * para aceptar validación de PIN. Previene fraude de "ingresé el PIN desde mi casa".
 */
export const PIN_GEOFENCE_METERS = 100;

/**
 * Distancia de gracia adicional para casos de GPS con poca precisión.
 * Si el GPS reporta accuracy > este valor, se usa un umbral más permisivo.
 */
export const PIN_GEOFENCE_GRACE_METERS = 50;

/**
 * Umbral de fraudScore que dispara suspensión automática del driver.
 *
 * Cada `PIN_LOCKED` (5 intentos fallidos en un pedido) incrementa fraudScore +1.
 * A los 3 incidentes, el driver queda suspendido automáticamente y su sesión se
 * invalida. El admin puede revertir manualmente desde /ops/fraude tras revisar
 * el contexto.
 *
 * Rationale: 3 bloqueos en distintos pedidos es estadísticamente imposible sin
 * intención maliciosa. Un driver honesto que se confunde de PIN 5 veces lo hace
 * a lo sumo 1 vez antes de pedir ayuda. 3 veces = patrón.
 *
 * Ver también: decisiones pendientes del fundador para ajuste fino post-launch.
 */
export const PIN_FRAUD_THRESHOLD = 3;
