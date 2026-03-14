"use client";

import ErrorPage from "@/components/ui/ErrorPage";
import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[GlobalError]", error);
    }, [error]);

    return (
        <ErrorPage
            error={error}
            reset={reset}
            backHref="/"
            backLabel="Ir al inicio"
            accentColor="red"
        />
    );
}
