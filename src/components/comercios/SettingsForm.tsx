"use client";

import { useState } from "react";
import { updateMerchant, toggleMerchantOpen } from "@/app/comercios/actions";
import { Loader2, Save, Power, DollarSign, Truck, ShoppingBag, Info, Percent, Link2, Unlink, AlertTriangle, CheckCircle, FileText } from "lucide-react";

interface SettingsFormProps {
    merchant: {
        id: string;
        name: string;
        image: string;
        isOpen: boolean;
        deliveryTimeMin: number;
        deliveryTimeMax: number;
        deliveryFee: number;
        minOrderAmount: number;
        deliveryRadiusKm: number;
        allowPickup: boolean;
        commissionRate: number;
        mpEmail?: string | null;
        mpLinkedAt?: string | null;
        mpUserId?: string | null;
        constanciaAfipUrl?: string | null;
        habilitacionMunicipalUrl?: string | null;
        registroSanitarioUrl?: string | null;
        approvalStatus: string;
    };
}

export default function SettingsForm({ merchant }: SettingsFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isTogglingStore, setIsTogglingStore] = useState(false);
    const [isOpen, setIsOpen] = useState(merchant.isOpen);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [mpDisconnecting, setMpDisconnecting] = useState(false);
    const [mpEmail, setMpEmail] = useState(merchant.mpEmail || null);
    const [mpLinkedAt] = useState(merchant.mpLinkedAt || null);

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true);
        setError("");
        setSuccess("");
        formData.append("image", merchant.image);
        formData.append("name", merchant.name);
        const result = await updateMerchant(formData);
        if (result?.error) {
            setError(result.error);
        } else {
            setSuccess("Configuración guardada correctamente");
            setTimeout(() => setSuccess(""), 3000);
        }
        setIsLoading(false);
    };

    const handleToggleStore = async () => {
        setIsTogglingStore(true);
        const result = await toggleMerchantOpen(!isOpen);
        if (result?.success) {
            setIsOpen(result.isOpen ?? !isOpen);
        } else if (result?.error) {
            setError(result.error);
        }
        setIsTogglingStore(false);
    };

    const handleDisconnectMp = async () => {
        setMpDisconnecting(true);
        try {
            const res = await fetch("/api/mp/disconnect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "merchant" }),
            });
            if (res.ok) {
                setMpEmail(null);
                setSuccess("MercadoPago desvinculado correctamente");
                setTimeout(() => setSuccess(""), 3000);
            } else {
                setError("Error al desvincular MercadoPago");
            }
        } catch {
            setError("Error de conexión");
        } finally {
            setMpDisconnecting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Store Status Toggle */}
            <div className={`rounded-xl p-4 border flex items-center justify-between ${isOpen
                ? "bg-green-50 border-green-200"
                : "bg-gray-100 border-gray-200"
                }`}>
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOpen ? "bg-green-500" : "bg-gray-400"}`}>
                        <Power className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">{isOpen ? "Tienda Abierta" : "Tienda Cerrada"}</p>
                        <p className="text-sm text-gray-500">{isOpen ? "Recibiendo pedidos" : "No recibe pedidos"}</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleToggleStore}
                    disabled={isTogglingStore}
                    className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${isOpen
                        ? "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                        : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                >
                    {isTogglingStore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isOpen ? "Pausar Tienda" : "Abrir Tienda"}
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                    {error}
                </div>
            )}
            {success && (
                <div className="p-4 bg-green-50 text-green-600 rounded-xl text-sm font-medium border border-green-100">
                    {success}
                </div>
            )}

            {/* Delivery & Pickup Settings */}
            <form action={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Truck className="w-5 h-5 text-blue-600" />
                        Entregas y Pedidos
                    </h2>

                    <div className="bg-blue-50 rounded-lg p-3 flex gap-2">
                        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-800">
                            El costo de envío se calcula automáticamente según la distancia entre tu comercio y el comprador. No necesitás configurar un precio fijo.
                        </p>
                    </div>

                    {/* Pickup toggle */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <ShoppingBag className="w-5 h-5 text-gray-600" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">Retiro en local</p>
                                <p className="text-xs text-gray-500">Permitir que los clientes retiren su pedido en tu comercio</p>
                            </div>
                        </div>
                        <label className="relative inline-flex cursor-pointer">
                            <input type="hidden" name="allowPickup" value="false" />
                            <input
                                type="checkbox"
                                name="allowPickup"
                                defaultChecked={merchant.allowPickup}
                                value="true"
                                className="sr-only peer"
                                disabled={isLoading}
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-checked:bg-green-500 rounded-full transition after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:shadow after:transition-transform peer-checked:after:translate-x-5" />
                        </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo de preparación (min)</label>
                            <div className="flex items-center gap-2">
                                <input name="deliveryTimeMin" type="number" min="5" defaultValue={merchant.deliveryTimeMin} className="input w-full" disabled={isLoading} placeholder="Mín" />
                                <span className="text-gray-400">a</span>
                                <input name="deliveryTimeMax" type="number" min="10" defaultValue={merchant.deliveryTimeMax} className="input w-full" disabled={isLoading} placeholder="Máx" />
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">Tiempo estimado para preparar un pedido</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Radio de entrega (km)</label>
                            <input name="deliveryRadiusKm" type="number" min="1" max="50" step="0.5" defaultValue={merchant.deliveryRadiusKm} className="input" disabled={isLoading} />
                            <p className="text-[10px] text-gray-500 mt-1">Distancia máxima para recibir pedidos</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <DollarSign className="w-4 h-4 inline" />
                                Pedido mínimo
                            </label>
                            <input name="minOrderAmount" type="number" min="0" step="100" defaultValue={merchant.minOrderAmount} className="input" disabled={isLoading} />
                            <p className="text-[10px] text-gray-500 mt-1">Monto mínimo para aceptar un pedido. $0 = sin mínimo</p>
                        </div>
                    </div>
                    <input type="hidden" name="deliveryFee" value={merchant.deliveryFee.toString()} />
                </div>

                {/* Commission Info (read-only) */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Percent className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">Tu comisión actual</p>
                                <p className="text-sm text-gray-500">Porcentaje que MOOVY cobra por cada venta</p>
                            </div>
                        </div>
                        <span className="text-2xl font-bold text-blue-600">{merchant.commissionRate}%</span>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2 px-8">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar Configuración
                    </button>
                </div>
            </form>

            {/* Document Status */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Estado de Documentos
                </h2>
                <p className="text-sm text-gray-500">
                    Documentos que presentaste al registrarte. Nuestro equipo los revisa para verificar tu comercio.
                </p>

                <div className="space-y-2">
                    {[
                        { label: "Constancia AFIP", value: merchant.constanciaAfipUrl },
                        { label: "Habilitación Municipal", value: merchant.habilitacionMunicipalUrl },
                        { label: "Registro Sanitario", value: merchant.registroSanitarioUrl },
                    ].map((doc) => (
                        <div key={doc.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700">{doc.label}</span>
                            {doc.value ? (
                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">Presentado</span>
                            ) : (
                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-200 text-gray-500">No presentado</span>
                            )}
                        </div>
                    ))}
                </div>

                {merchant.approvalStatus === "APPROVED" && (
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-medium">Tu comercio está verificado y aprobado</p>
                    </div>
                )}
                {merchant.approvalStatus === "PENDING" && (
                    <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-3 rounded-lg">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-medium">Documentos en revisión — te notificaremos cuando estén aprobados</p>
                    </div>
                )}
            </div>

            {/* MercadoPago */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-blue-600" />
                    MercadoPago
                </h2>
                <p className="text-sm text-gray-500">
                    Vinculá tu cuenta de MercadoPago para recibir pagos directamente.
                </p>

                {mpEmail ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg">
                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            <div>
                                <p className="font-medium">Vinculado como: {mpEmail}</p>
                                {mpLinkedAt && (
                                    <p className="text-xs text-green-600">Desde: {new Date(mpLinkedAt).toLocaleDateString("es-AR")}</p>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleDisconnectMp}
                            disabled={mpDisconnecting}
                            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                            {mpDisconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />}
                            Desvincular MercadoPago
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-3 rounded-lg">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                            <p className="font-medium">No vinculado — los pagos se reciben en la cuenta de Moovy</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => window.location.href = "/api/mp/connect?type=merchant"}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Link2 className="w-4 h-4" />
                            Vincular MercadoPago
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
