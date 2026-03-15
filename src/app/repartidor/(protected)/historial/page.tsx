"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirect to dashboard — history is handled via the SPA HistoryView
export default function HistorialRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace("/repartidor/dashboard"); }, [router]);
    return null;
}
