"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirect to dashboard — profile is handled via the SPA ProfileView
export default function PerfilRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace("/repartidor/dashboard"); }, [router]);
    return null;
}
