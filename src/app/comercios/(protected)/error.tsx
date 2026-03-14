"use client";

import ErrorPage from "@/components/ui/ErrorPage";
import { useEffect } from "react";

export default function ComercioError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[ComercioError]", error);
    }, [error]);

    return (
        <ErrorPage
            error={error}
            reset={reset}
            portalName="Comercio"
            backHref="/comercios"
            backLabel="Volver al panel"
            accentColor="blue"
        />
    );
}
