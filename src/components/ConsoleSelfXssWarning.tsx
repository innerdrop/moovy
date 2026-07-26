"use client";

// fix/pwa-actualizacion-instantanea (2026-07-25): aviso anti-Self-XSS en la
// consola, como hacen Google y Facebook en sus páginas de login.
//
// La estafa que previene: convencer a un usuario de que abra DevTools y pegue
// código "para activar una función / ganar puntos / verificar la cuenta" — ese
// código corre con SU sesión y puede robarle la cuenta. El aviso aparece una
// sola vez, solo en producción (en dev ensuciaría la consola de trabajo).

import { useEffect } from "react";

export default function ConsoleSelfXssWarning() {
    useEffect(() => {
        if (process.env.NODE_ENV !== "production") return;

        try {
            console.log(
                "%c¡FRENÁ!",
                "color:#e60012;font-size:44px;font-weight:900;text-shadow:1px 1px 0 #fff;font-family:system-ui,sans-serif;"
            );
            console.log(
                "%cEsta consola es una herramienta para desarrolladores. Si alguien te dijo que copies y pegues algo acá para \"activar una función\", \"ganar puntos MOOVER\" o \"verificar tu cuenta\", ES UNA ESTAFA (se llama Self-XSS): ese código corre con tu sesión y pueden robarte la cuenta.",
                // Sin color forzado: la consola usa su color por defecto y se adapta
                // sola a tema claro u oscuro (con #17181c fijo era ilegible en dark).
                "font-size:15px;line-height:1.5;font-family:system-ui,sans-serif;"
            );
            console.log(
                "%cCerrá esta ventana y no pegues nada que no entiendas. ¿Dudas? Escribinos desde el chat de soporte en tu perfil.",
                "font-size:13px;font-family:system-ui,sans-serif;opacity:0.8;"
            );
        } catch {
            // Una consola exótica sin soporte de %c no puede romper la app.
        }
    }, []);

    return null;
}
