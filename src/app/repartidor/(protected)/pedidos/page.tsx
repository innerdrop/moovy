"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirect to dashboard — all order management is handled via the SPA dashboard
export default function PedidosRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace("/repartidor/dashboard"); }, [router]);
    return null;
}
