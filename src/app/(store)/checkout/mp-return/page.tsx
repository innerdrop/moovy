"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2, Clock } from "lucide-react";

interface PaymentStatus {
    orderId: string;
    orderNumber: string;
    orderStatus: string;
    paymentStatus: string;
    mpStatus: string | null;
    paidAt: string | null;
}

export default function MpReturnPage() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get("orderId");

    const [status, setStatus] = useState<PaymentStatus | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [timedOut, setTimedOut] = useState(false);

    const pollStatus = useCallback(async () => {
        if (!orderId) return null;
        try {
            const res = await fetch(`/api/payments/${orderId}/status`);
            if (!res.ok) throw new Error("Error consultando estado");
            return (await res.json()) as PaymentStatus;
        } catch {
            return null;
        }
    }, [orderId]);

    useEffect(() => {
        if (!orderId) {
            setError("No se encontró el ID de la orden");
            return;
        }

        let active = true;
        let pollCount = 0;
        const maxPolls = 20; // 20 * 3s = 60s timeout

        const poll = async () => {
            if (!active) return;

            const result = await pollStatus();
            if (!active) return;

            if (result) {
                setStatus(result);

                // If payment is resolved (PAID or FAILED), stop polling
                if (result.paymentStatus === "PAID" || result.paymentStatus === "FAILED") {
                    return;
                }
            }

            pollCount++;
            if (pollCount >= maxPolls) {
                setTimedOut(true);
                return;
            }

            // Continue polling
            setTimeout(poll, 3000);
        };

        poll();

        return () => {
            active = false;
        };
    }, [orderId, pollStatus]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold mb-2">Error</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Link href="/mis-pedidos" className="btn-primary inline-block">
                        Ir a mis pedidos
                    </Link>
                </div>
            </div>
        );
    }

    // Payment confirmed
    if (status?.paymentStatus === "PAID") {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">¡Pago confirmado!</h1>
                    <p className="text-gray-600 mb-2">
                        Tu pedido <span className="font-semibold">{status.orderNumber}</span> fue pagado con éxito.
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                        Te enviamos un email con los detalles de tu compra.
                    </p>
                    <Link href="/mis-pedidos" className="btn-primary inline-block">
                        Ver mis pedidos
                    </Link>
                </div>
            </div>
        );
    }

    // Payment failed/rejected
    if (status?.paymentStatus === "FAILED") {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Pago rechazado</h1>
                    <p className="text-gray-600 mb-2">
                        No pudimos procesar el pago de tu pedido <span className="font-semibold">{status.orderNumber}</span>.
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                        Podés intentar nuevamente o elegir otro método de pago.
                    </p>
                    <div className="flex flex-col gap-3">
                        <Link href="/checkout" className="btn-primary inline-block">
                            Volver al checkout
                        </Link>
                        <Link href="/mis-pedidos" className="btn-outline inline-block">
                            Ver mis pedidos
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Timed out waiting
    if (timedOut) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Procesando tu pago</h1>
                    <p className="text-gray-600 mb-2">
                        El pago de tu pedido <span className="font-semibold">{status?.orderNumber}</span> está siendo procesado.
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                        Te notificaremos por email cuando se confirme. Esto puede tomar unos minutos.
                    </p>
                    <Link href="/mis-pedidos" className="btn-primary inline-block">
                        Ir a mis pedidos
                    </Link>
                </div>
            </div>
        );
    }

    // Loading / polling
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="text-center max-w-md">
                <Loader2 className="w-16 h-16 text-moovy mx-auto mb-4 animate-spin" />
                <h1 className="text-2xl font-bold mb-2">Verificando tu pago...</h1>
                <p className="text-gray-600">
                    Estamos confirmando tu pago con MercadoPago. No cierres esta página.
                </p>
            </div>
        </div>
    );
}
