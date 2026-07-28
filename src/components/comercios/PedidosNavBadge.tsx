"use client";

// Contador de pedidos SIN RESPONDER en la barra del comercio.
//
// fix/comercio-pausa-stock-y-ajustes (founder 07-27): "el botón más importante
// para el comercio debe ser el de los pedidos". Reordenarlo al centro ayuda,
// pero el consejo fue tajante: el problema real no es dónde está el botón —
// es que el comerciante NO SE ENTERA. Por eso el ícono además grita.
//
// Qué cuenta: pedidos que esperan una decisión del comercio (aceptar/rechazar).
// Se limpia cuando el comerciante ACEPTA o RECHAZA — nunca por el solo hecho de
// abrir la pestaña: un contador que se apaga al mirarlo miente.
//
// El layout del panel NO se re-renderiza al navegar (ver comentario en
// layout.tsx), así que el conteo vive en el cliente: poll liviano cada 30s
// contra un endpoint que devuelve SOLO el número, + refresco al volver a la app.

import { useCallback, useEffect, useState } from "react";

export default function PedidosNavBadge() {
    const [count, setCount] = useState(0);

    const fetchCount = useCallback(async () => {
        try {
            const res = await fetch("/api/merchant/orders/pendientes");
            if (!res.ok) return;
            const data = await res.json();
            if (typeof data.count === "number") setCount(data.count);
        } catch {
            // Sin red: dejamos el último valor conocido (mejor que parpadear a 0).
        }
    }, []);

    useEffect(() => {
        fetchCount();
        const interval = setInterval(fetchCount, 30000);
        // Al volver a la app (el comerciante deja el teléfono y vuelve) el conteo
        // se refresca al instante, sin esperar el próximo ciclo de 30s.
        const onFocus = () => fetchCount();
        window.addEventListener("focus", onFocus);
        document.addEventListener("visibilitychange", onFocus);
        return () => {
            clearInterval(interval);
            window.removeEventListener("focus", onFocus);
            document.removeEventListener("visibilitychange", onFocus);
        };
    }, [fetchCount]);



    if (count <= 0) return null;

    return (
        <span
            aria-label={`${count} pedido${count === 1 ? "" : "s"} sin responder`}
            className="absolute -top-1 right-1/2 translate-x-[18px] min-w-[18px] h-[18px] px-1 rounded-full bg-[#e60012] text-white text-[10px] font-black leading-[18px] text-center ring-2 ring-white"
        >
            {count > 9 ? "9+" : count}
        </span>
    );
}
