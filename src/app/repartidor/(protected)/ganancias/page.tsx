"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirect to dashboard — earnings are handled via the SPA EarningsView
export default function GananciasRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace("/repartidor/dashboard"); }, [router]);
    return null;
}
