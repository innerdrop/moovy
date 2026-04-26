"use client";

// CreateUserModal — Admin OPS crea cuentas de buyer/driver/seller con magic link.
//
// Pattern: el admin solo ingresa email + datos básicos. NO pone contraseña por
// el user — el sistema le manda un email con link para que el user setee su
// propia contraseña (vence en 24h). Ver POST /api/admin/users/create.
//
// Diseño: modal global tipo "Crear cuenta" con tabs (Comprador / Repartidor /
// Vendedor), consistente con el sistema de modales de Moovy (backdrop blur,
// card blanca, rojo MOOVY en CTA, focus management, cierre con Escape).
// Para crear comercios usar el flujo existente /ops/comercios/nuevo.

import { useState, useEffect, useRef } from "react";
import { X, User, Truck, ShoppingBag, Loader2, Mail, Send, AlertCircle } from "lucide-react";
import { toast } from "@/store/toast";

type AccountType = "BUYER" | "DRIVER" | "SELLER";

const VEHICLE_TYPES = [
    { value: "MOTO", label: "Moto" },
    { value: "AUTO", label: "Auto" },
    { value: "CAMIONETA", label: "Camioneta / Pickup / SUV" },
    { value: "BICI", label: "Bicicleta" },
    { value: "PATIN", label: "Patineta / monopatín" },
    { value: "FLETE", label: "Flete" },
] as const;

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
    const [accountType, setAccountType] = useState<AccountType>("BUYER");
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [vehicleType, setVehicleType] = useState<string>("");
    const [displayName, setDisplayName] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const firstFieldRef = useRef<HTMLInputElement>(null);

    // Focus management + escape close
    useEffect(() => {
        if (!isOpen) return;
        firstFieldRef.current?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !submitting) onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isOpen, submitting, onClose]);

    // Body scroll lock
    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [isOpen]);

    function resetForm() {
        setAccountType("BUYER");
        setEmail("");
        setName("");
        setPhone("");
        setVehicleType("");
        setDisplayName("");
        setError(null);
    }

    function handleClose() {
        if (submitting) return;
        resetForm();
        onClose();
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!email.trim() || !name.trim()) {
            setError("Email y nombre son obligatorios");
            return;
        }

        setSubmitting(true);

        // Construir body según el tipo
        const body: any = {
            type: accountType,
            email: email.trim(),
            name: name.trim(),
            phone: phone.trim() || null,
        };
        if (accountType === "DRIVER" && vehicleType) {
            body.vehicleType = vehicleType;
        }
        if (accountType === "SELLER" && displayName.trim()) {
            body.displayName = displayName.trim();
        }

        try {
            const res = await fetch("/api/admin/users/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Error al crear la cuenta");
                setSubmitting(false);
                return;
            }

            toast.success(data.message || `Email enviado a ${email}`);
            resetForm();
            onSuccess();
            onClose();
        } catch (err) {
            console.error("[CreateUserModal] Error:", err);
            setError("Error de conexión. Intentá de nuevo.");
        } finally {
            setSubmitting(false);
        }
    }

    if (!isOpen) return null;

    const tabs: { id: AccountType; label: string; icon: any; color: string }[] = [
        { id: "BUYER", label: "Comprador", icon: User, color: "text-red-600" },
        { id: "DRIVER", label: "Repartidor", icon: Truck, color: "text-green-600" },
        { id: "SELLER", label: "Vendedor", icon: ShoppingBag, color: "text-violet-600" },
    ];

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-user-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={handleClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 id="create-user-modal-title" className="text-lg font-bold text-gray-900">
                        Crear cuenta
                    </h2>
                    <button
                        onClick={handleClose}
                        disabled={submitting}
                        aria-label="Cerrar"
                        className="p-1 hover:bg-gray-100 rounded-full transition disabled:opacity-50"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-6 pt-4">
                    <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-xl">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const active = accountType === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setAccountType(tab.id)}
                                    disabled={submitting}
                                    className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${
                                        active
                                            ? "bg-white shadow-sm text-gray-900"
                                            : "text-gray-500 hover:text-gray-700"
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${active ? tab.color : "text-gray-400"}`} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                    {/* Magic link explainer */}
                    <div className="flex gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-900">
                        <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <p>
                            Le mandamos un email al usuario con un link para que configure su contraseña.
                            <strong> Vos no necesitás saber la contraseña</strong> — el link vence en 24h.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Email <span className="text-red-600">*</span>
                        </label>
                        <input
                            ref={firstFieldRef}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={submitting}
                            required
                            placeholder="usuario@ejemplo.com"
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 disabled:bg-gray-50"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Nombre completo <span className="text-red-600">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={submitting}
                            required
                            minLength={2}
                            maxLength={80}
                            placeholder="Ej. Juan Pérez"
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 disabled:bg-gray-50"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Teléfono <span className="text-gray-400 font-normal">(opcional)</span>
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            disabled={submitting}
                            maxLength={30}
                            placeholder="Ej. +54 9 2901 12-3456"
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 disabled:bg-gray-50"
                        />
                    </div>

                    {/* Driver-specific */}
                    {accountType === "DRIVER" && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Tipo de vehículo <span className="text-gray-400 font-normal">(opcional)</span>
                            </label>
                            <select
                                value={vehicleType}
                                onChange={(e) => setVehicleType(e.target.value)}
                                disabled={submitting}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 disabled:bg-gray-50"
                            >
                                <option value="">El driver lo elige al completar su perfil</option>
                                {VEHICLE_TYPES.map((v) => (
                                    <option key={v.value} value={v.value}>
                                        {v.label}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Si lo dejás vacío, el repartidor lo completa cuando entra a su panel.
                            </p>
                        </div>
                    )}

                    {/* Seller-specific */}
                    {accountType === "SELLER" && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Nombre público en el marketplace <span className="text-gray-400 font-normal">(opcional)</span>
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                disabled={submitting}
                                minLength={2}
                                maxLength={80}
                                placeholder="Si lo dejás vacío, usamos el nombre completo"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 disabled:bg-gray-50"
                            />
                        </div>
                    )}

                    {error && (
                        <div className="flex gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={submitting}
                            className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !email.trim() || !name.trim()}
                            className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg bg-[#e60012] text-white hover:bg-[#cc000f] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            {submitting ? "Creando..." : "Crear y enviar email"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
