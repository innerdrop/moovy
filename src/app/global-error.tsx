"use client";

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
        <html lang="es">
            <body style={{ margin: 0, fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>
                <div style={{
                    minHeight: "100vh",
                    background: "#f9fafb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "16px",
                }}>
                    <div style={{
                        background: "#fff",
                        borderRadius: "16px",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,.1)",
                        padding: "48px 32px",
                        maxWidth: "400px",
                        width: "100%",
                        textAlign: "center",
                    }}>
                        {/* Logo inline SVG fallback */}
                        <div style={{ marginBottom: "24px" }}>
                            <img src="/logo-moovy.svg" alt="MOOVY" width={120} height={38} />
                        </div>

                        {/* Error icon */}
                        <div style={{
                            width: "64px",
                            height: "64px",
                            background: "#fef2f2",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 24px",
                            fontSize: "32px",
                        }}>
                            ⚠️
                        </div>

                        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
                            Error crítico
                        </h1>
                        <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 32px" }}>
                            La aplicación encontró un error grave. Intentá recargar la página.
                        </p>

                        {error.digest && (
                            <p style={{
                                fontSize: "11px",
                                color: "#9ca3af",
                                fontFamily: "monospace",
                                background: "#f9fafb",
                                borderRadius: "8px",
                                padding: "8px",
                                marginBottom: "24px",
                                wordBreak: "break-all",
                            }}>
                                Error ID: {error.digest}
                            </p>
                        )}

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <button
                                onClick={() => reset()}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                    padding: "12px 24px",
                                    background: "#e60012",
                                    color: "#fff",
                                    fontWeight: 600,
                                    borderRadius: "12px",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                }}
                            >
                                Reintentar
                            </button>
                            <a
                                href="/"
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                    padding: "12px 24px",
                                    background: "#f3f4f6",
                                    color: "#374151",
                                    fontWeight: 600,
                                    borderRadius: "12px",
                                    textDecoration: "none",
                                    fontSize: "14px",
                                }}
                            >
                                Ir al inicio
                            </a>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
