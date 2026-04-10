"use client";

import { useState } from "react";
import { updateMerchant, updateMerchantSchedule } from "@/app/comercios/actions";
import ImageUpload from "@/components/ui/ImageUpload";
import { Loader2, Save, Store, Tag, MapPin, Phone, Mail, User, Calendar, Plus, Trash2, Instagram, MessageCircle, Globe, Info } from "lucide-react";
import { AddressAutocomplete } from "@/components/forms/AddressAutocomplete";
import { confirm } from "@/store/confirm";
import { toast } from "@/store/toast";

interface MiComercioFormProps {
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
        deliveryFee: number;
        firstName: string;
        lastName: string;
        ownerPhone: string;
        scheduleEnabled: boolean;
        scheduleJson?: string | null;
        instagramUrl?: string | null;
        facebookUrl?: string | null;
        whatsappNumber?: string | null;
    };
}

interface TimeRange {
    open: string;
    close: string;
}

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
    "Restaurante", "Pizzería", "Hamburguesería", "Parrilla",
    "Cafetería", "Heladería", "Panadería/Pastelería", "Sushi",
    "Comida Saludable", "Rotisería",
    "Bebidas", "Vinoteca/Licorería",
    "Supermercado/Almacén", "Kiosco", "Dietética/Naturista",
    "Verdulería", "Carnicería",
    "Farmacia", "Veterinaria/Pet Shop", "Óptica", "Perfumería/Cosmética",
    "Ferretería", "Mueblería/Decoración", "Lavandería/Tintorería",
    "Librería/Papelería", "Electrónica/Celulares", "Regalería/Cotillón",
    "Floristería", "Juguetería", "Indumentaria", "Otro",
];

export default function MiComercioForm({ merchant }: MiComercioFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState(merchant.image);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [address, setAddress] = useState(merchant.address);
    const [lat, setLat] = useState<number | null>(merchant.latitude ?? null);
    const [lng, setLng] = useState<number | null>(merchant.longitude ?? null);
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
    const [savingSocial, setSavingSocial] = useState(false);

    const handleSubmit = async (formData: FormData) => {
        const ok = await confirm({
            title: "Guardar perfil",
            message: "¿Querés guardar los cambios en tu perfil de comercio?",
            confirmLabel: "Guardar",
            cancelLabel: "Cancelar",
        });
        if (!ok) return;

        setIsLoading(true);
        setError("");
        formData.append("image", imageUrl);
        const result = await updateMerchant(formData);
        if (result?.error) {
            toast.error(result.error);
            setError(result.error);
        } else {
            toast.success("Perfil guardado correctamente");
        }
        setIsLoading(false);
    };

    const handleSaveSchedule = async () => {
        const ok = await confirm({
            title: "Guardar horarios",
            message: "¿Querés guardar los cambios en los horarios de atención?",
            confirmLabel: "Guardar",
            cancelLabel: "Cancelar",
        });
        if (!ok) return;

        setSavingSchedule(true);
        setError("");
        // Horarios siempre activos — scheduleEnabled = true al guardar
        const result = await updateMerchantSchedule(
            true,
            JSON.stringify(schedule)
        );
        if (result?.error) {
            toast.error(result.error);
            setError(result.error);
        } else {
            toast.success("Horarios guardados correctamente");
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
            if (existing.length <= 1) return prev;
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

            {/* Main Profile Form */}
            <form action={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Store className="w-5 h-5 text-blue-600" />
                        Información del Comercio
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
                                cropAspect={1}
                                cropOutputSize={500}
                            />
                        </div>
                        <div className="md:col-span-2 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre del Comercio
                                </label>
                                <input name="name" type="text" required defaultValue={merchant.name} className="input" disabled={isLoading} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción
                                </label>
                                <textarea name="description" rows={2} defaultValue={merchant.description} placeholder="Describe tu comercio..." className="input" disabled={isLoading} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Tag className="w-4 h-4 inline mr-1" />
                                    Categoría
                                </label>
                                <select name="category" className="input" defaultValue={merchant.category} disabled={isLoading}>
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-blue-600" />
                        Contacto del Negocio
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Mail className="w-4 h-4 inline mr-1" />
                                Email
                            </label>
                            <input name="email" type="email" defaultValue={merchant.email} placeholder="comercio@email.com" className="input" disabled={isLoading} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Phone className="w-4 h-4 inline mr-1" />
                                Teléfono
                            </label>
                            <input name="phone" type="tel" defaultValue={merchant.phone} placeholder="+54 9 ..." className="input" disabled={isLoading} />
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
                            <input type="hidden" name="address" value={address} />
                            <input type="hidden" name="latitude" value={lat ?? ""} />
                            <input type="hidden" name="longitude" value={lng ?? ""} />
                        </div>
                    </div>
                </div>

                {/* Owner Info */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        Datos del Propietario
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                            <input name="firstName" type="text" defaultValue={merchant.firstName} className="input" disabled={isLoading} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                            <input name="lastName" type="text" defaultValue={merchant.lastName} className="input" disabled={isLoading} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Phone className="w-4 h-4 inline mr-1" />
                                Teléfono Personal
                            </label>
                            <input name="ownerPhone" type="tel" defaultValue={merchant.ownerPhone} placeholder="+54 9 ..." className="input" disabled={isLoading} />
                        </div>
                    </div>
                </div>

                {/* Hidden deliveryFee for backwards compat */}
                <input type="hidden" name="deliveryFee" value={merchant.deliveryFee.toString()} />

                {/* Save Button */}
                <div className="flex justify-end">
                    <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2 px-8">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar Perfil
                    </button>
                </div>
            </form>

            {/* Schedule Section — Horarios obligatorios */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Horarios de Atención
                    </h2>
                </div>

                <p className="text-sm text-gray-500">
                    Configurá los horarios en que tu comercio acepta pedidos. Fuera de estos horarios se mostrará como cerrado automáticamente.
                </p>

                {!merchant.scheduleJson && (
                    <div className="flex items-start gap-2 text-amber-700 bg-amber-50 p-3 rounded-lg">
                        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium">Estos son horarios sugeridos</p>
                            <p className="text-xs text-amber-600 mt-0.5">
                                Personalizalos según tu comercio y guardá los cambios. Mientras tanto, se aplican estos horarios por defecto.
                            </p>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    {Object.entries(DAY_NAMES).map(([day, name]) => {
                        const shifts = schedule[day];
                        const dayIsOpen = shifts !== null && shifts !== undefined;

                        return (
                            <div key={day} className="p-3 bg-gray-50 rounded-lg space-y-2">
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => toggleDay(day)}
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition flex-shrink-0 ${dayIsOpen ? "bg-green-500 border-green-500 text-white" : "border-gray-300"}`}
                                    >
                                        {dayIsOpen && <span className="text-xs font-bold">&#10003;</span>}
                                    </button>
                                    <span className={`w-24 text-sm font-medium ${dayIsOpen ? "text-gray-900" : "text-gray-400"}`}>{name}</span>
                                    {!dayIsOpen && <span className="text-sm text-gray-400 italic ml-auto">Cerrado</span>}
                                </div>

                                {dayIsOpen && shifts && shifts.map((shift, idx) => (
                                    <div key={idx} className="flex items-center gap-2 ml-8">
                                        <input type="time" value={shift.open} onChange={(e) => updateShift(day, idx, "open", e.target.value)} className="input w-28 text-sm" />
                                        <span className="text-gray-400 text-sm">a</span>
                                        <input type="time" value={shift.close} onChange={(e) => updateShift(day, idx, "close", e.target.value)} className="input w-28 text-sm" />
                                        {shifts.length > 1 && (
                                            <button type="button" onClick={() => removeShift(day, idx)} className="text-red-400 hover:text-red-600 transition p-1" title="Eliminar turno">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {dayIsOpen && shifts && shifts.length < MAX_SHIFTS_PER_DAY && (
                                    <button type="button" onClick={() => addShift(day)} className="ml-8 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition">
                                        <Plus className="w-3 h-3" />
                                        Agregar turno
                                    </button>
                                )}
                            </div>
                        );
                    })}

                    <p className="text-xs text-gray-400 mt-1">
                        Podés configurar turnos partidos (ej: mañana y tarde) con el botón &quot;Agregar turno&quot;. Usá el botón &quot;Pausar Tienda&quot; en Ajustes para cerrar temporalmente fuera de horario.
                    </p>

                    <div className="flex justify-end pt-2">
                        <button type="button" onClick={handleSaveSchedule} disabled={savingSchedule} className="btn-primary flex items-center gap-2 px-6">
                            {savingSchedule ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Guardar Horarios
                        </button>
                    </div>
                </div>
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
                    const ok = await confirm({
                        title: "Guardar redes sociales",
                        message: "¿Querés guardar los cambios en tus redes sociales?",
                        confirmLabel: "Guardar",
                        cancelLabel: "Cancelar",
                    });
                    if (!ok) return;

                    setSavingSocial(true);
                    const result = await updateMerchant(formData);
                    if (result?.error) { toast.error(result.error); setError(result.error); }
                    else { toast.success("Redes sociales guardadas"); }
                    setSavingSocial(false);
                }}>
                    <input type="hidden" name="name" value={merchant.name} />
                    <input type="hidden" name="image" value={merchant.image} />
                    <input type="hidden" name="deliveryFee" value={merchant.deliveryFee.toString()} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Instagram className="w-4 h-4 inline mr-1" />
                                Instagram
                            </label>
                            <input name="instagramUrl" type="text" defaultValue={merchant.instagramUrl || ""} placeholder="@tu_comercio" className="input" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <MessageCircle className="w-4 h-4 inline mr-1" />
                                WhatsApp
                            </label>
                            <input name="whatsappNumber" type="text" defaultValue={merchant.whatsappNumber || ""} placeholder="+54 9 2901 ..." className="input" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Globe className="w-4 h-4 inline mr-1" />
                                Facebook
                            </label>
                            <input name="facebookUrl" type="text" defaultValue={merchant.facebookUrl || ""} placeholder="facebook.com/tu_comercio" className="input" />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={savingSocial}
                        className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium text-sm disabled:opacity-50 mt-4"
                    >
                        {savingSocial ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar Redes
                    </button>
                </form>
            </div>
        </div>
    );
}