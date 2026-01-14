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
    Crown
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
    const [activeSection, setActiveSection] = useState<"main" | "edit" | "addresses" | "newAddress">("main");

    // Profile edit state
    const [profileName, setProfileName] = useState("");
    const [profilePhone, setProfilePhone] = useState("");

    // Address form state
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
    const [addressLabel, setAddressLabel] = useState("");
    const [addressStreet, setAddressStreet] = useState("");
    const [addressNumber, setAddressNumber] = useState("");
    const [addressApartment, setAddressApartment] = useState("");
    const [addressCity, setAddressCity] = useState("");
    const [addressIsDefault, setAddressIsDefault] = useState(false);
    const [error, setError] = useState("");

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
                setProfileName(data.name);
                setProfilePhone(data.phone || "");
            }
        } catch (error) {
            console.error("Error loading profile:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSaveProfile(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: profileName, phone: profilePhone || null }),
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
                <AppHeader title="Mis Direcciones" showBack rightAction={
                    <button onClick={startNewAddress} className="text-moovy"><Plus className="w-6 h-6" /></button>
                } />
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
                <AppHeader title={editingAddressId ? "Editar Dirección" : "Nueva Dirección"} showBack />
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
        return (
            <>
                <AppHeader title="Editar Perfil" showBack />
                <form onSubmit={handleSaveProfile} className="p-4 space-y-4">
                    {error && <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm">{error}</div>}
                    <div className="bg-white rounded-xl p-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                            <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="input" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                            <input type="tel" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} placeholder="+54 9 264..." className="input" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" value={profile.email} disabled className="input bg-gray-50 text-gray-500" />
                            <p className="text-xs text-gray-400 mt-1">El email no puede modificarse</p>
                        </div>
                    </div>
                    <button type="submit" disabled={saving} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2">
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        Guardar Cambios
                    </button>
                </form>
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

            <div className="p-4 space-y-4 -mt-4">
                {/* ========== MOOVER HERO CARD ========== */}
                <Link href="/puntos" className="block bg-gradient-to-r from-[#e60012] to-red-600 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />

                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                                <Crown className="w-7 h-7 text-yellow-300" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-lg">MOOVER</span>
                                    <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold">#SoyMoover</span>
                                </div>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-bold">0</span>
                                    <span className="text-white/70 text-sm">puntos</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-1">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                                <QrCode className="w-6 h-6 text-[#e60012]" />
                            </div>
                            <span className="text-[10px] text-white/70">Mi QR</span>
                        </div>
                    </div>

                    {/* Share referral */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20">
                        <span className="text-sm text-white/80">Invitá amigos y ganá puntos</span>
                        <button className="flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-full text-sm font-medium">
                            <Share2 className="w-4 h-4" />
                            Compartir
                        </button>
                    </div>
                </Link>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <Link href="/mis-pedidos" className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
                        <div className="w-12 h-12 bg-moovy-light rounded-xl flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-moovy" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Mis Pedidos</p>
                            <p className="font-bold text-navy">Ver todos →</p>
                        </div>
                    </Link>
                    <button onClick={() => setActiveSection("addresses")} className="bg-white rounded-xl p-4 flex items-center gap-3 text-left shadow-sm">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Direcciones</p>
                            <p className="font-bold text-navy">{profile.addresses.length} guardadas</p>
                        </div>
                    </button>
                </div>

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
                <button onClick={handleSignOut} className="w-full bg-white rounded-xl px-4 py-4 flex items-center gap-3 text-red-500 shadow-sm">
                    <LogOut className="w-5 h-5" />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </>
    );
}

