"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ui/ImageUpload";
import {
    Settings,
    Save,
    Loader2,
    User,
    CreditCard,
    AlertCircle,
    CheckCircle,
} from "lucide-react";

interface SellerProfile {
    id: string;
    displayName: string | null;
    bio: string | null;
    avatar: string | null;
    bankAlias: string | null;
    bankCbu: string | null;
}

export default function VendedorConfiguracionPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [avatar, setAvatar] = useState("");

    const [formData, setFormData] = useState({
        displayName: "",
        bio: "",
        bankAlias: "",
        bankCbu: "",
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
                });
                setAvatar(data.avatar || "");
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
        </div>
    );
}
