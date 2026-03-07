"use client";

import { useState } from "react";
import { updateMerchant, toggleMerchantOpen } from "@/app/comercios/actions";
import ImageUpload from "@/components/ui/ImageUpload";
import { Loader2, Save, Store, Clock, DollarSign, MapPin, Phone, Mail, Tag, Power, User, Link2, Unlink, AlertTriangle, CheckCircle } from "lucide-react";
import { AddressAutocomplete } from "@/components/forms/AddressAutocomplete";

interface SettingsFormProps {
    merchant: {
        id: string;
        name: string;
        description: string;
        image: string;
        email: string;
        phone: string;
        address: string;
        latitude?: number | null;
        longitude?: number | null;
        category: string;
        isOpen: boolean;
        deliveryTimeMin: number;
        deliveryTimeMax: number;
        deliveryFee: number;
        minOrderAmount: number;
        firstName: string;
        lastName: string;
        ownerPhone: string;
        mpEmail?: string | null;
        mpLinkedAt?: string | null;
        mpUserId?: string | null;
    };
}

const CATEGORIES = [
    "Restaurante",
    "Pizzería",
    "Hamburguesería",
    "Parrilla",
    "Cafetería",
    "Panadería",
    "Farmacia",
    "Supermercado",
    "Kiosco",
    "Verdulería",
    "Carnicería",
    "Otro",
];

export default function SettingsForm({ merchant }: SettingsFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isTogglingStore, setIsTogglingStore] = useState(false);
    const [isOpen, setIsOpen] = useState(merchant.isOpen);
    const [imageUrl, setImageUrl] = useState(merchant.image);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [address, setAddress] = useState(merchant.address);
    const [lat, setLat] = useState<number | null>(merchant.latitude ?? null);
    const [lng, setLng] = useState<number | null>(merchant.longitude ?? null);
    const [mpDisconnecting, setMpDisconnecting] = useState(false);
    const [mpEmail, setMpEmail] = useState(merchant.mpEmail || null);
    const [mpLinkedAt] = useState(merchant.mpLinkedAt || null);

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true);
        setError("");
        setSuccess("");

        formData.append("image", imageUrl);

        const result = await updateMerchant(formData);

        if (result?.error) {
            setError(result.error);
        } else {
            setSuccess("Cambios guardados correctamente");
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
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOpen ? "bg-green-500" : "bg-gray-400"
                        }`}>
                        <Power className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">
                            {isOpen ? "Tienda Abierta" : "Tienda Cerrada"}
                        </p>
                        <p className="text-sm text-gray-500">
                            {isOpen ? "Recibiendo pedidos" : "No recibe pedidos"}
                        </p>
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
                    {isTogglingStore ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : null}
                    {isOpen ? "Pausar Tienda" : "Abrir Tienda"}
                </button>
            </div>

            {/* Settings Form */}
            <form action={handleSubmit} className="space-y-6">
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

                {/* Basic Info */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Store className="w-5 h-5 text-blue-600" />
                        Información Básica
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Logo del Comercio
                            </label>
                            <ImageUpload
                                value={imageUrl}
                                onChange={setImageUrl}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="md:col-span-2 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre del Comercio
                                </label>
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    defaultValue={merchant.name}
                                    className="input"
                                    disabled={isLoading}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción
                                </label>
                                <textarea
                                    name="description"
                                    rows={2}
                                    defaultValue={merchant.description}
                                    placeholder="Describe tu comercio..."
                                    className="input"
                                    disabled={isLoading}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Tag className="w-4 h-4 inline mr-1" />
                                    Categoría
                                </label>
                                <select
                                    name="category"
                                    className="input"
                                    defaultValue={merchant.category}
                                    disabled={isLoading}
                                >
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Owner Info */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        Información del Propietario
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre
                            </label>
                            <input
                                name="firstName"
                                type="text"
                                defaultValue={merchant.firstName}
                                className="input"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Apellido
                            </label>
                            <input
                                name="lastName"
                                type="text"
                                defaultValue={merchant.lastName}
                                className="input"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Phone className="w-4 h-4 inline mr-1" />
                                Teléfono Personal
                            </label>
                            <input
                                name="ownerPhone"
                                type="tel"
                                defaultValue={merchant.ownerPhone}
                                placeholder="+54 9 ..."
                                className="input"
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-blue-600" />
                        Información de contacto del Negocio
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Mail className="w-4 h-4 inline mr-1" />
                                Email del Negocio
                            </label>
                            <input
                                name="email"
                                type="email"
                                defaultValue={merchant.email}
                                placeholder="comercio@email.com"
                                className="input"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Phone className="w-4 h-4 inline mr-1" />
                                Teléfono del Negocio
                            </label>
                            <input
                                name="phone"
                                type="tel"
                                defaultValue={merchant.phone}
                                placeholder="+54 9 ..."
                                className="input"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <MapPin className="w-4 h-4 inline mr-1" />
                                Dirección
                            </label>
                            <AddressAutocomplete
                                value={address}
                                onChange={(val, newLat, newLng, street, num) => {
                                    setAddress(num ? `${street} ${num}` : val);
                                    if (newLat) setLat(newLat);
                                    if (newLng) setLng(newLng);
                                }}
                                placeholder="Calle y número..."
                            />
                            {/* Hidden inputs for FormData */}
                            <input type="hidden" name="address" value={address} />
                            <input type="hidden" name="latitude" value={lat ?? ""} />
                            <input type="hidden" name="longitude" value={lng ?? ""} />
                        </div>
                    </div>
                </div>

                {/* Delivery Settings */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        Configuración de Delivery
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tiempo Mín (min)
                            </label>
                            <input
                                name="deliveryTimeMin"
                                type="number"
                                min="5"
                                defaultValue={merchant.deliveryTimeMin}
                                className="input"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tiempo Máx (min)
                            </label>
                            <input
                                name="deliveryTimeMax"
                                type="number"
                                min="10"
                                defaultValue={merchant.deliveryTimeMax}
                                className="input"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <DollarSign className="w-4 h-4 inline" />
                                Envío
                            </label>
                            <input
                                name="deliveryFee"
                                type="number"
                                min="0"
                                step="0.01"
                                defaultValue={merchant.deliveryFee}
                                className="input"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <DollarSign className="w-4 h-4 inline" />
                                Pedido Mín
                            </label>
                            <input
                                name="minOrderAmount"
                                type="number"
                                min="0"
                                step="0.01"
                                defaultValue={merchant.minOrderAmount}
                                className="input"
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary flex items-center gap-2 px-8"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Guardar Cambios
                    </button>
                </div>
            </form >

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
                                    <p className="text-xs text-green-600">
                                        Desde: {new Date(mpLinkedAt).toLocaleDateString("es-AR")}
                                    </p>
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
        </div >
    );
}
