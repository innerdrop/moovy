"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ui/ImageUpload";
import ScheduleSection from "@/components/vendedor/ScheduleSection";
import {
    Settings,
    Save,
    Loader2,
    User,
    CreditCard,
    AlertCircle,
    CheckCircle,
    Link2,
    Unlink,
    AlertTriangle,
} from "lucide-react";

interface SellerProfile {
    id: string;
    displayName: string | null;
    bio: string | null;
    avatar: string | null;
    bankAlias: string | null;
    bankCbu: string | null;
    mpEmail: string | null;
    mpLinkedAt: string | null;
    mpUserId: string | null;
    scheduleEnabled: boolean;
    scheduleJson: string | null;
}

export default function VendedorConfiguracionPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [avatar, setAvatar] = useState("");

    const [mpEmail, setMpEmail] = useState<string | null>(null);
    const [mpLinkedAt, setMpLinkedAt] = useState<string | null>(null);
    const [mpDisconnecting, setMpDisconnecting] = useState(false);

    const [formData, setFormData] = useState({
        displayName: "",
        bio: "",
        bankAlias: "",
        bankCbu: "",
        scheduleEnabled: false,
        scheduleJson: null as string | null,
    });

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        try {
            const res = await fetch("/api/seller/profile");
            if (res.ok) {
                const data: SellerProfile = await res.json();
                setFormData({
                    displayName: data.displayName || "",
                    bio: data.bio || "",
                    bankAlias: data.bankAlias || "",
                    bankCbu: data.bankCbu || "",
                    scheduleEnabled: data.scheduleEnabled || false,
                    scheduleJson: data.scheduleJson || null,
                });
                setAvatar(data.avatar || "");
                setMpEmail(data.mpEmail || null);
                setMpLinkedAt(data.mpLinkedAt || null);
            }
        } catch (error) {
            console.error("Error loading profile:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setSuccess("");
        setSaving(true);

        try {
            const res = await fetch("/api/seller/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    displayName: formData.displayName.trim() || null,
                    bio: formData.bio.trim() || null,
                    avatar: avatar || null,
                    bankAlias: formData.bankAlias.trim() || null,
                    bankCbu: formData.bankCbu.trim() || null,
                }),
            });

            if (res.ok) {
                setSuccess("Perfil actualizado exitosamente");
                setTimeout(() => setSuccess(""), 3000);
                router.refresh();
            } else {
                const data = await res.json();
                setError(data.error || "Error al guardar");
            }
        } catch {
            setError("Error de conexión");
        } finally {
            setSaving(false);
        }
    }

    const handleDisconnectMp = async () => {
        setMpDisconnecting(true);
        try {
            const res = await fetch("/api/mp/disconnect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "seller" }),
            });
            if (res.ok) {
                setMpEmail(null);
                setMpLinkedAt(null);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Settings className="w-6 h-6 text-emerald-600" />
                    Configuración
                </h1>
                <p className="text-gray-500">Editá tu perfil de vendedor</p>
            </div>

            {/* Success Toast */}
            {success && (
                <div className="bg-green-50 text-green-700 p-3 rounded-xl flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    {success}
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Info */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-gray-400" />
                        Información Personal
                    </h2>

                    <div className="space-y-4">
                        {/* Avatar */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Foto de perfil
                            </label>
                            <ImageUpload value={avatar} onChange={setAvatar} />
                        </div>

                        {/* Display Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre público
                            </label>
                            <input
                                type="text"
                                value={formData.displayName}
                                onChange={(e) =>
                                    setFormData({ ...formData, displayName: e.target.value })
                                }
                                className="input w-full"
                                placeholder="Tu nombre como vendedor"
                            />
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Biografía
                            </label>
                            <textarea
                                value={formData.bio}
                                onChange={(e) =>
                                    setFormData({ ...formData, bio: e.target.value })
                                }
                                className="input w-full h-24 resize-none"
                                placeholder="Contá un poco sobre vos y lo que vendés..."
                            />
                        </div>
                    </div>
                </div>

                {/* Bank Info */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                        Datos Bancarios
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Estos datos se usan para transferirte las ganancias de tus ventas.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Alias
                            </label>
                            <input
                                type="text"
                                value={formData.bankAlias}
                                onChange={(e) =>
                                    setFormData({ ...formData, bankAlias: e.target.value })
                                }
                                className="input w-full"
                                placeholder="mi.alias.mp"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                CBU
                            </label>
                            <input
                                type="text"
                                value={formData.bankCbu}
                                onChange={(e) =>
                                    setFormData({ ...formData, bankCbu: e.target.value })
                                }
                                className="input w-full font-mono"
                                placeholder="0000000000000000000000"
                                maxLength={22}
                            />
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2 font-semibold text-lg"
                >
                    {saving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Save className="w-5 h-5" />
                    )}
                    Guardar Cambios
                </button>
            </form>

            {/* Dispatch Schedule */}
            <ScheduleSection
                initialScheduleEnabled={formData.scheduleEnabled || false}
                initialScheduleJson={formData.scheduleJson || null}
            />

            {/* MercadoPago */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-gray-400" />
                    MercadoPago
                </h2>
                <p className="text-sm text-gray-500 mb-4">
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
                            onClick={() => window.location.href = "/api/mp/connect?type=seller"}
                            className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 font-semibold"
                        >
                            <Link2 className="w-5 h-5" />
                            Vincular MercadoPago
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
