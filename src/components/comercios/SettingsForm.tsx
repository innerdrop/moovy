"use client";

import { useState } from "react";
import { updateMerchant, toggleMerchantOpen, updateMerchantSchedule } from "@/app/comercios/actions";
import ImageUpload from "@/components/ui/ImageUpload";
import { Loader2, Save, Store, Clock, DollarSign, MapPin, Phone, Mail, Tag, Power, User, Link2, Unlink, AlertTriangle, CheckCircle, Calendar, Plus, Trash2, FileText, Instagram, MessageCircle, Globe, Truck, ShoppingBag, Info, Percent } from "lucide-react";
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
        deliveryRadiusKm: number;
        allowPickup: boolean;
        firstName: string;
        lastName: string;
        ownerPhone: string;
        mpEmail?: string | null;
        mpLinkedAt?: string | null;
        mpUserId?: string | null;
        scheduleEnabled: boolean;
        scheduleJson?: string | null;
        commissionRate: number;
        // Document status
        constanciaAfipUrl?: string | null;
        habilitacionMunicipalUrl?: string | null;
        registroSanitarioUrl?: string | null;
        approvalStatus: string;
        // Social media
        instagramUrl?: string | null;
        facebookUrl?: string | null;
        whatsappNumber?: string | null;
    };
}

/** Un rango horario (turno) dentro de un día */
interface TimeRange {
    open: string;
    close: string;
}

/** Schedule semanal: cada día es un array de turnos o null (cerrado) */
type WeekSchedule = Record<string, TimeRange[] | null>;

const DAY_NAMES: Record<string, string> = {
    "1": "Lunes",
    "2": "Martes",
    "3": "Miércoles",
    "4": "Jueves",
    "5": "Viernes",
    "6": "Sábado",
    "7": "Domingo",
};

const MAX_SHIFTS_PER_DAY = 3;

const DEFAULT_SCHEDULE: WeekSchedule = {
    "1": [{ open: "09:00", close: "21:00" }],
    "2": [{ open: "09:00", close: "21:00" }],
    "3": [{ open: "09:00", close: "21:00" }],
    "4": [{ open: "09:00", close: "21:00" }],
    "5": [{ open: "09:00", close: "21:00" }],
    "6": [{ open: "10:00", close: "14:00" }],
    "7": null,
};

/**
 * Normaliza un schedule de la DB (legacy o nuevo) al formato array.
 * Legacy: { "1": { open, close } } → { "1": [{ open, close }] }
 */
function normalizeScheduleFromDb(raw: Record<string, unknown>): WeekSchedule {
    const result: WeekSchedule = {};
    for (let d = 1; d <= 7; d++) {
        const key = d.toString();
        const val = raw[key];
        if (val === null || val === undefined) {
            result[key] = null;
        } else if (Array.isArray(val)) {
            result[key] = val.filter(
                (r): r is TimeRange =>
                    r && typeof r === "object" && typeof r.open === "string" && typeof r.close === "string"
            );
        } else if (typeof val === "object" && "open" in (val as object) && "close" in (val as object)) {
            result[key] = [{ open: (val as TimeRange).open, close: (val as TimeRange).close }];
        } else {
            result[key] = null;
        }
    }
    return result;
}

const CATEGORIES = [
    // Gastronomía
    "Restaurante", "Pizzería", "Hamburguesería", "Parrilla",
    "Cafetería", "Heladería", "Panadería/Pastelería", "Sushi",
    "Comida Saludable", "Rotisería",
    // Bebidas
    "Bebidas", "Vinoteca/Licorería",
    // Compras diarias
    "Supermercado/Almacén", "Kiosco", "Dietética/Naturista",
    "Verdulería", "Carnicería",
    // Salud y bienestar
    "Farmacia", "Veterinaria/Pet Shop", "Óptica", "Perfumería/Cosmética",
    // Hogar
    "Ferretería", "Mueblería/Decoración", "Lavandería/Tintorería",
    // Otros comercios
    "Librería/Papelería", "Electrónica/Celulares", "Regalería/Cotillón",
    "Floristería", "Juguetería", "Indumentaria", "Otro",
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
    const [scheduleEnabled, setScheduleEnabled] = useState(merchant.scheduleEnabled);
    const [schedule, setSchedule] = useState<WeekSchedule>(() => {
        try {
            if (!merchant.scheduleJson) return DEFAULT_SCHEDULE;
            const raw = JSON.parse(merchant.scheduleJson);
            return normalizeScheduleFromDb(raw);
        } catch {
            return DEFAULT_SCHEDULE;
        }
    });
    const [savingSchedule, setSavingSchedule] = useState(false);

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

    const handleSaveSchedule = async () => {
        setSavingSchedule(true);
        setError("");
        const result = await updateMerchantSchedule(
            scheduleEnabled,
            scheduleEnabled ? JSON.stringify(schedule) : null
        );
        if (result?.error) {
            setError(result.error);
        } else {
            setSuccess("Horarios guardados correctamente");
            setTimeout(() => setSuccess(""), 3000);
        }
        setSavingSchedule(false);
    };

    const updateShift = (day: string, shiftIndex: number, field: "open" | "close", value: string) => {
        setSchedule((prev) => {
            const shifts = [...(prev[day] || [{ open: "09:00", close: "21:00" }])];
            shifts[shiftIndex] = { ...shifts[shiftIndex], [field]: value };
            return { ...prev, [day]: shifts };
        });
    };

    const addShift = (day: string) => {
        setSchedule((prev) => {
            const existing = prev[day] || [];
            if (existing.length >= MAX_SHIFTS_PER_DAY) return prev;
            // Default new shift: starts 2h after last shift ends
            const lastClose = existing.length > 0 ? existing[existing.length - 1].close : "13:00";
            const [h] = lastClose.split(":").map(Number);
            const newOpen = `${String(Math.min(h + 2, 22)).padStart(2, "0")}:00`;
            const newClose = `${String(Math.min(h + 5, 23)).padStart(2, "0")}:00`;
            return { ...prev, [day]: [...existing, { open: newOpen, close: newClose }] };
        });
    };

    const removeShift = (day: string, shiftIndex: number) => {
        setSchedule((prev) => {
            const existing = prev[day] || [];
            if (existing.length <= 1) return prev; // No remover el último turno, usar toggleDay
            const updated = existing.filter((_, i) => i !== shiftIndex);
            return { ...prev, [day]: updated };
        });
    };

    const toggleDay = (day: string) => {
        setSchedule((prev) => ({
            ...prev,
            [day]: prev[day] ? null : [{ open: "09:00", close: "21:00" }],
        }));
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

                {/* Delivery & Pickup Settings */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Truck className="w-5 h-5 text-blue-600" />
                        Entregas y Pedidos
                    </h2>

                    {/* Delivery info */}
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tiempo de preparación (min)
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    name="deliveryTimeMin"
                                    type="number"
                                    min="5"
                                    defaultValue={merchant.deliveryTimeMin}
                                    className="input w-full"
                                    disabled={isLoading}
                                    placeholder="Mín"
                                />
                                <span className="text-gray-400">a</span>
                                <input
                                    name="deliveryTimeMax"
                                    type="number"
                                    min="10"
                                    defaultValue={merchant.deliveryTimeMax}
                                    className="input w-full"
                                    disabled={isLoading}
                                    placeholder="Máx"
                                />
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">Tiempo estimado para preparar un pedido</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Radio de entrega (km)
                            </label>
                            <input
                                name="deliveryRadiusKm"
                                type="number"
                                min="1"
                                max="50"
                                step="0.5"
                                defaultValue={merchant.deliveryRadiusKm}
                                className="input"
                                disabled={isLoading}
                            />
                            <p className="text-[10px] text-gray-500 mt-1">Distancia máxima para recibir pedidos</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <DollarSign className="w-4 h-4 inline" />
                                Pedido mínimo
                            </label>
                            <input
                                name="minOrderAmount"
                                type="number"
                                min="0"
                                step="100"
                                defaultValue={merchant.minOrderAmount}
                                className="input"
                                disabled={isLoading}
                            />
                            <p className="text-[10px] text-gray-500 mt-1">Monto mínimo para aceptar un pedido. $0 = sin mínimo</p>
                        </div>
                    </div>
                    {/* Hidden deliveryFee to maintain backwards compat */}
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

            {/* Horarios de Atención */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Horarios de Atención
                    </h2>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-sm text-gray-500">
                            {scheduleEnabled ? "Activo" : "Desactivado"}
                        </span>
                        <button
                            type="button"
                            onClick={() => setScheduleEnabled(!scheduleEnabled)}
                            className={`relative w-11 h-6 rounded-full transition ${scheduleEnabled ? "bg-green-500" : "bg-gray-300"}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${scheduleEnabled ? "translate-x-5" : ""}`} />
                        </button>
                    </label>
                </div>

                <p className="text-sm text-gray-500">
                    Configurá los horarios en que tu comercio acepta pedidos. Fuera de estos horarios se mostrará como cerrado automáticamente.
                </p>

                {scheduleEnabled && (
                    <div className="space-y-3">
                        {Object.entries(DAY_NAMES).map(([day, name]) => {
                            const shifts = schedule[day];
                            const isOpen = shifts !== null && shifts !== undefined;

                            return (
                                <div key={day} className="p-3 bg-gray-50 rounded-lg space-y-2">
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => toggleDay(day)}
                                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition flex-shrink-0 ${isOpen ? "bg-green-500 border-green-500 text-white" : "border-gray-300"}`}
                                        >
                                            {isOpen && <span className="text-xs font-bold">&#10003;</span>}
                                        </button>
                                        <span className={`w-24 text-sm font-medium ${isOpen ? "text-gray-900" : "text-gray-400"}`}>
                                            {name}
                                        </span>
                                        {!isOpen && (
                                            <span className="text-sm text-gray-400 italic ml-auto">Cerrado</span>
                                        )}
                                    </div>

                                    {isOpen && shifts && shifts.map((shift, idx) => (
                                        <div key={idx} className="flex items-center gap-2 ml-8">
                                            <input
                                                type="time"
                                                value={shift.open}
                                                onChange={(e) => updateShift(day, idx, "open", e.target.value)}
                                                className="input w-28 text-sm"
                                            />
                                            <span className="text-gray-400 text-sm">a</span>
                                            <input
                                                type="time"
                                                value={shift.close}
                                                onChange={(e) => updateShift(day, idx, "close", e.target.value)}
                                                className="input w-28 text-sm"
                                            />
                                            {shifts.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeShift(day, idx)}
                                                    className="text-red-400 hover:text-red-600 transition p-1"
                                                    title="Eliminar turno"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {isOpen && shifts && shifts.length < MAX_SHIFTS_PER_DAY && (
                                        <button
                                            type="button"
                                            onClick={() => addShift(day)}
                                            className="ml-8 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Agregar turno
                                        </button>
                                    )}
                                </div>
                            );
                        })}

                        <p className="text-xs text-gray-400 mt-1">
                            Podés configurar turnos partidos (ej: mañana y tarde) con el botón &quot;Agregar turno&quot;.
                        </p>

                        <div className="flex justify-end pt-2">
                            <button
                                type="button"
                                onClick={handleSaveSchedule}
                                disabled={savingSchedule}
                                className="btn-primary flex items-center gap-2 px-6"
                            >
                                {savingSchedule ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Guardar Horarios
                            </button>
                        </div>
                    </div>
                )}

                {!scheduleEnabled && (
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleSaveSchedule}
                            disabled={savingSchedule}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                            {savingSchedule && <Loader2 className="w-3 h-3 animate-spin" />}
                            Guardar
                        </button>
                    </div>
                )}
            </div>

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
                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                                    Presentado
                                </span>
                            ) : (
                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-200 text-gray-500">
                                    No presentado
                                </span>
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

            {/* Social Media */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-600" />
                    Redes Sociales
                </h2>
                <p className="text-sm text-gray-500">
                    Mostrá tus redes en tu perfil público. Los clientes confían más en comercios con presencia en redes.
                </p>

                <form action={async (formData: FormData) => {
                    const result = await updateMerchant(formData);
                    if (result?.error) setError(result.error);
                    else { setSuccess("Redes sociales guardadas"); setTimeout(() => setSuccess(""), 3000); }
                }}>
                    {/* Pass required hidden fields for the updateMerchant action */}
                    <input type="hidden" name="name" value={merchant.name} />
                    <input type="hidden" name="image" value={merchant.image} />
                    <input type="hidden" name="deliveryFee" value={merchant.deliveryFee.toString()} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Instagram className="w-4 h-4 inline mr-1" />
                                Instagram
                            </label>
                            <input
                                name="instagramUrl"
                                type="text"
                                defaultValue={merchant.instagramUrl || ""}
                                placeholder="@tu_comercio"
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <MessageCircle className="w-4 h-4 inline mr-1" />
                                WhatsApp
                            </label>
                            <input
                                name="whatsappNumber"
                                type="text"
                                defaultValue={merchant.whatsappNumber || ""}
                                placeholder="+54 9 2901 ..."
                                className="input"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Globe className="w-4 h-4 inline mr-1" />
                                Facebook
                            </label>
                            <input
                                name="facebookUrl"
                                type="text"
                                defaultValue={merchant.facebookUrl || ""}
                                placeholder="facebook.com/tu_comercio"
                                className="input"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button type="submit" className="btn-primary flex items-center gap-2 px-6">
                            <Save className="w-4 h-4" />
                            Guardar Redes
                        </button>
                    </div>
                </form>
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
