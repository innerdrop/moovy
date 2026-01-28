"use client";

// Checkout Page - Página de Checkout
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { usePointsCelebration } from "@/store/pointsCelebration";
import { formatPrice } from "@/lib/delivery";
import PointsWidget from "@/components/checkout/PointsWidget";
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
import { AddressAutocomplete } from "@/components/forms/AddressAutocomplete";

interface DeliveryResult {
    distanceKm: number;
    totalCost: number;
    isWithinRange: boolean;
    isFreeDelivery: boolean;
    message: string;
    isRealRoadDistance?: boolean;
}

export default function CheckoutPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const showCelebration = usePointsCelebration((state) => state.showCelebration);
    const items = useCartStore((state) => state.items);
    const getTotalPrice = useCartStore((state) => state.getTotalPrice);
    const clearCart = useCartStore((state) => state.clearCart);

    const [step, setStep] = useState(1);
    const [address, setAddress] = useState({
        street: "",
        number: "",
        floor: "",
        city: "",
        notes: "",
        latitude: undefined as number | undefined,
        longitude: undefined as number | undefined,
    });
    // Validated Address ID (from saved addresses)
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
    const [isNewAddress, setIsNewAddress] = useState(false);
    const [loadingAddresses, setLoadingAddresses] = useState(true);

    const [deliveryResult, setDeliveryResult] = useState<DeliveryResult | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "mercadopago">("cash");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [saveAddress, setSaveAddress] = useState(false);
    const [addressLabel, setAddressLabel] = useState("Casa");

    // Points state
    const [pointsUsed, setPointsUsed] = useState(0);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [earnedPoints, setEarnedPoints] = useState(0);

    const subtotal = getTotalPrice();
    const deliveryCost = deliveryResult?.isWithinRange && !deliveryResult.isFreeDelivery ? deliveryResult.totalCost : 0;
    const finalTotal = Math.max(0, subtotal + deliveryCost - discountAmount);

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

    // Fetch saved addresses
    useEffect(() => {
        if (status === "authenticated") {
            fetch("/api/profile/addresses")
                .then((res) => res.json())
                .then((data) => {
                    if (Array.isArray(data)) {
                        setSavedAddresses(data);
                        // Auto-select default address if exists
                        const defaultAddr = data.find((a: any) => a.isDefault);
                        if (defaultAddr) {
                            selectAddress(defaultAddr);
                        } else if (data.length > 0) {
                            // Or select the first one
                            selectAddress(data[0]);
                        } else {
                            // No addresses, show form
                            setIsNewAddress(true);
                        }
                    }
                })
                .catch((err) => console.error("Error loading addresses", err))
                .finally(() => setLoadingAddresses(false));
        }
    }, [status]);

    const selectAddress = (addr: any) => {
        setSelectedAddressId(addr.id);
        setIsNewAddress(false);
        setAddress({
            street: addr.street,
            number: addr.number,
            floor: addr.apartment || "",
            city: addr.city,
            notes: "",
            latitude: addr.latitude || undefined,
            longitude: addr.longitude || undefined,
        });
        // Reset delivery calculation when address changes
        setDeliveryResult(null);
    };

    const handleNewAddress = () => {
        setSelectedAddressId(null);
        setIsNewAddress(true);
        setAddress({
            street: "",
            number: "",
            floor: "",
            city: "Ushuaia",
            notes: "",
            latitude: undefined,
            longitude: undefined,
        });
        setDeliveryResult(null);
    };

    // Calculate delivery cost using server-side geocoding
    const calculateDelivery = async () => {
        if (!address.street || !address.number) {
            return;
        }

        setIsCalculating(true);

        try {
            // Send address to server - server handles geocoding
            const calcResponse = await fetch("/api/delivery/calculate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    address: {
                        street: address.street,
                        number: address.number,
                        city: address.city || "Ushuaia",
                        latitude: address.latitude,
                        longitude: address.longitude,
                    },
                    merchantId: useCartStore.getState().merchantId,
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
            const merchantId = useCartStore.getState().merchantId;
            if (!merchantId) {
                alert("Error: No se identificó el comercio. Por favor vaciá el carrito e intentá de nuevo.");
                setIsSubmitting(false);
                return;
            }

            // If user wants to save the address and it's a new one
            if (isNewAddress && saveAddress) {
                try {
                    await fetch("/api/profile/addresses", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            label: addressLabel,
                            street: address.street,
                            number: address.number,
                            floor: address.floor,
                            city: address.city,
                            latitude: address.latitude,
                            longitude: address.longitude,
                            isDefault: savedAddresses.length === 0 // Make default if it's the first one
                        })
                    });
                } catch (addrErr) {
                    console.error("Error saving address to profile:", addrErr);
                    // We don't block the order if address saving fails
                }
            }

            // Create order via API
            const response = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: items.map(item => ({
                        productId: item.productId,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        variantId: item.variantId,
                        variantName: item.variantName,
                    })),
                    merchantId: useCartStore.getState().merchantId, // Get current merchant
                    // Send addressId if selected, otherwise addressData
                    addressId: selectedAddressId || undefined,
                    addressData: !selectedAddressId ? {
                        street: address.street,
                        number: address.number,
                        floor: address.floor,
                        city: address.city,
                        latitude: address.latitude,
                        longitude: address.longitude,
                    } : undefined,
                    paymentMethod,
                    deliveryFee: deliveryResult.isFreeDelivery ? 0 : deliveryResult.totalCost,
                    distanceKm: deliveryResult.distanceKm,
                    deliveryNotes: address.notes || null,
                    // Points data
                    pointsUsed,
                    discountAmount,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Error al crear el pedido");
            }

            // Clear cart and redirect to orders page
            clearCart();
            const result = await response.json();
            if (result.points?.earned) {
                setEarnedPoints(result.points.earned);
                showCelebration(result.points.earned);
            }
            // Redirect to "Mis Pedidos" so user can track their order immediately
            router.push("/mis-pedidos");
        } catch (error) {
            console.error("Error submitting order:", error);
            alert(error instanceof Error ? error.message : "Error al procesar el pedido");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-moovy" />
            </div>
        );
    }

    if (orderSuccess) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <div className="max-w-md mx-auto relative">
                    {/* Points celebration is now handled globally via Providers */}

                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-navy mb-4">
                        ¡Pedido Confirmado!
                    </h1>
                    <p className="text-gray-600 mb-8">
                        Tu pedido fue recibido. Te avisaremos cuando el repartidor esté en camino.
                        {earnedPoints > 0 && (
                            <span className="block mt-4 font-semibold text-[#e60012]">
                                ¡Sumaste {earnedPoints} puntos con esta compra! 🎉
                            </span>
                        )}
                    </p>
                    <Link href="/productos" className="btn-primary">
                        Seguir Comprando
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 pb-32">
            <div className="max-w-4xl mx-auto">
                {/* Back Link */}
                <Link
                    href="/productos"
                    className="inline-flex items-center text-gray-600 hover:text-moovy mb-6"
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
                            className={`flex-1 text-center pb-4 border-b-2 ${step >= s ? "border-moovy text-moovy" : "border-gray-200 text-gray-400"
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
                                    <MapPin className="w-5 h-5 text-moovy" />
                                    Dirección de Entrega
                                </h2>

                                {/* Saved Addresses List */}
                                {!loadingAddresses && savedAddresses.length > 0 && (
                                    <div className="mb-6 space-y-3">
                                        <p className="text-sm font-medium text-gray-700">Mis direcciones guardadas:</p>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {savedAddresses.map((addr: any) => (
                                                <button
                                                    key={addr.id}
                                                    onClick={() => selectAddress(addr)}
                                                    className={`text-left p-3 rounded-xl border-2 transition relative ${selectedAddressId === addr.id
                                                        ? "border-moovy bg-moovy-light"
                                                        : "border-gray-100 hover:border-gray-200"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-navy text-sm">{addr.label}</span>
                                                        {selectedAddressId === addr.id && (
                                                            <CheckCircle className="w-4 h-4 text-moovy absolute top-3 right-3" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 line-clamp-1">
                                                        {addr.street} {addr.number}
                                                    </p>
                                                </button>
                                            ))}

                                            {/* New Address Button in Grid */}
                                            <button
                                                onClick={handleNewAddress}
                                                className={`text-left p-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition ${isNewAddress
                                                    ? "border-moovy bg-gray-50 text-moovy"
                                                    : "border-gray-300 text-gray-500 hover:border-gray-400"
                                                    }`}
                                            >
                                                <span className="font-semibold text-sm">+ Nueva Dirección</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Address Form */}
                                {(isNewAddress || savedAddresses.length === 0) ? (
                                    <div className="space-y-4 animate-fadeIn">
                                        <div className="md:col-span-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Dirección *
                                            </label>
                                            <AddressAutocomplete
                                                value={address.street && address.number ? `${address.street} ${address.number}` : address.street}
                                                onChange={(val, lat, lng, street, num) => {
                                                    setAddress({
                                                        ...address,
                                                        street: street || val,
                                                        number: num || "",
                                                        latitude: lat,
                                                        longitude: lng,
                                                    });
                                                }}
                                                placeholder="Buscá tu calle y número..."
                                            />
                                        </div>

                                        <div className="grid md:grid-cols-1 gap-4 mt-4">
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
                                        </div>
                                    </div>
                                ) : (
                                    // Read-only view of selected address
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-navy">Vas a recibir en:</p>
                                            <p className="text-gray-600">
                                                {address.street} {address.number}
                                                {address.floor ? ` (${address.floor})` : ""}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">{address.city}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Common Note Field */}
                                <div className="mt-4">
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

                                {isNewAddress && (
                                    <div className="mt-6 flex flex-col gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={saveAddress}
                                                onChange={(e) => setSaveAddress(e.target.checked)}
                                                className="w-5 h-5 rounded border-gray-300 text-moovy focus:ring-moovy"
                                            />
                                            <span className="text-sm font-semibold text-navy">Guardar dirección para futuros pedidos</span>
                                        </label>

                                        {saveAddress && (
                                            <div className="animate-fadeIn pl-8">
                                                <label className="block text-xs font-bold text-blue-800 mb-1 uppercase tracking-wider">
                                                    Etiqueta (ej: Casa, Trabajo)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={addressLabel}
                                                    onChange={(e) => setAddressLabel(e.target.value)}
                                                    className="w-full max-w-xs px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-moovy bg-white"
                                                    placeholder="Nombre de la ubicación..."
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                <button
                                    onClick={() => {
                                        calculateDelivery();
                                        setStep(2);
                                    }}
                                    disabled={!address.street || !address.number}
                                    className="btn-primary w-full py-3 mt-4"
                                >
                                    Continuar
                                </button>
                            </div>
                        )}

                        {/* Step 2: Delivery */}
                        {step === 2 && (
                            <div className="bg-white rounded-xl p-6 shadow-sm">
                                <h2 className="text-xl font-bold text-navy mb-4 flex items-center gap-2">
                                    <Truck className="w-5 h-5 text-moovy" />
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
                                        className="text-moovy text-sm hover:underline mt-1"
                                    >
                                        Cambiar dirección
                                    </button>
                                </div>

                                {isCalculating ? (
                                    <div className="text-center py-8">
                                        <Loader2 className="w-8 h-8 animate-spin text-moovy mx-auto mb-2" />
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
                                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                                    Distancia: {deliveryResult.distanceKm.toFixed(1)} km
                                                    {deliveryResult.isRealRoadDistance && (
                                                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase">Recorrido real</span>
                                                    )}
                                                </p>
                                                {!deliveryResult.isFreeDelivery && (
                                                    <p className="text-xl font-bold text-moovy mt-2">
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
                            <div className="space-y-6">
                                <div className="bg-white rounded-xl p-6 shadow-sm">
                                    <h2 className="text-xl font-bold text-navy mb-4 flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-moovy" />
                                        Método de Pago
                                    </h2>

                                    {/* POINTS WIDGET */}
                                    <div className="mb-6">
                                        <PointsWidget
                                            orderTotal={subtotal}
                                            pointsApplied={pointsUsed}
                                            onApplyPoints={(points, discount) => {
                                                setPointsUsed(points);
                                                setDiscountAmount(discount);
                                            }}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${paymentMethod === "cash" ? "border-moovy bg-moovy-light" : "border-gray-200"
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

                                        <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition opacity-50 ${paymentMethod === "mercadopago" ? "border-moovy bg-moovy-light" : "border-gray-200"
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
                                            <span className="flex items-center gap-2">
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        Procesando...
                                                    </>
                                                ) : (
                                                    "Confirmar Pedido"
                                                )}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
                            <h3 className="text-lg font-bold text-navy mb-4 flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-moovy" />
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
                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600 font-medium">
                                        <span>Descuento (Puntos)</span>
                                        <span>-{formatPrice(discountAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-xl font-bold border-t pt-3">
                                    <span>Total</span>
                                    <span className="text-moovy">
                                        {formatPrice(finalTotal)}
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

