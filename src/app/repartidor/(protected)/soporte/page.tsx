"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirect to dashboard — support is handled via the SPA SupportView
export default function SoporteRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace("/repartidor/dashboard"); }, [router]);
    return null;
}
