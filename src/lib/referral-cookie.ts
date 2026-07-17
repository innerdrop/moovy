// feat/login-google (atribución de referidos): cookie de "último-toque".
//
// Problema: el código de referido viaja bien en el registro por email (va en el
// body), pero con Google el navegador se va a google.com y vuelve, perdiendo la
// URL (?ref=) y lo tipeado. Solución estándar de la industria: guardar el código
// en una cookie cuando la persona cae en un link de referido (o tipea uno), y
// leerla server-side al crear la cuenta — no importa el método de registro.
//
// ÚLTIMO-TOQUE: cada código nuevo pisa al anterior (la última acción deliberada
// refleja la intención final). El registro muestra "Te invitó [Nombre]" para que
// la persona confirme o cambie antes de darle los puntos a alguien.

import { cookies } from "next/headers";

export const REF_COOKIE = "moovy_ref";
/** 60 días: cubre "hago click hoy, me registro más adelante". */
export const REF_COOKIE_MAX_AGE = 60 * 60 * 24 * 60;

/** Lee el código de referido de la cookie (server-side). Tolera contextos sin cookies. */
export async function readReferralCodeFromCookie(): Promise<string | null> {
    try {
        const store = await cookies();
        const value = store.get(REF_COOKIE)?.value;
        return value ? value.trim().toUpperCase() : null;
    } catch {
        return null;
    }
}

/** Borra la cookie tras atribuir (best-effort; si falla, expira sola y no re-atribuye). */
export async function clearReferralCookie(): Promise<void> {
    try {
        const store = await cookies();
        store.delete(REF_COOKIE);
    } catch {
        // Contextos donde la cookie es read-only: se ignora. Un referido solo se
        // atribuye al CREAR el usuario, así que una cookie vieja no duplica nada.
    }
}
