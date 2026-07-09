// Derivación del precio FINAL de Moovy + metadata del recargo.
// Rama: feat/recargo-moovy-y-tamano-toggle
//
// Fuente ÚNICA de verdad del precio (server action de alta/edición + importador CSV
// + tests). Regla canónica: la comisión SIEMPRE cae sobre el precio final que devuelve
// esta función (valor de transacción), así el split basePrice/markupPercent es puramente
// cosmético y NO se puede gamear (bajar base + subir recargo no cambia la comisión).
//
//   - `price` = lo que paga el comprador y la base de comisión.
//   - `basePrice` / `markupPercent` = metadata no-cobrable (precio del local + recargo %).
//     Null cuando el comercio cargó el precio final directo o es un producto legacy.

export interface PricingInput {
    /** "markup" recalcula desde basePrice+markupPercent; cualquier otra cosa = directo. */
    priceMode?: string | null;
    /** Precio final tipeado directo por el comercio (modo directo). */
    price: number;
    basePrice?: number | null;
    markupPercent?: number | null;
}

export interface PricingResult {
    price: number;
    basePrice: number | null;
    markupPercent: number | null;
}

/**
 * Alta/edición de producto. En modo "markup" el precio se RECALCULA desde
 * basePrice×(1+markup/100) e ignora el `price` del cliente (anti-gaming). En modo
 * directo el precio va tal cual y no se guarda metadata de recargo.
 */
export function derivePricing(input: PricingInput): PricingResult {
    if (input.priceMode === "markup" && input.basePrice && input.basePrice > 0) {
        const markup = input.markupPercent ?? 0;
        const finalPrice = Math.round(input.basePrice * (1 + markup / 100));
        return { price: finalPrice, basePrice: input.basePrice, markupPercent: markup };
    }
    return { price: input.price, basePrice: null, markupPercent: null };
}

/**
 * Importador CSV. El precio mapeado del archivo es el del LOCAL del comercio. Le
 * aplicamos el recargo del lote para obtener el final. Escotilla `treatAsFinal`: el
 * comercio armó el archivo con precios ya finales → el mapeado va directo, sin metadata.
 * markupPercent 0 = base y final coinciden → tampoco guardamos el split.
 */
export function deriveImportPricing(
    mappedPrice: number,
    markupPercent: number,
    treatAsFinal: boolean,
): PricingResult {
    if (treatAsFinal || !(mappedPrice > 0) || markupPercent <= 0) {
        return { price: mappedPrice, basePrice: null, markupPercent: null };
    }
    const finalPrice = Math.round(mappedPrice * (1 + markupPercent / 100));
    return { price: finalPrice, basePrice: mappedPrice, markupPercent };
}
