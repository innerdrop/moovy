// Reglas compartidas de direcciones del comprador.
// Rama: feat/direcciones-limite-y-chip-header
//
// Regla acumulada #7: campos/límites condicionales con helper centralizado,
// consumido por el cliente (UI) Y el servidor (endpoint). La UI esconde el
// botón, pero la defensa real es el chequeo server-side (regla #1).

/** Máximo de direcciones guardadas activas por usuario. */
export const MAX_SAVED_ADDRESSES = 2;

/** Mensaje único para UI y API cuando se alcanza el límite. */
export const MAX_ADDRESSES_MESSAGE = `Podés tener hasta ${MAX_SAVED_ADDRESSES} direcciones guardadas. Eliminá una para agregar otra.`;

/** Formato corto para mostrar una dirección en chips/listas ("Av. Maipú 263"). */
export function formatAddressShort(a: { street: string; number: string }): string {
    return `${a.street} ${a.number}`.trim();
}
