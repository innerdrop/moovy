"use client";

import ErrorPage from "@/components/ui/ErrorPage";
import { useEffect } from "react";

export default function StoreError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[StoreError]", error);
    }, [error]);

    return (
        <ErrorPage
            error={error}
            reset={reset}
            portalName="Tienda"
            backHref="/"
            backLabel="Volver a la tienda"
            accentColor="red"
        />
    );
}
