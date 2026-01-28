"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ChevronLeft,
    Store,
    User,
    Mail,
    Phone,
    MapPin,
    Package,
    ShoppingBag,
    CheckCircle,
    XCircle,
    Loader2,
    Save,
    BadgeCheck,
    Instagram,
    Facebook,
    Building2,
    CreditCard,
    Calendar,
    FileText
} from "lucide-react";
import { AddressAutocomplete } from "@/components/forms/AddressAutocomplete";

interface Merchant {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    banner: string | null;
    isActive: boolean;
    isOpen: boolean;
    isVerified: boolean;
    email: string | null;
    phone: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    category: string | null;
    cuit: string | null;
    cuil: string | null;
    businessName: string | null;
    bankAccount: string | null;
    ownerDni: string | null;
    ownerBirthDate: string | null;
    startedAt: string | null;
    instagramUrl: string | null;
    facebookUrl: string | null;
    whatsappNumber: string | null;
    adminNotes: string | null;
    owner: {
        id: string;
        name: string;
        firstName: string | null;
        lastName: string | null;
        email: string;
        phone: string | null;
    };
    _count: {
        products: number;
        orders: number;
    };
    createdAt: string;
}

export default function MerchantDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [merchant, setMerchant] = useState<Merchant | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"info" | "legal" | "notes">("info");

    // Form fields
    const [formData, setFormData] = useState({
        cuil: "",
        businessName: "",
        bankAccount: "",
        ownerDni: "",
        ownerBirthDate: "",
        startedAt: "",
        instagramUrl: "",
        facebookUrl: "",
        whatsappNumber: "",
        adminNotes: "",
        address: "",
        latitude: null as number | null,
        longitude: null as number | null,
    });

    useEffect(() => {
        fetchMerchant();
    }, [id]);

    async function fetchMerchant() {
        try {
            const res = await fetch(`/api/admin/merchants/${id}`);
            if (res.ok) {
                const data = await res.json();
                setMerchant(data);
                setFormData({
                    cuil: data.cuil || "",
                    businessName: data.businessName || "",
                    bankAccount: data.bankAccount || "",
                    ownerDni: data.ownerDni || "",
                    ownerBirthDate: data.ownerBirthDate ? data.ownerBirthDate.split("T")[0] : "",
                    startedAt: data.startedAt ? data.startedAt.split("T")[0] : "",
                    instagramUrl: data.instagramUrl || "",
                    facebookUrl: data.facebookUrl || "",
                    whatsappNumber: data.whatsappNumber || "",
                    adminNotes: data.adminNotes || "",
                    address: data.address || "",
                    latitude: data.latitude || null,
                    longitude: data.longitude || null,
                });
            }
        } catch (error) {
            console.error("Error fetching merchant:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/merchants/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    ownerBirthDate: formData.ownerBirthDate || null,
                    startedAt: formData.startedAt || null,
                }),
            });
            if (res.ok) {
                const updated = await res.json();
                setMerchant(updated);
            }
        } catch (error) {
            console.error("Error saving:", error);
        } finally {
            setSaving(false);
        }
    }

    async function toggleVerified() {
        if (!merchant) return;
        try {
            const res = await fetch(`/api/admin/merchants/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isVerified: !merchant.isVerified }),
            });
            if (res.ok) {
                const updated = await res.json();
                setMerchant(updated);
            }
        } catch (error) {
            console.error("Error toggling verified:", error);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#e60012]" />
            </div>
        );
    }

    if (!merchant) {
        return (
            <div className="text-center py-20">
                <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Comercio no encontrado</p>
                <Link href="/ops/comercios" className="btn-primary mt-4 inline-block">
                    Volver a comercios
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/ops/comercios"
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-navy">{merchant.name}</h1>
                            {merchant.isVerified && (
                                <BadgeCheck className="w-6 h-6 text-blue-500" />
                            )}
                        </div>
                        <p className="text-gray-500">{merchant.category}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={toggleVerified}
                        className={`px-4 py-2 rounded-lg font-medium transition ${merchant.isVerified
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        {merchant.isVerified ? (
                            <>
                                <BadgeCheck className="w-4 h-4 inline mr-2" />
                                Verificado
                            </>
                        ) : (
                            "Marcar Verificado"
                        )}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <Package className="w-8 h-8 text-[#e60012]" />
                        <div>
                            <p className="text-2xl font-bold text-navy">{merchant._count.products}</p>
                            <p className="text-sm text-gray-500">Productos</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <ShoppingBag className="w-8 h-8 text-green-500" />
                        <div>
                            <p className="text-2xl font-bold text-navy">{merchant._count.orders}</p>
                            <p className="text-sm text-gray-500">Pedidos</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        {merchant.isActive ? (
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        ) : (
                            <XCircle className="w-8 h-8 text-red-500" />
                        )}
                        <div>
                            <p className="text-lg font-bold text-navy">
                                {merchant.isActive ? "Activo" : "Inactivo"}
                            </p>
                            <p className="text-sm text-gray-500">Estado</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-purple-500" />
                        <div>
                            <p className="text-lg font-bold text-navy">
                                {new Date(merchant.createdAt).toLocaleDateString("es-AR")}
                            </p>
                            <p className="text-sm text-gray-500">Registro</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tabs */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="flex border-b">
                            <button
                                onClick={() => setActiveTab("info")}
                                className={`flex-1 py-3 px-4 text-sm font-medium transition ${activeTab === "info"
                                    ? "bg-[#e60012] text-white"
                                    : "text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                Información Extendida
                            </button>
                            <button
                                onClick={() => setActiveTab("legal")}
                                className={`flex-1 py-3 px-4 text-sm font-medium transition ${activeTab === "legal"
                                    ? "bg-[#e60012] text-white"
                                    : "text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                Datos Fiscales
                            </button>
                            <button
                                onClick={() => setActiveTab("notes")}
                                className={`flex-1 py-3 px-4 text-sm font-medium transition ${activeTab === "notes"
                                    ? "bg-[#e60012] text-white"
                                    : "text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                Notas Admin
                            </button>
                        </div>

                        <div className="p-6">
                            {activeTab === "info" && (
                                <div className="space-y-6">
                                    {/* Owner Info Details (Read-only as it belongs to User) */}
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                        <h3 className="font-bold text-navy flex items-center gap-2 mb-4">
                                            <User className="w-5 h-5 text-blue-600" />
                                            Datos del Propietario (Usuario)
                                        </h3>
                                        <div className="grid sm:grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500 mb-1">Nombre Completo</p>
                                                <p className="font-medium text-slate-900">{merchant.owner.firstName} {merchant.owner.lastName}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 mb-1">Email Personal</p>
                                                <p className="font-medium text-slate-900">{merchant.owner.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 mb-1">Teléfono Personal</p>
                                                <p className="font-medium text-slate-900">{merchant.owner.phone || "No registrado"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-navy mb-4">Datos Adicionales del Comercio</h3>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                <Building2 className="w-4 h-4 inline mr-1" />
                                                Razón Social
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.businessName}
                                                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                                className="input w-full"
                                                placeholder="Nombre legal de la empresa"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                <Calendar className="w-4 h-4 inline mr-1" />
                                                Inicio Actividad
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.startedAt}
                                                onChange={(e) => setFormData({ ...formData, startedAt: e.target.value })}
                                                className="input w-full"
                                            />
                                        </div>
                                    </div>

                                    <h4 className="font-medium text-gray-700 mt-6 mb-2">Redes Sociales</h4>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                <Instagram className="w-4 h-4 inline mr-1" />
                                                Instagram
                                            </label>
                                            <input
                                                type="url"
                                                value={formData.instagramUrl}
                                                onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                                                className="input w-full"
                                                placeholder="https://instagram.com/..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                <Facebook className="w-4 h-4 inline mr-1" />
                                                Facebook
                                            </label>
                                            <input
                                                type="url"
                                                value={formData.facebookUrl}
                                                onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                                                className="input w-full"
                                                placeholder="https://facebook.com/..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                <Phone className="w-4 h-4 inline mr-1" />
                                                WhatsApp Business
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.whatsappNumber}
                                                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                                                className="input w-full"
                                                placeholder="+54 9 ..."
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t">
                                        <h4 className="font-medium text-gray-700 mb-3">Ubicación y Dirección</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    <MapPin className="w-4 h-4 inline mr-1" />
                                                    Dirección
                                                </label>
                                                <AddressAutocomplete
                                                    value={formData.address}
                                                    onChange={(address, lat, lng) => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            address,
                                                            latitude: lat ?? prev.latitude,
                                                            longitude: lng ?? prev.longitude
                                                        }));
                                                    }}
                                                    placeholder="Dirección del comercio..."
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitud</label>
                                                    <input
                                                        type="number"
                                                        value={formData.latitude || ""}
                                                        onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                                                        className="input w-full bg-gray-50 text-gray-500"
                                                        step="any"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitud</label>
                                                    <input
                                                        type="number"
                                                        value={formData.longitude || ""}
                                                        onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                                                        className="input w-full bg-gray-50 text-gray-500"
                                                        step="any"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "legal" && (
                                <div className="space-y-4">
                                    <h3 className="font-bold text-navy mb-4">Datos Fiscales y Legales</h3>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                CUIT (Registro)
                                            </label>
                                            <input
                                                type="text"
                                                value={merchant.cuit || "No proporcionado"}
                                                className="input w-full bg-gray-50"
                                                disabled
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                CUIL Titular
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.cuil}
                                                onChange={(e) => setFormData({ ...formData, cuil: e.target.value })}
                                                className="input w-full"
                                                placeholder="XX-XXXXXXXX-X"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                DNI Dueño
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.ownerDni}
                                                onChange={(e) => setFormData({ ...formData, ownerDni: e.target.value })}
                                                className="input w-full"
                                                placeholder="XX.XXX.XXX"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Fecha Nac. Dueño
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.ownerBirthDate}
                                                onChange={(e) => setFormData({ ...formData, ownerBirthDate: e.target.value })}
                                                className="input w-full"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <CreditCard className="w-4 h-4 inline mr-1" />
                                            CBU / Alias para Pagos
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.bankAccount}
                                            onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                                            className="input w-full"
                                            placeholder="CBU o Alias de cuenta"
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === "notes" && (
                                <div className="space-y-4">
                                    <h3 className="font-bold text-navy mb-4">
                                        <FileText className="w-5 h-5 inline mr-2" />
                                        Notas Internas (Solo Admins)
                                    </h3>
                                    <textarea
                                        value={formData.adminNotes}
                                        onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
                                        className="input w-full resize-none"
                                        rows={8}
                                        placeholder="Notas internas sobre este comercio..."
                                    />
                                </div>
                            )}

                            <div className="mt-6 pt-4 border-t flex justify-end">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    {saving ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Save className="w-5 h-5" />
                                    )}
                                    Guardar Cambios
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Registration Data */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h2 className="font-bold text-navy mb-4 flex items-center gap-2">
                            <Store className="w-5 h-5 text-[#e60012]" />
                            Datos de Registro
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="font-medium flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    {merchant.email || "No proporcionado"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Teléfono</p>
                                <p className="font-medium flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    {merchant.phone || "No proporcionado"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Dirección</p>
                                <p className="font-medium flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    {merchant.address || "No proporcionada"}
                                </p>
                            </div>
                            {merchant.description && (
                                <div>
                                    <p className="text-sm text-gray-500">Descripción</p>
                                    <p className="text-sm text-gray-700">{merchant.description}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Owner Info */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h2 className="font-bold text-navy mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-[#e60012]" />
                            Dueño Registrado
                        </h2>
                        <div className="space-y-2">
                            <p className="font-medium">{merchant.owner.name}</p>
                            <p className="text-sm text-gray-600">{merchant.owner.email}</p>
                            {merchant.owner.phone && (
                                <a
                                    href={`https://wa.me/${merchant.owner.phone.replace(/\D/g, "")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-[#e60012] hover:underline"
                                >
                                    📱 {merchant.owner.phone}
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
