"use client";

import ErrorPage from "@/components/ui/ErrorPage";
import { useEffect } from "react";

export default function RepartidorError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[RepartidorError]", error);
    }, [error]);

    return (
        <ErrorPage
            error={error}
            reset={reset}
            portalName="Repartidor"
            backHref="/repartidor/dashboard"
            backLabel="Volver al dashboard"
            accentColor="green"
        />
    );
}
