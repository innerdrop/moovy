"use client";

import ErrorPage from "@/components/ui/ErrorPage";
import { useEffect } from "react";

export default function VendedorError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[VendedorError]", error);
    }, [error]);

    return (
        <ErrorPage
            error={error}
            reset={reset}
            portalName="Vendedor"
            backHref="/vendedor"
            backLabel="Volver al panel"
            accentColor="emerald"
        />
    );
}
