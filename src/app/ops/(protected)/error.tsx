"use client";

import ErrorPage from "@/components/ui/ErrorPage";
import { useEffect } from "react";

export default function OpsError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[OpsError]", error);
    }, [error]);

    return (
        <ErrorPage
            error={error}
            reset={reset}
            portalName="Operaciones"
            backHref="/ops"
            backLabel="Volver al panel"
            accentColor="red"
        />
    );
}
