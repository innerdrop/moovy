"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Building2,
    Truck,
    ShoppingBag,
    MapPin,
    Star,
    CheckCircle,
    XCircle,
    Clock,
    Package,
    CreditCard,
    Lock,
    Unlock,
    Eye,
    FileText,
    Car,
    AlertTriangle,
    Loader2,
    ChevronDown,
    ChevronUp,
    Gift,
    Shield,
} from "lucide-react";
import { toast } from "@/store/toast";
import { confirm } from "@/store/confirm";
import { formatPrice } from "@/lib/delivery";
import { UserAdminActions } from "@/components/ops/UserAdminActions";
import { UserActivityLog } from "@/components/ops/UserActivityLog";

interface UserData {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    image: string | null;
    pointsBalance: number;
    createdAt: string;
    deletedAt: string | null;
    referralCode: string | null;
    emailVerified: string | null;
    isSuspended: boolean;
    suspendedAt: string | null;
    suspendedUntil: string | null;
    suspensionReason: string | null;
    archivedAt: string | null;
    roles: Array<{ id: string; role: string; isActive: boolean; activatedAt: string }>;
    merchant: MerchantData | null;
    driver: DriverData | null;
    seller: SellerData | null;
    addresses: Address[];
    recentOrders: Order[];
    pointsTransactions: PointsTransaction[];
    stats: { totalOrders: number; totalSpent: number; memberSince: string };
}

interface MerchantData {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    isActive: boolean;
    isOpen: boolean;
    email: string | null;
    phone: string | null;
    address: string | null;
    approvalStatus: string;
    commissionRate: number;
    commissionOverride: number | null;
    commissionOverrideReason: string | null;
    rating: number | null;
    loyaltyTier: string;
    loyaltyTierLocked: boolean;
    category: string | null;
    deliveryRadiusKm: number;
    minOrderAmount: number;
    allowPickup: boolean;
    cuit: string | null;
    constanciaAfipUrl: string | null;
    habilitacionMunicipalUrl: string | null;
    registroSanitarioUrl: string | null;
    approvedAt: string | null;
    rejectionReason: string | null;
    createdAt: string;
    updatedAt: string;
    _count: { orders: number; products: number };
}

interface DriverData {
    id: string;
    vehicleType: string | null;
    vehicleBrand: string | null;
    vehicleModel: string | null;
    vehicleYear: number | null;
    vehicleColor: string | null;
    licensePlate: string | null;
    cuit: string | null;
    licenciaUrl: string | null;
    seguroUrl: string | null;
    vtvUrl: string | null;
    dniFrenteUrl: string | null;
    dniDorsoUrl: string | null;
    isActive: boolean;
    isOnline: boolean;
    totalDeliveries: number;
    rating: number | null;
    approvalStatus: string;
    approvedAt: string | null;
    rejectionReason: string | null;
    createdAt: string;
    updatedAt: string;
}

interface SellerData {
    id: string;
    displayName: string | null;
    bio: string | null;
    avatar: string | null;
    isActive: boolean;
    isVerified: boolean;
    totalSales: number;
    rating: number | null;
    commissionRate: number;
    mpLinkedAt: string | null;
    isOnline: boolean;
    isPaused: boolean;
    pauseEndsAt: string | null;
    preparationMinutes: number;
    createdAt: string;
    updatedAt: string;
    _count: { listings: number };
}

interface Address {
    id: string;
    label: string;
    street: string;
    number: string;
    apartment: string | null;
    neighborhood: string | null;
    city: string;
    province: string;
    zipCode: string | null;
    isDefault: boolean;
    createdAt: string;
}

interface Order {
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
    deliveredAt: string | null;
    merchant: { id: string; name: string } | null;
}

interface PointsTransaction {
    id: string;
    amount: number;
    type: string;
    description: string;
    balanceAfter: number;
    createdAt: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
    APPROVED: { label: "Aprobado", color: "bg-green-100 text-green-800" },
    REJECTED: { label: "Rechazado", color: "bg-red-100 text-red-800" },
};

const loyaltyTierColors: Record<string, string> = {
    BRONCE: "bg-amber-100 text-amber-800",
    PLATA: "bg-slate-100 text-slate-800",
    ORO: "bg-yellow-100 text-yellow-800",
    DIAMANTE: "bg-purple-100 text-purple-800",
};

const orderStatusLabels: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
    CONFIRMED: { label: "Confirmado", color: "bg-blue-100 text-blue-700" },
    PREPARING: { label: "Preparando", color: "bg-red-100 text-red-700" },
    READY: { label: "Listo", color: "bg-indigo-100 text-indigo-700" },
    PICKED_UP: { label: "Retirado", color: "bg-orange-100 text-orange-700" },
    IN_DELIVERY: { label: "En camino", color: "bg-orange-100 text-orange-700" },
    DELIVERED: { label: "Entregado", color: "bg-green-100 text-green-700" },
    CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-700" },
};

const getRoleBadgeColor = (role: string): string => {
    switch (role) {
        case "ADMIN":
            return "bg-red-100 text-red-800";
        case "COMERCIO":
            return "bg-blue-100 text-blue-800";
        case "DRIVER":
            return "bg-amber-100 text-amber-800";
        case "SELLER":
            return "bg-purple-100 text-purple-800";
        case "USER":
            return "bg-gray-100 text-gray-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
};

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const userId = unwrappedParams.id;
    const router = useRouter();

    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState<"info" | "actions" | "activity">("info");

    const [expandedMerchant, setExpandedMerchant] = useState(true);
    const [expandedDriver, setExpandedDriver] = useState(true);
    const [expandedSeller, setExpandedSeller] = useState(true);

    useEffect(() => {
        fetchUser();
    }, [userId]);

    const fetchUser = async () => {
        try {
            const res = await fetch(`/api/admin/users-unified/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            } else if (res.status === 404) {
                toast.error("Usuario no encontrado");
                router.push("/ops/usuarios");
            } else {
                toast.error("Error al cargar el usuario");
            }
        } catch (error) {
            console.error("Error fetching user:", error);
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    const handleApproveRole = async (roleType: "merchant" | "driver") => {
        if (!user) return;

        const roleData = roleType === "merchant" ? user.merchant : user.driver;
        if (!roleData) return;

        const ok = await confirm({
            title: `Aprobar ${roleType === "merchant" ? "Comercio" : "Repartidor"}`,
            message: `¿Confirmar la aprobación de "${roleType === "merchant" ? (roleData as MerchantData).name : "Repartidor"}"?`,
            confirmLabel: "Aprobar",
            variant: "default",
        });

        if (!ok) return;

        setProcessing(true);
        try {
            const endpoint = roleType === "merchant"
                ? `/api/admin/merchants/${roleData.id}/approve`
                : `/api/admin/drivers/${roleData.id}/approve`;

            const res = await fetch(endpoint, { method: "POST" });

            if (res.ok) {
                toast.success(`${roleType === "merchant" ? "Comercio" : "Repartidor"} aprobado correctamente`);
                fetchUser();
            } else {
                toast.error("Error al aprobar");
            }
        } catch (error) {
            console.error("Error approving:", error);
            toast.error("Error de conexión");
        } finally {
            setProcessing(false);
        }
    };

    const handleRejectRole = async (roleType: "merchant" | "driver") => {
        if (!user) return;

        const roleData = roleType === "merchant" ? user.merchant : user.driver;
        if (!roleData) return;

        const ok = await confirm({
            title: `Rechazar ${roleType === "merchant" ? "Comercio" : "Repartidor"}`,
            message: `¿Confirmar el rechazo de "${roleType === "merchant" ? (roleData as MerchantData).name : "Repartidor"}"?`,
            confirmLabel: "Rechazar",
            variant: "danger",
        });

        if (!ok) return;

        setProcessing(true);
        try {
            const endpoint = roleType === "merchant"
                ? `/api/admin/merchants/${roleData.id}/reject`
                : `/api/admin/drivers/${roleData.id}/reject`;

            const res = await fetch(endpoint, { method: "POST" });

            if (res.ok) {
                toast.success(`${roleType === "merchant" ? "Comercio" : "Repartidor"} rechazado correctamente`);
                fetchUser();
            } else {
                toast.error("Error al rechazar");
            }
        } catch (error) {
            console.error("Error rejecting:", error);
            toast.error("Error de conexión");
        } finally {
            setProcessing(false);
        }
    };

    const handleUnlockAccount = async () => {
        if (!user) return;

        const ok = await confirm({
            title: "Desbloquear cuenta",
            message: `¿Desbloquear la cuenta de ${user.name || user.email}?`,
            confirmLabel: "Desbloquear",
            variant: "default",
        });

        if (!ok) return;

        setProcessing(true);
        try {
            const res = await fetch("/api/admin/users/unlock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email }),
            });

            if (res.ok) {
                toast.success("Cuenta desbloqueada correctamente");
                fetchUser();
            } else {
                toast.error("Error al desbloquear la cuenta");
            }
        } catch (error) {
            console.error("Error unlocking:", error);
            toast.error("Error de conexión");
        } finally {
            setProcessing(false);
        }
    };

    const handleResetPassword = async () => {
        if (!user) return;

        const ok = await confirm({
            title: "Resetear contraseña",
            message: `¿Enviar email de reset a ${user.email}?`,
            confirmLabel: "Enviar",
            variant: "default",
        });

        if (!ok) return;

        setProcessing(true);
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email }),
            });

            if (res.ok) {
                toast.success("Email de reset enviado");
            } else {
                toast.error("Error al enviar el email");
            }
        } catch (error) {
            console.error("Error resetting password:", error);
            toast.error("Error de conexión");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#e60012]" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Usuario no encontrado.</p>
                <Link href="/ops/usuarios" className="text-[#e60012] hover:underline inline-flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Volver al listado
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Link href="/ops/usuarios" className="inline-flex items-center text-gray-500 hover:text-gray-900 transition">
                <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Usuarios
            </Link>

            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex items-start gap-6">
                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center text-[#e60012] font-black text-3xl border-2 border-red-200 flex-shrink-0">
                            {(user.name || user.email).charAt(0).toUpperCase()}
                        </div>

                        {/* User Info */}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.name || "Sin nombre"}</h1>
                            <p className="text-gray-600 flex items-center gap-2 mb-1">
                                {user.email}
                            </p>
                            {user.phone && (
                                <p className="text-gray-600 flex items-center gap-2 mb-3">
                                    {user.phone}
                                </p>
                            )}

                            {/* Roles */}
                            <div className="flex flex-wrap gap-2 mt-3">
                                {user.roles.map((role) => (
                                    <div
                                        key={role.id}
                                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide ${getRoleBadgeColor(
                                            role.role
                                        )}`}
                                    >
                                        <span
                                            className={`w-2 h-2 rounded-full ${
                                                role.isActive ? "bg-green-500" : "bg-gray-400"
                                            }`}
                                        />
                                        {role.role}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                            <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">
                                Puntos MOOVER
                            </p>
                            <p className="text-2xl font-bold text-[#e60012] flex items-center gap-1">
                                <Gift className="w-5 h-5" /> {user.pointsBalance}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">
                                Total Pedidos
                            </p>
                            <p className="text-2xl font-bold text-blue-700">
                                {user.stats.totalOrders}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                            <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1">
                                Total Gastado
                            </p>
                            <p className="text-xl font-bold text-green-700">
                                {formatPrice(user.stats.totalSpent)}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">
                                Miembro desde
                            </p>
                            <p className="text-sm font-bold text-slate-700">
                                {new Date(user.stats.memberSince).toLocaleDateString("es-AR", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Account Status */}
                {user.deletedAt && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-red-800">Cuenta eliminada</p>
                            <p className="text-xs text-red-700">
                                {new Date(user.deletedAt).toLocaleDateString("es-AR")}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabs Navigation */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab("info")}
                        className={`flex-1 px-6 py-4 text-center font-semibold transition ${
                            activeTab === "info"
                                ? "text-[#e60012] border-b-2 border-[#e60012]"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        Información
                    </button>
                    <button
                        onClick={() => setActiveTab("actions")}
                        className={`flex-1 px-6 py-4 text-center font-semibold transition ${
                            activeTab === "actions"
                                ? "text-[#e60012] border-b-2 border-[#e60012]"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        Acciones
                    </button>
                    <button
                        onClick={() => setActiveTab("activity")}
                        className={`flex-1 px-6 py-4 text-center font-semibold transition ${
                            activeTab === "activity"
                                ? "text-[#e60012] border-b-2 border-[#e60012]"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        Actividad
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === "info" && (
            <div className="space-y-6">
            {/* Merchant Section */}
            {user.merchant && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <button
                        onClick={() => setExpandedMerchant(!expandedMerchant)}
                        className="w-full px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition border-b border-slate-100"
                    >
                        <div className="flex items-center gap-3">
                            <Building2 className="w-6 h-6 text-blue-600" />
                            <h2 className="text-lg font-bold text-gray-900">Comercio</h2>
                            <span className="text-xs font-bold text-gray-500">
                                ({user.merchant.name})
                            </span>
                        </div>
                        {expandedMerchant ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                    </button>

                    {expandedMerchant && (
                        <div className="p-8 space-y-6">
                            {/* Approval Status */}
                            {user.merchant.approvalStatus === "PENDING" && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Clock className="w-5 h-5 text-yellow-600" />
                                        <p className="font-bold text-yellow-900">
                                            Este comercio está pendiente de aprobación
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleApproveRole("merchant")}
                                            disabled={processing}
                                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
                                        >
                                            {processing ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <CheckCircle className="w-4 h-4" />
                                            )}
                                            Aprobar
                                        </button>
                                        <button
                                            onClick={() => handleRejectRole("merchant")}
                                            disabled={processing}
                                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
                                        >
                                            {processing ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <XCircle className="w-4 h-4" />
                                            )}
                                            Rechazar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Status Badge */}
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-gray-600">Estado de aprobación:</p>
                                <span
                                    className={`px-4 py-2 rounded-lg text-sm font-bold ${
                                        statusLabels[user.merchant.approvalStatus]?.color ||
                                        "bg-gray-100 text-gray-800"
                                    }`}
                                >
                                    {statusLabels[user.merchant.approvalStatus]?.label ||
                                        user.merchant.approvalStatus}
                                </span>
                            </div>

                            {/* Loyalty Tier */}
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-gray-600">Nivel de fidelización:</p>
                                <span
                                    className={`px-4 py-2 rounded-lg text-sm font-bold ${
                                        loyaltyTierColors[user.merchant.loyaltyTier] ||
                                        "bg-gray-100 text-gray-800"
                                    }`}
                                >
                                    {user.merchant.loyaltyTier}
                                </span>
                            </div>

                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                                        Categoría
                                    </p>
                                    <p className="font-medium text-gray-900">
                                        {user.merchant.category || "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                                        Comisión
                                    </p>
                                    <p className="font-medium text-gray-900">
                                        {user.merchant.commissionRate}%
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                                        Calificación
                                    </p>
                                    <p className="font-medium text-gray-900 flex items-center gap-1">
                                        {user.merchant.rating ? (
                                            <>
                                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                {user.merchant.rating.toFixed(1)}
                                            </>
                                        ) : (
                                            "Sin calificaciones"
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                                        Estado
                                    </p>
                                    <p className="font-medium text-gray-900">
                                        {user.merchant.isActive && user.merchant.isOpen
                                            ? "Activo y abierto"
                                            : user.merchant.isActive
                                                ? "Activo (cerrado)"
                                                : "Inactivo"}
                                    </p>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="border-t border-slate-200 pt-4">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-4">
                                    Información de contacto
                                </p>
                                <div className="space-y-3">
                                    {user.merchant.email && (
                                        <p className="text-sm text-gray-700">
                                            <span className="font-bold">Email:</span> {user.merchant.email}
                                        </p>
                                    )}
                                    {user.merchant.phone && (
                                        <p className="text-sm text-gray-700">
                                            <span className="font-bold">Teléfono:</span> {user.merchant.phone}
                                        </p>
                                    )}
                                    {user.merchant.address && (
                                        <p className="text-sm text-gray-700 flex items-start gap-2">
                                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            {user.merchant.address}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Operational Info */}
                            <div className="border-t border-slate-200 pt-4">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-4">
                                    Información operativa
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-600">Radio de entrega</p>
                                        <p className="font-bold text-gray-900">
                                            {user.merchant.deliveryRadiusKm} km
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600">Monto mínimo</p>
                                        <p className="font-bold text-gray-900">
                                            {formatPrice(user.merchant.minOrderAmount)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600">Retiro disponible</p>
                                        <p className="font-bold text-gray-900">
                                            {user.merchant.allowPickup ? "Sí" : "No"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600">Productos</p>
                                        <p className="font-bold text-gray-900">
                                            {user.merchant._count.products}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Documents */}
                            {(user.merchant.cuit ||
                                user.merchant.constanciaAfipUrl ||
                                user.merchant.habilitacionMunicipalUrl ||
                                user.merchant.registroSanitarioUrl) && (
                                <div className="border-t border-slate-200 pt-4">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-4">
                                        Documentos
                                    </p>
                                    <div className="space-y-2">
                                        {user.merchant.cuit && (
                                            <p className="text-sm text-gray-700">
                                                <span className="font-bold">CUIT:</span> {user.merchant.cuit}
                                            </p>
                                        )}
                                        {user.merchant.constanciaAfipUrl && (
                                            <p className="text-sm text-gray-700">
                                                <span className="font-bold">Constancia AFIP:</span>{" "}
                                                <a
                                                    href={user.merchant.constanciaAfipUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[#e60012] hover:underline inline-flex items-center gap-1"
                                                >
                                                    <Eye className="w-3 h-3" /> Ver documento
                                                </a>
                                            </p>
                                        )}
                                        {user.merchant.habilitacionMunicipalUrl && (
                                            <p className="text-sm text-gray-700">
                                                <span className="font-bold">Habilitación Municipal:</span>{" "}
                                                <a
                                                    href={user.merchant.habilitacionMunicipalUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[#e60012] hover:underline inline-flex items-center gap-1"
                                                >
                                                    <Eye className="w-3 h-3" /> Ver documento
                                                </a>
                                            </p>
                                        )}
                                        {user.merchant.registroSanitarioUrl && (
                                            <p className="text-sm text-gray-700">
                                                <span className="font-bold">Registro Sanitario:</span>{" "}
                                                <a
                                                    href={user.merchant.registroSanitarioUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[#e60012] hover:underline inline-flex items-center gap-1"
                                                >
                                                    <Eye className="w-3 h-3" /> Ver documento
                                                </a>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Stats */}
                            <div className="border-t border-slate-200 pt-4">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-4">
                                    Estadísticas
                                </p>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Pedidos total:</span>
                                    <span className="font-bold text-gray-900">
                                        {user.merchant._count.orders}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Driver Section */}
            {user.driver && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <button
                        onClick={() => setExpandedDriver(!expandedDriver)}
                        className="w-full px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition border-b border-slate-100"
                    >
                        <div className="flex items-center gap-3">
                            <Truck className="w-6 h-6 text-amber-600" />
                            <h2 className="text-lg font-bold text-gray-900">Repartidor</h2>
                        </div>
                        {expandedDriver ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                    </button>

                    {expandedDriver && (
                        <div className="p-8 space-y-6">
                            {/* Approval Status */}
                            {user.driver.approvalStatus === "PENDING" && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Clock className="w-5 h-5 text-yellow-600" />
                                        <p className="font-bold text-yellow-900">
                                            Este repartidor está pendiente de aprobación
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleApproveRole("driver")}
                                            disabled={processing}
                                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
                                        >
                                            {processing ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <CheckCircle className="w-4 h-4" />
                                            )}
                                            Aprobar
                                        </button>
                                        <button
                                            onClick={() => handleRejectRole("driver")}
                                            disabled={processing}
                                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
                                        >
                                            {processing ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <XCircle className="w-4 h-4" />
                                            )}
                                            Rechazar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Status */}
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-gray-600">Estado de aprobación:</p>
                                <span
                                    className={`px-4 py-2 rounded-lg text-sm font-bold ${
                                        statusLabels[user.driver.approvalStatus]?.color ||
                                        "bg-gray-100 text-gray-800"
                                    }`}
                                >
                                    {statusLabels[user.driver.approvalStatus]?.label ||
                                        user.driver.approvalStatus}
                                </span>
                            </div>

                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                                        Activo
                                    </p>
                                    <p className="font-medium text-gray-900">
                                        {user.driver.isActive ? "Sí" : "No"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                                        En línea
                                    </p>
                                    <p className="font-medium text-gray-900 flex items-center gap-1">
                                        <span
                                            className={`w-2 h-2 rounded-full ${
                                                user.driver.isOnline ? "bg-green-500" : "bg-gray-400"
                                            }`}
                                        />
                                        {user.driver.isOnline ? "Sí" : "No"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                                        Total entregas
                                    </p>
                                    <p className="font-medium text-gray-900">
                                        {user.driver.totalDeliveries}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                                        Calificación
                                    </p>
                                    <p className="font-medium text-gray-900 flex items-center gap-1">
                                        {user.driver.rating ? (
                                            <>
                                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                {user.driver.rating.toFixed(1)}
                                            </>
                                        ) : (
                                            "Sin calificaciones"
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Vehicle Info */}
                            <div className="border-t border-slate-200 pt-4">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-4">
                                    Información del vehículo
                                </p>
                                <div className="space-y-3">
                                    {user.driver.vehicleType && (
                                        <div className="flex items-center gap-2">
                                            <Car className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-600">Tipo</p>
                                                <p className="font-medium text-gray-900">
                                                    {user.driver.vehicleType}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {user.driver.vehicleBrand && (
                                        <p className="text-sm text-gray-700">
                                            <span className="font-bold">Marca:</span> {user.driver.vehicleBrand}
                                        </p>
                                    )}
                                    {user.driver.vehicleModel && (
                                        <p className="text-sm text-gray-700">
                                            <span className="font-bold">Modelo:</span> {user.driver.vehicleModel}
                                        </p>
                                    )}
                                    {user.driver.vehicleYear && (
                                        <p className="text-sm text-gray-700">
                                            <span className="font-bold">Año:</span> {user.driver.vehicleYear}
                                        </p>
                                    )}
                                    {user.driver.vehicleColor && (
                                        <p className="text-sm text-gray-700">
                                            <span className="font-bold">Color:</span> {user.driver.vehicleColor}
                                        </p>
                                    )}
                                    {user.driver.licensePlate && (
                                        <p className="text-sm text-gray-700 font-mono">
                                            <span className="font-bold">Patente:</span> {user.driver.licensePlate}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Documents */}
                            {(user.driver.dniFrenteUrl ||
                                user.driver.dniDorsoUrl ||
                                user.driver.licenciaUrl ||
                                user.driver.seguroUrl ||
                                user.driver.vtvUrl) && (
                                <div className="border-t border-slate-200 pt-4">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-4">
                                        Documentos
                                    </p>
                                    <div className="space-y-2">
                                        {user.driver.dniFrenteUrl && (
                                            <p className="text-sm text-gray-700">
                                                <a
                                                    href={user.driver.dniFrenteUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[#e60012] hover:underline inline-flex items-center gap-1"
                                                >
                                                    <FileText className="w-4 h-4" /> DNI Frente
                                                </a>
                                            </p>
                                        )}
                                        {user.driver.dniDorsoUrl && (
                                            <p className="text-sm text-gray-700">
                                                <a
                                                    href={user.driver.dniDorsoUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[#e60012] hover:underline inline-flex items-center gap-1"
                                                >
                                                    <FileText className="w-4 h-4" /> DNI Dorso
                                                </a>
                                            </p>
                                        )}
                                        {user.driver.licenciaUrl && (
                                            <p className="text-sm text-gray-700">
                                                <a
                                                    href={user.driver.licenciaUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[#e60012] hover:underline inline-flex items-center gap-1"
                                                >
                                                    <FileText className="w-4 h-4" /> Licencia de conducir
                                                </a>
                                            </p>
                                        )}
                                        {user.driver.seguroUrl && (
                                            <p className="text-sm text-gray-700">
                                                <a
                                                    href={user.driver.seguroUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[#e60012] hover:underline inline-flex items-center gap-1"
                                                >
                                                    <FileText className="w-4 h-4" /> Seguro
                                                </a>
                                            </p>
                                        )}
                                        {user.driver.vtvUrl && (
                                            <p className="text-sm text-gray-700">
                                                <a
                                                    href={user.driver.vtvUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[#e60012] hover:underline inline-flex items-center gap-1"
                                                >
                                                    <FileText className="w-4 h-4" /> VTV
                                                </a>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Seller Section */}
            {user.seller && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <button
                        onClick={() => setExpandedSeller(!expandedSeller)}
                        className="w-full px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition border-b border-slate-100"
                    >
                        <div className="flex items-center gap-3">
                            <ShoppingBag className="w-6 h-6 text-purple-600" />
                            <h2 className="text-lg font-bold text-gray-900">Vendedor</h2>
                            {user.seller.displayName && (
                                <span className="text-xs font-bold text-gray-500">
                                    ({user.seller.displayName})
                                </span>
                            )}
                        </div>
                        {expandedSeller ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                    </button>

                    {expandedSeller && (
                        <div className="p-8 space-y-6">
                            {/* Status */}
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-gray-600">Estado:</p>
                                <div className="flex items-center gap-3">
                                    <span
                                        className={`px-4 py-2 rounded-lg text-sm font-bold ${
                                            user.seller.isActive
                                                ? "bg-green-100 text-green-800"
                                                : "bg-gray-100 text-gray-800"
                                        }`}
                                    >
                                        {user.seller.isActive ? "Activo" : "Inactivo"}
                                    </span>
                                    {user.seller.isVerified && (
                                        <span className="px-4 py-2 rounded-lg text-sm font-bold bg-blue-100 text-blue-800">
                                            <Shield className="w-4 h-4 inline mr-1" /> Verificado
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                                        Nombre de tienda
                                    </p>
                                    <p className="font-medium text-gray-900">
                                        {user.seller.displayName || "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                                        Comisión
                                    </p>
                                    <p className="font-medium text-gray-900">
                                        {user.seller.commissionRate}%
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                                        Total ventas
                                    </p>
                                    <p className="font-medium text-gray-900">
                                        {user.seller.totalSales}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                                        Publicaciones
                                    </p>
                                    <p className="font-medium text-gray-900">
                                        {user.seller._count.listings}
                                    </p>
                                </div>
                            </div>

                            {/* Rating */}
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-gray-600">Calificación:</p>
                                <p className="font-medium text-gray-900 flex items-center gap-1">
                                    {user.seller.rating ? (
                                        <>
                                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                            {user.seller.rating.toFixed(1)}
                                        </>
                                    ) : (
                                        "Sin calificaciones"
                                    )}
                                </p>
                            </div>

                            {/* Bio */}
                            {user.seller.bio && (
                                <div className="border-t border-slate-200 pt-4">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">
                                        Descripción
                                    </p>
                                    <p className="text-sm text-gray-700 italic">{user.seller.bio}</p>
                                </div>
                            )}

                            {/* Schedule */}
                            <div className="border-t border-slate-200 pt-4">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">
                                    Tiempo de preparación
                                </p>
                                <p className="text-sm font-medium text-gray-900">
                                    {user.seller.preparationMinutes} minutos
                                </p>
                            </div>

                            {/* Availability */}
                            <div className="border-t border-slate-200 pt-4">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-3">
                                    Disponibilidad
                                </p>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">En línea:</span>
                                        <span className="font-medium text-gray-900 flex items-center gap-1">
                                            <span
                                                className={`w-2 h-2 rounded-full ${
                                                    user.seller.isOnline ? "bg-green-500" : "bg-gray-400"
                                                }`}
                                            />
                                            {user.seller.isOnline ? "Sí" : "No"}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Pausado:</span>
                                        <span className="font-medium text-gray-900">
                                            {user.seller.isPaused ? "Sí" : "No"}
                                        </span>
                                    </div>
                                    {user.seller.isPaused && user.seller.pauseEndsAt && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Pausa hasta:</span>
                                            <span className="font-medium text-gray-900">
                                                {new Date(user.seller.pauseEndsAt).toLocaleDateString("es-AR")}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Addresses Section */}
            {user.addresses.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <MapPin className="w-6 h-6 text-teal-600" /> Direcciones guardadas
                    </h2>
                    <div className="grid gap-4">
                        {user.addresses.map((address) => (
                            <div
                                key={address.id}
                                className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-bold text-gray-900 flex items-center gap-2">
                                            {address.label}
                                            {address.isDefault && (
                                                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                    PREDETERMINADA
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {address.street} {address.number}
                                            {address.apartment && ` Apt. ${address.apartment}`}
                                        </p>
                                        {address.neighborhood && (
                                            <p className="text-sm text-gray-600">
                                                {address.neighborhood}, {address.city}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Orders Section */}
            {user.recentOrders.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <ShoppingBag className="w-6 h-6 text-orange-600" /> Últimos pedidos
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left text-xs font-bold text-gray-600 uppercase tracking-wide pb-3">
                                        Pedido
                                    </th>
                                    <th className="text-left text-xs font-bold text-gray-600 uppercase tracking-wide pb-3">
                                        Comercio
                                    </th>
                                    <th className="text-left text-xs font-bold text-gray-600 uppercase tracking-wide pb-3">
                                        Estado
                                    </th>
                                    <th className="text-right text-xs font-bold text-gray-600 uppercase tracking-wide pb-3">
                                        Total
                                    </th>
                                    <th className="text-left text-xs font-bold text-gray-600 uppercase tracking-wide pb-3">
                                        Fecha
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {user.recentOrders.map((order) => {
                                    const st =
                                        orderStatusLabels[order.status] || {
                                            label: order.status,
                                            color: "bg-slate-100 text-slate-600",
                                        };
                                    return (
                                        <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="py-3">
                                                <Link
                                                    href={`/ops/pedidos/${order.id}`}
                                                    className="font-bold text-[#e60012] hover:underline"
                                                >
                                                    #{order.orderNumber}
                                                </Link>
                                            </td>
                                            <td className="py-3 text-sm text-gray-600">
                                                {order.merchant?.name || "—"}
                                            </td>
                                            <td className="py-3">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${st.color}`}>
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td className="py-3 text-right font-bold text-gray-900">
                                                {formatPrice(order.total)}
                                            </td>
                                            <td className="py-3 text-sm text-gray-600">
                                                {new Date(order.createdAt).toLocaleDateString("es-AR")}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Points Transactions Section */}
            {user.pointsTransactions.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Gift className="w-6 h-6 text-red-600" /> Historial de puntos
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left text-xs font-bold text-gray-600 uppercase tracking-wide pb-3">
                                        Tipo
                                    </th>
                                    <th className="text-left text-xs font-bold text-gray-600 uppercase tracking-wide pb-3">
                                        Descripción
                                    </th>
                                    <th className="text-right text-xs font-bold text-gray-600 uppercase tracking-wide pb-3">
                                        Puntos
                                    </th>
                                    <th className="text-right text-xs font-bold text-gray-600 uppercase tracking-wide pb-3">
                                        Balance
                                    </th>
                                    <th className="text-left text-xs font-bold text-gray-600 uppercase tracking-wide pb-3">
                                        Fecha
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {user.pointsTransactions.map((tx) => (
                                    <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="py-3">
                                            <span
                                                className={`text-xs font-bold uppercase ${
                                                    tx.amount > 0
                                                        ? "text-green-700"
                                                        : "text-red-700"
                                                }`}
                                            >
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td className="py-3 text-sm text-gray-600">{tx.description}</td>
                                        <td className="py-3 text-right font-bold">
                                            <span
                                                className={
                                                    tx.amount > 0
                                                        ? "text-green-700"
                                                        : "text-red-700"
                                                }
                                            >
                                                {tx.amount > 0 ? "+" : ""}{tx.amount}
                                            </span>
                                        </td>
                                        <td className="py-3 text-right font-bold text-gray-900">
                                            {tx.balanceAfter}
                                        </td>
                                        <td className="py-3 text-sm text-gray-600">
                                            {new Date(tx.createdAt).toLocaleDateString("es-AR")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            </div>
            )}

            {activeTab === "actions" && (
            <div className="space-y-6">
                <UserAdminActions
                    userId={user.id}
                    userName={user.name || user.email}
                    isSuspended={user.isSuspended}
                    suspendedUntil={user.suspendedUntil}
                    suspensionReason={user.suspensionReason}
                    archivedAt={user.archivedAt}
                    merchant={user.merchant ? {
                        id: user.merchant.id,
                        commissionOverride: user.merchant.commissionOverride,
                        commissionOverrideReason: user.merchant.commissionOverrideReason,
                        loyaltyTier: user.merchant.loyaltyTier,
                        loyaltyTierLocked: user.merchant.loyaltyTierLocked,
                    } : undefined}
                    onRefresh={fetchUser}
                />

                {/* Legacy Actions Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Acciones Adicionales</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={handleUnlockAccount}
                            disabled={processing}
                            className="flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded-lg transition"
                        >
                            {processing ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Unlock className="w-5 h-5" />
                            )}
                            Desbloquear cuenta
                        </button>
                        <button
                            onClick={handleResetPassword}
                            disabled={processing}
                            className="flex items-center justify-center gap-3 px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white font-bold rounded-lg transition"
                        >
                            {processing ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Lock className="w-5 h-5" />
                            )}
                            Resetear contraseña
                        </button>
                    </div>
                </div>
            </div>
            )}

            {activeTab === "activity" && (
            <div className="space-y-6">
                <UserActivityLog userId={user.id} />
            </div>
            )}
        </div>
    );
}
