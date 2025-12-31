"use client";

// Checkout Page - Página de Checkout
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/delivery";
import {
    MapPin,
    Truck,
    CreditCard,
    ShoppingBag,
    ChevronLeft,
    Loader2,
    CheckCircle,
    AlertCircle
} from "lucide-react";

interface DeliveryResult {
    distanceKm: number;
    totalCost: number;
    isWithinRange: boolean;
    isFreeDelivery: boolean;
    message: string;
}

export default function CheckoutPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const items = useCartStore((state) => state.items);
    const getTotalPrice = useCartStore((state) => state.getTotalPrice);
    const clearCart = useCartStore((state) => state.clearCart);

    const [step, setStep] = useState(1);
    const [address, setAddress] = useState({
        street: "",
        number: "",
        floor: "",
        city: "San Juan",
        notes: "",
    });
    const [deliveryResult, setDeliveryResult] = useState<DeliveryResult | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "mercadopago">("cash");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    const subtotal = getTotalPrice();

    // Redirect if cart is empty
    useEffect(() => {
        if (items.length === 0 && !orderSuccess) {
            router.push("/productos");
        }
    }, [items, orderSuccess, router]);

    // Redirect if not logged in
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login?redirect=/checkout");
        }
    }, [status, router]);

    // Calculate delivery cost using geocoding
    const calculateDelivery = async () => {
        if (!address.street || !address.number) {
            return;
        }

        setIsCalculating(true);

        try {
            // Use Nominatim for geocoding
            const fullAddress = `${address.street} ${address.number}, ${address.city}, San Juan, Argentina`;
            const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`;

            const geoResponse = await fetch(geocodeUrl, {
                headers: { "User-Agent": "PolirrubroSanJuan/1.0" }
            });
            const geoData = await geoResponse.json();

            if (geoData.length === 0) {
                setDeliveryResult({
                    distanceKm: 0,
                    totalCost: 0,
                    isWithinRange: false,
                    isFreeDelivery: false,
                    message: "No pudimos encontrar la dirección. Por favor, verificá los datos.",
                });
                return;
            }

            const { lat, lon } = geoData[0];

            // Calculate delivery cost
            const calcResponse = await fetch("/api/delivery/calculate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    destinationLat: lat,
                    destinationLng: lon,
                    orderTotal: subtotal,
                }),
            });

            const result = await calcResponse.json();
            setDeliveryResult(result);
        } catch (error) {
            console.error("Error calculating delivery:", error);
            setDeliveryResult({
                distanceKm: 0,
                totalCost: 0,
                isWithinRange: false,
                isFreeDelivery: false,
                message: "Error al calcular el envío. Intenta de nuevo.",
            });
        } finally {
            setIsCalculating(false);
        }
    };

    const handleSubmitOrder = async () => {
        if (!deliveryResult?.isWithinRange) return;

        setIsSubmitting(true);

        try {
            // Simulate order creation
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Clear cart and show success
            clearCart();
            setOrderSuccess(true);
        } catch (error) {
            console.error("Error submitting order:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-turquoise" />
            </div>
        );
    }

    if (orderSuccess) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-navy mb-4">
                        ¡Pedido Confirmado!
                    </h1>
                    <p className="text-gray-600 mb-8">
                        Tu pedido fue recibido. Te avisaremos cuando el repartidor esté en camino.
                    </p>
                    <Link href="/productos" className="btn-primary">
                        Seguir Comprando
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Back Link */}
                <Link
                    href="/productos"
                    className="inline-flex items-center text-gray-600 hover:text-turquoise mb-6"
                >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    Seguir comprando
                </Link>

                <h1 className="text-3xl font-bold text-navy mb-8">Checkout</h1>

                {/* Steps */}
                <div className="flex mb-8">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={`flex-1 text-center pb-4 border-b-2 ${step >= s ? "border-turquoise text-turquoise" : "border-gray-200 text-gray-400"
                                }`}
                        >
                            <span className="font-semibold">
                                {s === 1 ? "Dirección" : s === 2 ? "Envío" : "Pago"}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Step 1: Address */}
                        {step === 1 && (
                            <div className="bg-white rounded-xl p-6 shadow-sm">
                                <h2 className="text-xl font-bold text-navy mb-4 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-turquoise" />
                                    Dirección de Entrega
                                </h2>

                                <div className="space-y-4">
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Calle *
                                            </label>
                                            <input
                                                type="text"
                                                value={address.street}
                                                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                                                placeholder="Av. Libertador"
                                                className="input"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Número *
                                            </label>
                                            <input
                                                type="text"
                                                value={address.number}
                                                onChange={(e) => setAddress({ ...address, number: e.target.value })}
                                                placeholder="123"
                                                className="input"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Piso/Depto (opcional)
                                            </label>
                                            <input
                                                type="text"
                                                value={address.floor}
                                                onChange={(e) => setAddress({ ...address, floor: e.target.value })}
                                                placeholder="1°A"
                                                className="input"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Ciudad
                                            </label>
                                            <input
                                                type="text"
                                                value={address.city}
                                                className="input bg-gray-50"
                                                disabled
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Notas para el repartidor
                                        </label>
                                        <textarea
                                            value={address.notes}
                                            onChange={(e) => setAddress({ ...address, notes: e.target.value })}
                                            placeholder="Ej: Tocar timbre, dejar en portería..."
                                            className="input resize-none"
                                            rows={2}
                                        />
                                    </div>

                                    <button
                                        onClick={() => {
                                            calculateDelivery();
                                            setStep(2);
                                        }}
                                        disabled={!address.street || !address.number}
                                        className="btn-primary w-full py-3"
                                    >
                                        Continuar
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Delivery */}
                        {step === 2 && (
                            <div className="bg-white rounded-xl p-6 shadow-sm">
                                <h2 className="text-xl font-bold text-navy mb-4 flex items-center gap-2">
                                    <Truck className="w-5 h-5 text-turquoise" />
                                    Costo de Envío
                                </h2>

                                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                    <p className="font-medium">Entregar en:</p>
                                    <p className="text-gray-600">
                                        {address.street} {address.number}
                                        {address.floor ? `, ${address.floor}` : ""}
                                    </p>
                                    <button
                                        onClick={() => setStep(1)}
                                        className="text-turquoise text-sm hover:underline mt-1"
                                    >
                                        Cambiar dirección
                                    </button>
                                </div>

                                {isCalculating ? (
                                    <div className="text-center py-8">
                                        <Loader2 className="w-8 h-8 animate-spin text-turquoise mx-auto mb-2" />
                                        <p className="text-gray-600">Calculando envío...</p>
                                    </div>
                                ) : deliveryResult ? (
                                    <div className={`p-4 rounded-lg ${deliveryResult.isWithinRange
                                            ? "bg-green-50 border border-green-200"
                                            : "bg-red-50 border border-red-200"
                                        }`}>
                                        {deliveryResult.isWithinRange ? (
                                            <>
                                                <div className="flex items-center gap-2 text-green-700 mb-2">
                                                    <CheckCircle className="w-5 h-5" />
                                                    <span className="font-semibold">
                                                        {deliveryResult.isFreeDelivery ? "¡Envío Gratis!" : "Envío disponible"}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    Distancia: {deliveryResult.distanceKm.toFixed(1)} km
                                                </p>
                                                {!deliveryResult.isFreeDelivery && (
                                                    <p className="text-xl font-bold text-turquoise mt-2">
                                                        Costo: {formatPrice(deliveryResult.totalCost)}
                                                    </p>
                                                )}
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-2 text-red-700">
                                                <AlertCircle className="w-5 h-5" />
                                                <span>{deliveryResult.message}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : null}

                                <div className="flex gap-4 mt-6">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="btn-outline flex-1"
                                    >
                                        Atrás
                                    </button>
                                    <button
                                        onClick={() => setStep(3)}
                                        disabled={!deliveryResult?.isWithinRange}
                                        className="btn-primary flex-1"
                                    >
                                        Continuar
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Payment */}
                        {step === 3 && (
                            <div className="bg-white rounded-xl p-6 shadow-sm">
                                <h2 className="text-xl font-bold text-navy mb-4 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-turquoise" />
                                    Método de Pago
                                </h2>

                                <div className="space-y-3">
                                    <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${paymentMethod === "cash" ? "border-turquoise bg-turquoise-light" : "border-gray-200"
                                        }`}>
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="cash"
                                            checked={paymentMethod === "cash"}
                                            onChange={() => setPaymentMethod("cash")}
                                            className="sr-only"
                                        />
                                        <div className="flex-1">
                                            <span className="font-semibold">💵 Efectivo</span>
                                            <p className="text-sm text-gray-600">Pagás al recibir el pedido</p>
                                        </div>
                                    </label>

                                    <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition opacity-50 ${paymentMethod === "mercadopago" ? "border-turquoise bg-turquoise-light" : "border-gray-200"
                                        }`}>
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="mercadopago"
                                            checked={paymentMethod === "mercadopago"}
                                            onChange={() => setPaymentMethod("mercadopago")}
                                            className="sr-only"
                                            disabled
                                        />
                                        <div className="flex-1">
                                            <span className="font-semibold">💳 Mercado Pago</span>
                                            <p className="text-sm text-gray-600">Próximamente...</p>
                                        </div>
                                    </label>
                                </div>

                                <div className="flex gap-4 mt-6">
                                    <button
                                        onClick={() => setStep(2)}
                                        className="btn-outline flex-1"
                                    >
                                        Atrás
                                    </button>
                                    <button
                                        onClick={handleSubmitOrder}
                                        disabled={isSubmitting}
                                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Procesando...
                                            </>
                                        ) : (
                                            "Confirmar Pedido"
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
                            <h3 className="text-lg font-bold text-navy mb-4 flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-turquoise" />
                                Tu Pedido
                            </h3>

                            <ul className="divide-y mb-4">
                                {items.map((item) => (
                                    <li key={item.id} className="py-3 flex justify-between">
                                        <div>
                                            <p className="font-medium text-sm">{item.name}</p>
                                            <p className="text-xs text-gray-500">x{item.quantity}</p>
                                        </div>
                                        <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                                    </li>
                                ))}
                            </ul>

                            <div className="border-t pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal</span>
                                    <span>{formatPrice(subtotal)}</span>
                                </div>
                                {deliveryResult?.isWithinRange && (
                                    <div className="flex justify-between text-sm">
                                        <span>Envío</span>
                                        <span className={deliveryResult.isFreeDelivery ? "text-green-600" : ""}>
                                            {deliveryResult.isFreeDelivery
                                                ? "GRATIS"
                                                : formatPrice(deliveryResult.totalCost)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between text-xl font-bold border-t pt-3">
                                    <span>Total</span>
                                    <span className="text-turquoise">
                                        {formatPrice(
                                            subtotal +
                                            (deliveryResult?.isWithinRange && !deliveryResult.isFreeDelivery
                                                ? deliveryResult.totalCost
                                                : 0)
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
