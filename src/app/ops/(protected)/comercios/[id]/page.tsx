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
    FileText,
    Eye,
    TrendingUp,
    DollarSign,
    Clock,
    Star,
    AlertCircle
} from "lucide-react";
import { AddressAutocomplete } from "@/components/forms/AddressAutocomplete";
import { formatPrice } from "@/lib/delivery";

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
    constanciaAfipUrl: string | null;
    habilitacionMunicipalUrl: string | null;
    registroSanitarioUrl: string | null;
    acceptedTermsAt: string | null;
    startedAt: string | null;
    instagramUrl: string | null;
    facebookUrl: string | null;
    whatsappNumber: string | null;
    adminNotes: string | null;
    commissionRate: number;
    rating: number | null;
    scheduleEnabled: boolean;
    scheduleJson: string | null;
    mpAccessToken: string | null;
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

interface OrderItem {
    id: string;
    orderNumber: string;
    createdAt: string;
    status: string;
    total: number;
    user: { name: string | null; email: string };
    paymentMethod: string;
}

interface ProductItem {
    id: string;
    name: string;
    price: number;
    stock: number;
    isActive: boolean;
    images: Array<{ url: string }>;
}

interface EarningsData {
    summary: {
        merchantId: string;
        commissionRate: number;
        thisMonth: { totalSales: number; payout: number; commission: number; orderCount: number };
        lastMonth: { totalSales: number; payout: number; commission: number; orderCount: number };
        allTime: { totalSales: number; payout: number; commission: number; orderCount: number };
    };
}

type Schedule = Record<string, { open: string; close: string; enabled: boolean }>;

export default function MerchantDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [merchant, setMerchant] = useState<Merchant | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"info" | "legal" | "orders" | "products" | "earnings" | "schedule" | "notes">("info");

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

    // Commission
    const [commissionRate, setCommissionRate] = useState(8);
    const [savingCommission, setSavingCommission] = useState(false);

    // Orders tab
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    // Products tab
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Earnings tab
    const [earnings, setEarnings] = useState<EarningsData | null>(null);
    const [loadingEarnings, setLoadingEarnings] = useState(false);

    // Schedule tab
    const [schedule, setSchedule] = useState<Schedule>({
        lunes: { open: "09:00", close: "18:00", enabled: true },
        martes: { open: "09:00", close: "18:00", enabled: true },
        miercoles: { open: "09:00", close: "18:00", enabled: true },
        jueves: { open: "09:00", close: "18:00", enabled: true },
        viernes: { open: "09:00", close: "18:00", enabled: true },
        sabado: { open: "09:00", close: "18:00", enabled: true },
        domingo: { open: "09:00", close: "18:00", enabled: false },
    });
    const [savingSchedule, setSavingSchedule] = useState(false);

    useEffect(() => {
        fetchMerchant();
    }, [id]);

    useEffect(() => {
        // Fetch tab-specific data when tab changes
        if (activeTab === "orders" && orders.length === 0) {
            fetchOrders();
        } else if (activeTab === "products" && products.length === 0) {
            fetchProducts();
        } else if (activeTab === "earnings" && !earnings) {
            fetchEarnings();
        } else if (activeTab === "schedule" && merchant?.scheduleJson) {
            loadSchedule();
        }
    }, [activeTab]);

    async function fetchMerchant() {
        try {
            const res = await fetch(`/api/admin/merchants/${id}`);
            if (res.ok) {
                const data = await res.json();
                setMerchant(data);
                setCommissionRate(data.commissionRate || 8);
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
                if (data.scheduleJson) {
                    try {
                        const parsed = JSON.parse(data.scheduleJson);
                        setSchedule(parsed);
                    } catch (e) {
                        console.error("Error parsing schedule JSON", e);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching merchant:", error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchOrders() {
        setLoadingOrders(true);
        try {
            const res = await fetch(`/api/admin/orders?merchantId=${id}&limit=50`);
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders || []);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoadingOrders(false);
        }
    }

    async function fetchProducts() {
        setLoadingProducts(true);
        try {
            const res = await fetch(`/api/admin/products?merchantId=${id}`);
            if (res.ok) {
                const data = await res.json();
                setProducts(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoadingProducts(false);
        }
    }

    async function fetchEarnings() {
        setLoadingEarnings(true);
        try {
            // Modified to support merchantId in query
            const res = await fetch(`/api/merchant/earnings?merchantId=${id}`);
            if (res.ok) {
                const data = await res.json();
                setEarnings(data);
            }
        } catch (error) {
            console.error("Error fetching earnings:", error);
        } finally {
            setLoadingEarnings(false);
        }
    }

    function loadSchedule() {
        if (merchant?.scheduleJson) {
            try {
                const parsed = JSON.parse(merchant.scheduleJson);
                setSchedule(parsed);
            } catch (e) {
                console.error("Error parsing schedule JSON", e);
            }
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

    async function toggleActive() {
        if (!merchant) return;
        try {
            const res = await fetch(`/api/admin/merchants/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !merchant.isActive }),
            });
            if (res.ok) {
                const updated = await res.json();
                setMerchant(updated);
            }
        } catch (error) {
            console.error("Error toggling active:", error);
        }
    }

    async function toggleOpen() {
        if (!merchant) return;
        try {
            const res = await fetch(`/api/admin/merchants/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isOpen: !merchant.isOpen }),
            });
            if (res.ok) {
                const updated = await res.json();
                setMerchant(updated);
            }
        } catch (error) {
            console.error("Error toggling open:", error);
        }
    }

    async function saveCommission() {
        setSavingCommission(true);
        try {
            const res = await fetch(`/api/admin/merchants/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ commissionRate }),
            });
            if (res.ok) {
                const updated = await res.json();
                setMerchant(updated);
            }
        } catch (error) {
            console.error("Error saving commission:", error);
        } finally {
            setSavingCommission(false);
        }
    }

    async function saveSchedule() {
        setSavingSchedule(true);
        try {
            const res = await fetch(`/api/admin/merchants/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    scheduleEnabled: true,
                    scheduleJson: JSON.stringify(schedule),
                }),
            });
            if (res.ok) {
                const updated = await res.json();
                setMerchant(updated);
            }
        } catch (error) {
            console.error("Error saving schedule:", error);
        } finally {
            setSavingSchedule(false);
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
                            <h1 className="text-2xl font-bold text-gray-900">{merchant.name}</h1>
                            {merchant.isVerified && (
                                <BadgeCheck className="w-6 h-6 text-blue-500" />
                            )}
                        </div>
                        <p className="text-gray-500">{merchant.category}</p>
                    </div>
                </div>

                <div className="flex gap-2 flex-wrap">
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
                    <button
                        onClick={toggleActive}
                        className={`px-4 py-2 rounded-lg font-medium transition ${merchant.isActive
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                            }`}
                    >
                        {merchant.isActive ? "Activo" : "Suspendido"}
                    </button>
                    <button
                        onClick={toggleOpen}
                        className={`px-4 py-2 rounded-lg font-medium transition ${merchant.isOpen
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        {merchant.isOpen ? "Abierto" : "Cerrado"}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <Package className="w-8 h-8 text-[#e60012]" />
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{merchant._count.products}</p>
                            <p className="text-sm text-gray-500">Productos</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <ShoppingBag className="w-8 h-8 text-green-500" />
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{merchant._count.orders}</p>
                            <p className="text-sm text-gray-500">Pedidos</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:bg-gray-50 transition" onClick={toggleActive}>
                    <div className="flex items-center gap-3">
                        {merchant.isActive ? (
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        ) : (
                            <XCircle className="w-8 h-8 text-red-500" />
                        )}
                        <div>
                            <p className="text-lg font-bold text-gray-900">
                                {merchant.isActive ? "Activo" : "Inactivo"}
                            </p>
                            <p className="text-sm text-gray-500">Estado</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-red-500" />
                        <div>
                            <p className="text-lg font-bold text-gray-900">
                                {new Date(merchant.createdAt).toLocaleDateString("es-AR")}
                            </p>
                            <p className="text-sm text-gray-500">Registro</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <Star className="w-8 h-8 text-yellow-500" />
                        <div>
                            <p className="text-lg font-bold text-gray-900">
                                {merchant.rating ? merchant.rating.toFixed(1) : "—"}
                            </p>
                            <p className="text-sm text-gray-500">Rating</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tabs */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="flex border-b overflow-x-auto">
                            {["info", "legal", "orders", "products", "earnings", "schedule", "notes"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`py-3 px-4 text-sm font-medium transition whitespace-nowrap ${activeTab === tab
                                        ? "bg-[#e60012] text-white"
                                        : "text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    {tab === "info" && "Información"}
                                    {tab === "legal" && "Datos Fiscales"}
                                    {tab === "orders" && "Pedidos"}
                                    {tab === "products" && "Productos"}
                                    {tab === "earnings" && "Ganancias"}
                                    {tab === "schedule" && "Horarios"}
                                    {tab === "notes" && "Notas"}
                                </button>
                            ))}
                        </div>

                        <div className="p-6">
                            {activeTab === "info" && (
                                <div className="space-y-6">
                                    {/* Owner Info Details (Read-only as it belongs to User) */}
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                        <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
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

                                    <h3 className="font-bold text-gray-900 mb-4">Datos Adicionales del Comercio</h3>

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
                                    <h3 className="font-bold text-gray-900 mb-4">Datos Fiscales y Legales</h3>

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

                                    {/* Documents */}
                                    <div className="pt-4 border-t">
                                        <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            Documentación Presentada
                                        </h4>
                                        <div className="space-y-3">
                                            <DocRow label="Constancia AFIP" url={merchant.constanciaAfipUrl} />
                                            <DocRow label="Habilitación Municipal" url={merchant.habilitacionMunicipalUrl} />
                                            <DocRow label="Registro Sanitario" url={merchant.registroSanitarioUrl} />
                                        </div>
                                        {merchant.acceptedTermsAt && (
                                            <p className="text-xs text-gray-400 mt-3">
                                                Términos aceptados: {new Date(merchant.acceptedTermsAt).toLocaleDateString("es-AR")}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === "orders" && (
                                <div className="space-y-4">
                                    <h3 className="font-bold text-gray-900 mb-4">Historial de Pedidos</h3>
                                    {loadingOrders ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin text-[#e60012]" />
                                        </div>
                                    ) : orders.length === 0 ? (
                                        <div className="text-center py-8">
                                            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                            <p className="text-gray-500">No hay pedidos para este comercio</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="border-b bg-gray-50">
                                                    <tr>
                                                        <th className="text-left py-2 px-3 font-medium text-gray-700">Pedido</th>
                                                        <th className="text-left py-2 px-3 font-medium text-gray-700">Fecha</th>
                                                        <th className="text-left py-2 px-3 font-medium text-gray-700">Cliente</th>
                                                        <th className="text-left py-2 px-3 font-medium text-gray-700">Estado</th>
                                                        <th className="text-right py-2 px-3 font-medium text-gray-700">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {orders.map((order) => (
                                                        <tr key={order.id} className="border-b hover:bg-gray-50">
                                                            <td className="py-3 px-3 font-medium">{order.orderNumber}</td>
                                                            <td className="py-3 px-3 text-gray-600">
                                                                {new Date(order.createdAt).toLocaleDateString("es-AR")}
                                                            </td>
                                                            <td className="py-3 px-3 text-gray-600">{order.user.name || "—"}</td>
                                                            <td className="py-3 px-3">
                                                                <span className={`text-xs font-medium px-2 py-1 rounded ${
                                                                    order.status === "DELIVERED"
                                                                        ? "bg-green-100 text-green-700"
                                                                        : order.status === "PENDING"
                                                                            ? "bg-yellow-100 text-yellow-700"
                                                                            : "bg-blue-100 text-blue-700"
                                                                }`}>
                                                                    {order.status}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-3 text-right font-medium">{formatPrice(order.total)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "products" && (
                                <div className="space-y-4">
                                    <h3 className="font-bold text-gray-900 mb-4">Productos</h3>
                                    {loadingProducts ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin text-[#e60012]" />
                                        </div>
                                    ) : products.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                            <p className="text-gray-500">No hay productos para este comercio</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                            {products.map((product) => (
                                                <div key={product.id} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition">
                                                    <div className="bg-white rounded h-24 mb-2 overflow-hidden flex items-center justify-center">
                                                        {product.images?.[0] ? (
                                                            <img
                                                                src={product.images[0].url}
                                                                alt={product.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <Package className="w-8 h-8 text-gray-300" />
                                                        )}
                                                    </div>
                                                    <h4 className="font-medium text-sm text-gray-900 line-clamp-2">{product.name}</h4>
                                                    <p className="text-[#e60012] font-bold text-sm mt-1">{formatPrice(product.price)}</p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-xs text-gray-500">Stock: {product.stock}</span>
                                                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                                                            product.isActive ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"
                                                        }`}>
                                                            {product.isActive ? "Activo" : "Inactivo"}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "earnings" && (
                                <div className="space-y-6">
                                    <h3 className="font-bold text-gray-900 mb-4">Ganancias y Comisiones</h3>
                                    {loadingEarnings ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin text-[#e60012]" />
                                        </div>
                                    ) : earnings ? (
                                        <>
                                            {/* KPI Cards */}
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                                                    <div className="flex items-center gap-3">
                                                        <DollarSign className="w-8 h-8 text-green-600" />
                                                        <div>
                                                            <p className="text-sm text-green-700">Total Ganado (Todos los tiempos)</p>
                                                            <p className="text-2xl font-bold text-green-900">
                                                                {formatPrice(earnings.summary.allTime.payout)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                                                    <div className="flex items-center gap-3">
                                                        <TrendingUp className="w-8 h-8 text-red-600" />
                                                        <div>
                                                            <p className="text-sm text-red-700">Comisiones Totales</p>
                                                            <p className="text-2xl font-bold text-red-900">
                                                                {formatPrice(earnings.summary.allTime.commission)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Monthly breakdown */}
                                            <div className="grid sm:grid-cols-3 gap-4">
                                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                                    <p className="text-sm text-blue-700 font-medium mb-3">Este Mes</p>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Ventas:</span>
                                                            <span className="font-medium">{formatPrice(earnings.summary.thisMonth.totalSales)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Comisión:</span>
                                                            <span className="font-medium">{formatPrice(earnings.summary.thisMonth.commission)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Payout:</span>
                                                            <span className="font-medium text-green-700">{formatPrice(earnings.summary.thisMonth.payout)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                                                    <p className="text-sm text-red-700 font-medium mb-3">Mes Anterior</p>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Ventas:</span>
                                                            <span className="font-medium">{formatPrice(earnings.summary.lastMonth.totalSales)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Comisión:</span>
                                                            <span className="font-medium">{formatPrice(earnings.summary.lastMonth.commission)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Payout:</span>
                                                            <span className="font-medium text-green-700">{formatPrice(earnings.summary.lastMonth.payout)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                    <p className="text-sm text-gray-700 font-medium mb-3">Todos los Tiempos</p>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Ventas:</span>
                                                            <span className="font-medium">{formatPrice(earnings.summary.allTime.totalSales)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Comisión:</span>
                                                            <span className="font-medium">{formatPrice(earnings.summary.allTime.commission)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Payout:</span>
                                                            <span className="font-medium text-green-700">{formatPrice(earnings.summary.allTime.payout)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-8">
                                            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                            <p className="text-gray-500">Error cargando ganancias</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "schedule" && (
                                <div className="space-y-4">
                                    <h3 className="font-bold text-gray-900 mb-4">Horarios de Atención</h3>
                                    <div className="space-y-3">
                                        {Object.entries(schedule).map(([day, times]) => (
                                            <div key={day} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                <input
                                                    type="checkbox"
                                                    checked={times.enabled}
                                                    onChange={(e) => {
                                                        setSchedule({
                                                            ...schedule,
                                                            [day]: { ...times, enabled: e.target.checked }
                                                        });
                                                    }}
                                                    className="w-5 h-5 rounded cursor-pointer"
                                                />
                                                <label className="flex-1 font-medium text-gray-700 capitalize min-w-[100px]">{day}</label>
                                                {times.enabled && (
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="time"
                                                            value={times.open}
                                                            onChange={(e) => {
                                                                setSchedule({
                                                                    ...schedule,
                                                                    [day]: { ...times, open: e.target.value }
                                                                });
                                                            }}
                                                            className="input w-24"
                                                        />
                                                        <span className="text-gray-500">–</span>
                                                        <input
                                                            type="time"
                                                            value={times.close}
                                                            onChange={(e) => {
                                                                setSchedule({
                                                                    ...schedule,
                                                                    [day]: { ...times, close: e.target.value }
                                                                });
                                                            }}
                                                            className="input w-24"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === "notes" && (
                                <div className="space-y-4">
                                    <h3 className="font-bold text-gray-900 mb-4">
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

                            <div className="mt-6 pt-4 border-t flex justify-end gap-2">
                                {activeTab === "schedule" && (
                                    <button
                                        onClick={saveSchedule}
                                        disabled={savingSchedule}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        {savingSchedule ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Save className="w-5 h-5" />
                                        )}
                                        Guardar Horarios
                                    </button>
                                )}
                                {(activeTab === "info" || activeTab === "legal" || activeTab === "notes") && (
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
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Registration Data */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
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
                        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
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

                    {/* Configuration */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h2 className="font-bold text-gray-900 mb-4">Configuración Comercial</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">Comisión (%)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        step={0.1}
                                        value={commissionRate}
                                        onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
                                        className="input flex-1"
                                    />
                                    <button
                                        onClick={saveCommission}
                                        disabled={savingCommission}
                                        className="btn-primary px-3 flex items-center gap-1"
                                    >
                                        {savingCommission ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">MercadoPago</p>
                                <p className="font-medium text-sm flex items-center gap-2">
                                    {merchant.mpAccessToken ? (
                                        <>
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            Vinculado
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-4 h-4 text-red-600" />
                                            No vinculado
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DocRow({ label, url }: { label: string; url: string | null }) {
    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">{label}</span>
            {url ? (
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline font-medium flex items-center gap-1"
                >
                    <Eye className="w-4 h-4" />
                    Ver documento
                </a>
            ) : (
                <span className="text-xs text-gray-400">No presentado</span>
            )}
        </div>
    );
}
