"use client";

// User Profile Page - Mi Perfil (Simplified - BottomNav comes from layout)
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppHeader from "@/components/layout/AppHeader";
import {
    User,
    Mail,
    Phone,
    MapPin,
    Plus,
    Edit2,
    Trash2,
    Check,
    Loader2,
    ShoppingBag,
    Star,
    X,
    ChevronRight,
    LogOut,
    HelpCircle,
    Gift,
    QrCode,
    Share2,
    Crown,
    AlertCircle,
    ArrowLeft
} from "lucide-react";

interface Address {
    id: string;
    label: string;
    street: string;
    number: string;
    apartment: string | null;
    city: string;
    isDefault: boolean;
}

interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    addresses: Address[];
}

export default function MiPerfilPage() {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeSection, setActiveSection] = useState<"main" | "edit" | "addresses" | "newAddress" | "deleteAccount">("main");

    // Profile edit state
    const [profileFirstName, setProfileFirstName] = useState("");
    const [profileLastName, setProfileLastName] = useState("");
    const [profilePhone, setProfilePhone] = useState("");
    const [originalProfile, setOriginalProfile] = useState({ firstName: "", lastName: "", phone: "" });
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);

    // Address form state
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
    const [addressLabel, setAddressLabel] = useState("");
    const [addressStreet, setAddressStreet] = useState("");
    const [addressNumber, setAddressNumber] = useState("");
    const [addressApartment, setAddressApartment] = useState("");
    const [addressCity, setAddressCity] = useState("");
    const [addressIsDefault, setAddressIsDefault] = useState(false);
    const [error, setError] = useState("");
    const [deleteEmail, setDeleteEmail] = useState("");

    const handleDeleteAccount = async () => {
        if (deleteEmail !== profile?.email) return;

        setSaving(true);
        setError("");

        try {
            const res = await fetch("/api/profile", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ confirmationEmail: deleteEmail }),
            });

            if (res.ok) {
                // Sign out and redirect
                await signOut({ callbackUrl: "/" });
            } else {
                const data = await res.json();
                setError(data.error || "Error al eliminar cuenta");
                setSaving(false);
            }
        } catch (err) {
            setError("Error de conexión");
            setSaving(false);
        }
    };

    useEffect(() => {
        if (authStatus === "unauthenticated") {
            router.push("/login?redirect=/mi-perfil");
        }
    }, [authStatus, router]);

    useEffect(() => {
        if (authStatus === "authenticated") {
            loadProfile();
        }
    }, [authStatus]);

    async function loadProfile() {
        try {
            const res = await fetch("/api/profile");
            if (res.ok) {
                const data = await res.json();
                setProfile(data);

                // Parse name into firstName and lastName
                const nameParts = (data.name || "").split(" ");
                const firstName = nameParts[0] || "";
                const lastName = nameParts.slice(1).join(" ") || "";
                const phone = data.phone || "";

                setProfileFirstName(firstName);
                setProfileLastName(lastName);
                setProfilePhone(phone);
                setOriginalProfile({ firstName, lastName, phone });
            }
        } catch (error) {
            console.error("Error loading profile:", error);
        } finally {
            setLoading(false);
        }
    }

    // Check if profile has changes
    const hasProfileChanges =
        profileFirstName !== originalProfile.firstName ||
        profileLastName !== originalProfile.lastName ||
        profilePhone !== originalProfile.phone;

    async function handleSaveProfile(e: React.FormEvent) {
        e.preventDefault();
        setShowSaveConfirm(false);
        setSaving(true);
        setError("");
        try {
            const fullName = `${profileFirstName} ${profileLastName}`.trim();

            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: fullName, phone: profilePhone || null }),
            });
            if (res.ok) {
                await loadProfile();
                setActiveSection("main");
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

    function startNewAddress() {
        setEditingAddressId(null);
        setAddressLabel("Casa");
        setAddressStreet("");
        setAddressNumber("");
        setAddressApartment("");
        setAddressCity("");
        setAddressIsDefault(false);
        setActiveSection("newAddress");
        setError("");
    }

    function startEditAddress(address: Address) {
        setEditingAddressId(address.id);
        setAddressLabel(address.label);
        setAddressStreet(address.street);
        setAddressNumber(address.number);
        setAddressApartment(address.apartment || "");
        setAddressCity(address.city);
        setAddressIsDefault(address.isDefault);
        setActiveSection("newAddress");
        setError("");
    }

    async function handleSaveAddress(e: React.FormEvent) {
        e.preventDefault();
        if (!addressStreet || !addressNumber) {
            setError("Calle y número son requeridos");
            return;
        }
        setSaving(true);
        setError("");
        try {
            const url = editingAddressId ? `/api/profile/addresses/${editingAddressId}` : "/api/profile/addresses";
            const res = await fetch(url, {
                method: editingAddressId ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    label: addressLabel || "Casa",
                    street: addressStreet,
                    number: addressNumber,
                    apartment: addressApartment || null,
                    city: addressCity,
                    province: "",
                    isDefault: addressIsDefault,
                }),
            });
            if (res.ok) {
                await loadProfile();
                setActiveSection("addresses");
            } else {
                const data = await res.json();
                setError(data.error || "Error al guardar dirección");
            }
        } catch {
            setError("Error de conexión");
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteAddress(id: string) {
        if (!confirm("¿Eliminar esta dirección?")) return;
        await fetch(`/api/profile/addresses/${id}`, { method: "DELETE" });
        await loadProfile();
    }

    async function setDefaultAddress(id: string) {
        await fetch(`/api/profile/addresses/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isDefault: true }),
        });
        await loadProfile();
    }

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/" });
    };

    if (authStatus === "loading" || loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-moovy" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4">
                <User className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4 text-center">No pudimos cargar tu perfil</p>
                <button
                    onClick={() => loadProfile()}
                    className="btn-primary"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    // ========== ADDRESSES LIST VIEW ==========
    if (activeSection === "addresses") {
        return (
            <>
                {/* Custom header with back arrow */}
                <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
                    <button
                        onClick={() => setActiveSection("main")}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-700" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">Mis Direcciones</h1>
                    <button onClick={startNewAddress} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-[#e60012]">
                        <Plus className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-4 space-y-3">
                    {profile.addresses.length === 0 ? (
                        <div className="text-center py-12">
                            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 mb-4">No tenés direcciones guardadas</p>
                            <button onClick={startNewAddress} className="btn-primary">Agregar Dirección</button>
                        </div>
                    ) : (
                        profile.addresses.map((address) => (
                            <div key={address.id} className={`bg-white rounded-xl p-4 ${address.isDefault ? "ring-2 ring-[#e60012]" : ""}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-navy">{address.label}</span>
                                            {address.isDefault && <span className="text-[10px] bg-moovy text-white px-2 py-0.5 rounded-full">Predeterminada</span>}
                                        </div>
                                        <p className="text-gray-600 text-sm">{address.street} {address.number}{address.apartment && `, ${address.apartment}`}</p>
                                        <p className="text-gray-400 text-xs">{address.city}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => startEditAddress(address)} className="p-2 text-gray-400"><Edit2 className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteAddress(address.id)} className="p-2 text-red-400"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                {!address.isDefault && (
                                    <button onClick={() => setDefaultAddress(address.id)} className="mt-2 text-xs text-moovy">Hacer predeterminada</button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </>
        );
    }

    // ========== NEW/EDIT ADDRESS VIEW ==========
    if (activeSection === "newAddress") {
        return (
            <>
                {/* Custom header with back arrow */}
                <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
                    <button
                        onClick={() => setActiveSection("addresses")}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-700" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">{editingAddressId ? "Editar Dirección" : "Nueva Dirección"}</h1>
                    <div className="w-10"></div>
                </div>
                <form onSubmit={handleSaveAddress} className="p-4 space-y-4">
                    {error && <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm">{error}</div>}
                    <div className="bg-white rounded-xl p-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Etiqueta</label>
                            <div className="flex gap-2">
                                {["Casa", "Trabajo", "Otro"].map((label) => (
                                    <button key={label} type="button" onClick={() => setAddressLabel(label)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${addressLabel === label ? "bg-moovy text-white" : "bg-gray-100 text-gray-600"}`}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Calle *</label>
                            <input type="text" value={addressStreet} onChange={(e) => setAddressStreet(e.target.value)} className="input" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Número *</label>
                                <input type="text" value={addressNumber} onChange={(e) => setAddressNumber(e.target.value)} className="input" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Piso/Depto</label>
                                <input type="text" value={addressApartment} onChange={(e) => setAddressApartment(e.target.value)} className="input" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                            <input type="text" value={addressCity} onChange={(e) => setAddressCity(e.target.value)} className="input" />
                        </div>
                        <label className="flex items-center gap-3 py-2">
                            <input type="checkbox" checked={addressIsDefault} onChange={(e) => setAddressIsDefault(e.target.checked)} className="w-5 h-5 text-moovy rounded" />
                            <span className="text-sm text-gray-700">Usar como dirección predeterminada</span>
                        </label>
                    </div>
                    <button type="submit" disabled={saving} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2">
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        {editingAddressId ? "Actualizar" : "Guardar Dirección"}
                    </button>
                </form>
            </>
        );
    }

    // ========== EDIT PROFILE VIEW ==========
    if (activeSection === "edit") {
        const countryCodes = [
            { code: "+54", country: "Argentina" },
            { code: "+1", country: "USA/Canada" },
            { code: "+55", country: "Brasil" },
            { code: "+56", country: "Chile" },
            { code: "+57", country: "Colombia" },
            { code: "+52", country: "México" },
            { code: "+598", country: "Uruguay" },
            { code: "+34", country: "España" },
        ];

        return (
            <>
                {/* Header with X button */}
                <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
                    <h1 className="text-lg font-bold text-gray-900">Editar Perfil</h1>
                    <button
                        onClick={() => setActiveSection("main")}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); setShowSaveConfirm(true); }} className="p-4 space-y-4">
                    {error && <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm">{error}</div>}

                    <div className="bg-white rounded-xl p-4 space-y-4">
                        {/* First Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                            <input
                                type="text"
                                value={profileFirstName}
                                onChange={(e) => setProfileFirstName(e.target.value)}
                                className="input"
                                placeholder="Tu nombre"
                                required
                            />
                        </div>

                        {/* Last Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                            <input
                                type="text"
                                value={profileLastName}
                                onChange={(e) => setProfileLastName(e.target.value)}
                                className="input"
                                placeholder="Tu apellido"
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                            <input
                                type="tel"
                                value={profilePhone}
                                onChange={(e) => setProfilePhone(e.target.value)}
                                placeholder="+54 9 2901 12-3456"
                                className="input"
                            />
                        </div>

                        {/* Email (disabled) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" value={profile.email} disabled className="input bg-gray-50 text-gray-500" />
                            <p className="text-xs text-gray-400 mt-1">El email no puede modificarse</p>
                        </div>
                    </div>

                    {/* Save button - disabled if no changes */}
                    <button
                        type="submit"
                        disabled={saving || !hasProfileChanges}
                        className={`w-full py-4 text-lg flex items-center justify-center gap-2 rounded-xl font-medium transition
                            ${hasProfileChanges
                                ? 'bg-[#e60012] text-white hover:bg-[#c4000f]'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        Guardar Cambios
                    </button>
                </form>

                {/* Confirmation Modal */}
                {showSaveConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">¿Guardar cambios?</h3>
                            <p className="text-gray-600 text-sm mb-6">
                                ¿Estás seguro que querés actualizar tu información de perfil?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowSaveConfirm(false)}
                                    className="flex-1 py-3 rounded-xl border border-gray-200 font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={saving}
                                    className="flex-1 py-3 rounded-xl bg-[#e60012] text-white font-medium flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    // ========== DELETE ACCOUNT VIEW ==========
    if (activeSection === "deleteAccount") {
        return (
            <>
                {/* Custom header with back arrow */}
                <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
                    <button
                        onClick={() => setActiveSection("main")}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-700" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">Eliminar Cuenta</h1>
                    <div className="w-10"></div>
                </div>
                <div className="p-6">
                    <div className="bg-red-50 border border-red-100 rounded-xl p-6 mb-8 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold text-red-700 mb-2">¿Estás seguro?</h2>
                        <p className="text-red-600 text-sm mb-4">
                            Al eliminar tu cuenta, <strong>perderás todos tus puntos MOOVER</strong>, tu nivel actual, historiales de pedidos y direcciones guardadas.
                        </p>
                        <p className="text-red-800 font-bold text-sm">
                            Esta acción no se puede deshacer.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Para confirmar, escribí tu email:
                            </label>
                            <div className="p-3 bg-gray-100 rounded-lg text-gray-500 text-sm text-center mb-2 font-mono">
                                {profile.email}
                            </div>
                            <input
                                type="email"
                                value={deleteEmail}
                                onChange={(e) => setDeleteEmail(e.target.value)}
                                placeholder="Tu email aquí"
                                className="input border-red-200 focus:border-red-500 focus:ring-red-200"
                            />
                        </div>

                        {error && <div className="text-red-600 text-sm text-center">{error}</div>}

                        <button
                            onClick={handleDeleteAccount}
                            disabled={deleteEmail !== profile.email || saving}
                            className="btn-primary bg-red-600 hover:bg-red-700 w-full py-4 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" /> Procesando...
                                </span>
                            ) : (
                                "Sí, eliminar mi cuenta permanentemente"
                            )}
                        </button>

                        <button
                            onClick={() => setActiveSection("main")}
                            className="w-full py-3 text-gray-500 font-medium"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </>
        );
    }

    // ========== MAIN PROFILE VIEW ==========
    return (
        <>
            {/* Profile Header */}
            <div className="bg-[#e60012] pt-8 pb-6 px-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 text-white">
                        <h1 className="text-xl font-bold">{profile.name}</h1>
                        <p className="text-white/80 text-sm">{profile.email}</p>
                    </div>
                    <button onClick={() => setActiveSection("edit")} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <Edit2 className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Quick Action - Direcciones */}
                <button
                    onClick={() => setActiveSection("addresses")}
                    className="group relative w-full overflow-hidden bg-gradient-to-br from-violet-500 to-purple-700 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] text-left"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-white font-bold text-lg">Mis Direcciones</p>
                            <p className="text-white/70 text-sm">{profile.addresses.length} guardadas</p>
                        </div>
                        <ChevronRight className="w-6 h-6 text-white/60" />
                    </div>
                </button>

                {/* Profile Info Card */}
                <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <h2 className="font-semibold text-navy">Información Personal</h2>
                    </div>
                    <button onClick={() => setActiveSection("edit")} className="w-full px-4 py-4 flex items-center justify-between border-b border-gray-50">
                        <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-gray-400" />
                            <div className="text-left">
                                <p className="text-xs text-gray-400">Nombre</p>
                                <p className="text-navy">{profile.name}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300" />
                    </button>
                    <div className="px-4 py-4 flex items-center gap-3 border-b border-gray-50">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                            <p className="text-xs text-gray-400">Email</p>
                            <p className="text-navy">{profile.email}</p>
                        </div>
                    </div>
                    <button onClick={() => setActiveSection("edit")} className="w-full px-4 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-gray-400" />
                            <div className="text-left">
                                <p className="text-xs text-gray-400">Teléfono</p>
                                <p className={profile.phone ? "text-navy" : "text-gray-400"}>{profile.phone || "Agregar teléfono"}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300" />
                    </button>
                </div>

                {/* Menu Items */}
                <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                    <button onClick={() => setActiveSection("addresses")} className="w-full px-4 py-4 flex items-center justify-between border-b border-gray-50">
                        <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-moovy" />
                            <span className="text-navy">Mis Direcciones</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400">{profile.addresses.length}</span>
                            <ChevronRight className="w-5 h-5 text-gray-300" />
                        </div>
                    </button>
                    <Link href="/mis-pedidos" className="w-full px-4 py-4 flex items-center justify-between border-b border-gray-50">
                        <div className="flex items-center gap-3">
                            <ShoppingBag className="w-5 h-5 text-moovy" />
                            <span className="text-navy">Historial de Pedidos</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300" />
                    </Link>
                    <Link href="/contacto" className="w-full px-4 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <HelpCircle className="w-5 h-5 text-moovy" />
                            <span className="text-navy">Ayuda y Contacto</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300" />
                    </Link>
                </div>

                {/* Logout */}
                <button onClick={handleSignOut} className="w-full bg-white rounded-xl px-4 py-4 flex items-center gap-3 text-red-500 shadow-sm mb-4">
                    <LogOut className="w-5 h-5" />
                    <span>Cerrar Sesión</span>
                </button>

                {/* Delete Account Entry */}
                <div className="px-4 pb-8">
                    <button
                        onClick={() => setActiveSection("deleteAccount")}
                        className="text-xs text-gray-400 underline hover:text-red-500 w-full text-center"
                    >
                        Eliminar mi cuenta
                    </button>
                </div>
            </div >
        </>
    );
}

