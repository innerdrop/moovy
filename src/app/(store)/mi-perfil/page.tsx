"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "@/store/toast";
import {
    User,
    MapPin,
    Heart,
    Settings,
    Bell,
    Shield,
    Lock,
    LogOut,
    ChevronRight,
    Store,
    Car,
    HelpCircle,
    FileText,
    Star,
    Award,
    Gift,
    X,
    Calendar,
    ShoppingBag,
    ExternalLink,
    LayoutDashboard,
    Truck,
    UserPlus,
} from "lucide-react";
import { useUserPoints } from "@/hooks/useUserPoints";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function ProfilePage() {
    const { data: session } = useSession();
    const { points, level, nextLevelPoints } = useUserPoints();
    const { isSupported: pushSupported, isSubscribed: pushSubscribed, permission: pushPermission, requestPermission: requestPush, loading: pushLoading } = usePushNotifications();
    const [showRedemptions, setShowRedemptions] = useState(false);
    const [redemptions, setRedemptions] = useState<any[]>([]);
    const [loadingRedemptions, setLoadingRedemptions] = useState(false);

    const firstName = session?.user?.name?.split(" ")[0] || "Usuario";

    // Role activation state
    const [sellerStatus, setSellerStatus] = useState<string | null>(null);
    const [driverStatus, setDriverStatus] = useState<string | null>(null);
    const [activatingRole, setActivatingRole] = useState<string | null>(null);

    // Derive all user roles from session (roles[] array preferred, fallback to legacy role)
    const userRoles: string[] = (() => {
        if (!session?.user) return [];
        const u = session.user as any;
        if (Array.isArray(u.roles) && u.roles.length > 0) return u.roles;
        return u.role ? [u.role] : [];
    })();

    const hasSeller = userRoles.includes("SELLER");
    const hasDriver = userRoles.includes("DRIVER");
    const hasMerchant = userRoles.includes("MERCHANT") || userRoles.includes("COMERCIO");
    const hasAdmin = userRoles.includes("ADMIN");

    // Fetch user roles on mount
    useEffect(() => {
        if (session?.user) {
            if (hasSeller) setSellerStatus("ACTIVE");
            // Check driver status
            if (hasDriver) {
                fetch("/api/driver/profile")
                    .then(res => {
                        if (res.ok) return res.json();
                        return null;
                    })
                    .then(data => {
                        if (data) {
                            setDriverStatus(data.isActive ? "ACTIVE" : "PENDING_VERIFICATION");
                        }
                    })
                    .catch(() => { });
            } else {
                // Also check for users who applied but aren't in roles[] yet
                fetch("/api/driver/profile")
                    .then(res => {
                        if (res.ok) return res.json();
                        return null;
                    })
                    .then(data => {
                        if (data) {
                            setDriverStatus(data.isActive ? "ACTIVE" : "PENDING_VERIFICATION");
                        }
                    })
                    .catch(() => { });
            }
        }
    }, [session, hasSeller, hasDriver]);

    const handleActivateSeller = async () => {
        setActivatingRole("seller");
        try {
            const res = await fetch("/api/auth/activate-seller", { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                setSellerStatus("ACTIVE");
            } else {
                if (res.status === 409) setSellerStatus("ACTIVE");
                toast.error(data.error || "Error al activar vendedor");
            }
        } catch {
            toast.error("Error de conexión");
        } finally {
            setActivatingRole(null);
        }
    };

    const handleActivateDriver = async () => {
        setActivatingRole("driver");
        try {
            const res = await fetch("/api/auth/activate-driver", { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                setDriverStatus("PENDING_VERIFICATION");
            } else {
                if (data.status) setDriverStatus(data.status);
                toast.error(data.error || "Error al solicitar repartidor");
            }
        } catch {
            toast.error("Error de conexión");
        } finally {
            setActivatingRole(null);
        }
    };

    // Calculate progress to next level
    const progress = Math.min(100, (points / nextLevelPoints) * 100);

    // Fetch redemptions when popup opens
    useEffect(() => {
        if (showRedemptions) {
            setLoadingRedemptions(true);
            fetch("/api/user/redemptions")
                .then(res => res.json())
                .then(data => {
                    setRedemptions(data.redemptions || []);
                })
                .catch(() => setRedemptions([]))
                .finally(() => setLoadingRedemptions(false));
        }
    }, [showRedemptions]);

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header / Profile Summary */}
            <div className="bg-white border-b border-gray-100 pt-8 pb-6 px-4">
                <div className="max-w-md mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#e60012] to-red-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                            {session?.user?.name?.charAt(0).toUpperCase() || <User />}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{session?.user?.name}</h1>
                            <p className="text-gray-500 text-sm">{session?.user?.email}</p>
                            <div className="flex items-center gap-1 mt-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                Miembro Activo
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Card */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-amber-700 font-medium mb-1 flex items-center gap-1">
                                <Award className="w-3 h-3" /> Nivel {level.name}
                            </p>
                            <p className="text-2xl font-bold text-gray-900">{points.toLocaleString()}</p>
                            <p className="text-[10px] text-gray-400">Puntos MOOVER</p>
                        </div>
                        <div className="w-24">
                            {/* Popup trigger for redemptions */}
                            <button
                                onClick={() => setShowRedemptions(true)}
                                className="text-xs bg-white text-amber-600 px-3 py-1.5 rounded-full shadow-sm font-semibold border border-amber-100 block text-center w-full hover:bg-amber-50 transition-colors"
                            >
                                Ver canjes
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 mt-6 space-y-6">

                {/* 1. My Account Section */}
                <section>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Mi Cuenta</h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <Link href="/mi-perfil/datos" className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                    <User className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">Datos Personales</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                        </Link>
                        <Link href="/mi-perfil/direcciones" className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">Mis Direcciones</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                        </Link>
                        <Link href="/mi-perfil/cambiar-password" className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">Cambiar Contraseña</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                        </Link>
                        <Link href="/mi-perfil/favoritos" className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-600">
                                    <Heart className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">Favoritos</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                        </Link>
                        <Link href="/mi-perfil/invitar" className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                    <UserPlus className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-700 block">Invitá Amigos</span>
                                    <span className="text-[10px] text-gray-400">Ganá puntos por cada amigo</span>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                        </Link>
                    </div>
                </section>

                {/* 2. My Portals — links to active role dashboards */}
                {(hasSeller || driverStatus === "ACTIVE" || hasMerchant || hasAdmin) && (
                    <section>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Mis Portales</h3>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {hasSeller && (
                                <Link href="/vendedor" className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-50 group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                                            <ShoppingBag className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-900 block">Panel de Vendedor</span>
                                            <span className="text-[10px] text-gray-400">Listings, ventas y ganancias</span>
                                        </div>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-gray-300" />
                                </Link>
                            )}
                            {driverStatus === "ACTIVE" && (
                                <Link href="/repartidor/dashboard" className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-50 group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                                            <Truck className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-900 block">Panel de Repartidor</span>
                                            <span className="text-[10px] text-gray-400">Pedidos disponibles y entregas</span>
                                        </div>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-gray-300" />
                                </Link>
                            )}
                            {hasMerchant && (
                                <Link href="/comercios" className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-50 group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                            <Store className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-900 block">Panel de Comercio</span>
                                            <span className="text-[10px] text-gray-400">Productos, pedidos y configuración</span>
                                        </div>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-gray-300" />
                                </Link>
                            )}
                            {hasAdmin && (
                                <Link href="/ops" className="flex items-center justify-between p-4 hover:bg-gray-50 transition group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                                            <LayoutDashboard className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-900 block">Panel de Operaciones</span>
                                            <span className="text-[10px] text-gray-400">Administración y logística</span>
                                        </div>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-gray-300" />
                                </Link>
                            )}
                        </div>
                    </section>
                )}

                {/* 3. Opportunities Section — activate roles you don't have yet */}
                <section>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Oportunidades MOOVY</h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Comercio - se mantiene como link (onboarding separado) */}
                        {!hasMerchant && (
                            <Link href="/comercio/registro?from=profile" className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-50 group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                        <Store className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-900 block">Registrar mi Comercio</span>
                                        <span className="text-[10px] text-gray-400">Vendé tus productos en Moovy</span>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                            </Link>
                        )}

                        {/* Seller - link al onboarding (solo si no tiene el rol) */}
                        {!hasSeller && (
                            <Link
                                href="/vendedor/registro?from=profile"
                                className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-50 group w-full text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                                        <ShoppingBag className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-900 block">Quiero vender</span>
                                        <span className="text-[10px] text-gray-400">Vendé objetos, productos caseros o servicios</span>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                            </Link>
                        )}

                        {/* Driver - botón de activación (solo si no tiene el rol activo) */}
                        {driverStatus !== "ACTIVE" && (
                            <button
                                onClick={handleActivateDriver}
                                disabled={driverStatus === "PENDING_VERIFICATION" || activatingRole !== null}
                                className="flex items-center justify-between p-4 hover:bg-gray-50 transition group w-full text-left disabled:opacity-70"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                                        <Car className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-900 block">Quiero ser Repartidor</span>
                                        <span className="text-[10px] text-gray-400">Generá ingresos con tu vehículo</span>
                                    </div>
                                </div>
                                {activatingRole === "driver" ? (
                                    <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                                ) : driverStatus === "PENDING_VERIFICATION" ? (
                                    <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full font-medium">Pendiente</span>
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-300" />
                                )}
                            </button>
                        )}
                    </div>
                </section>

                {/* 3. Settings & Support */}
                <section>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Configuración y Ayuda</h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {pushSupported && (
                            <div className="flex items-center justify-between p-4 border-b border-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                        <Bell className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">Notificaciones Push</span>
                                </div>
                                {pushSubscribed ? (
                                    <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">Activo</span>
                                ) : pushPermission === "denied" ? (
                                    <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Bloqueado</span>
                                ) : (
                                    <button
                                        onClick={() => requestPush()}
                                        disabled={pushLoading}
                                        className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition disabled:opacity-50"
                                    >
                                        {pushLoading ? "..." : "Activar"}
                                    </button>
                                )}
                            </div>
                        )}
                        <Link href="/ayuda" className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                                    <HelpCircle className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">Centro de Ayuda</span>
                            </div>
                        </Link>
                        <Link href="/terminos" className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">Términos y Condiciones</span>
                            </div>
                        </Link>
                        <Link href="/privacidad" className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                                    <Shield className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">Política de Privacidad</span>
                            </div>
                        </Link>
                        <Link href="/cookies" className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">Política de Cookies</span>
                            </div>
                        </Link>
                        <Link href="/devoluciones" className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">Devoluciones y Reembolsos</span>
                            </div>
                        </Link>
                    </div>
                </section>

                {/* Logout Button */}
                <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full bg-white border border-red-100 text-red-600 font-medium py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 hover:bg-red-50 transition"
                >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                </button>

                <p className="text-center text-[10px] text-gray-400 pb-4">
                    Versión 1.0.0 • Hecho con ❤️ en Ushuaia
                </p>
            </div>

            {/* Redemptions Modal */}
            {showRedemptions && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Gift className="w-5 h-5 text-amber-500" />
                                Mis Canjes
                            </h3>
                            <button
                                onClick={() => setShowRedemptions(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
                            {loadingRedemptions ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : redemptions.length === 0 ? (
                                <div className="text-center py-8">
                                    <Gift className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">Aún no tenés canjes</p>
                                    <p className="text-gray-400 text-sm mt-1">Usá tus puntos MOOVER para obtener descuentos</p>
                                    <Link
                                        href="/tienda"
                                        onClick={() => setShowRedemptions(false)}
                                        className="mt-4 text-amber-600 font-semibold text-sm inline-block"
                                    >
                                        Ir a la tienda
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {redemptions.map((r: any) => (
                                        <div key={r.id} className="bg-gray-50 rounded-xl p-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{r.rewardName || 'Canje de puntos'}</p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(r.createdAt).toLocaleDateString('es-AR', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                                <span className="text-red-500 font-bold text-sm">
                                                    -{r.pointsUsed} pts
                                                </span>
                                            </div>
                                            {r.code && (
                                                <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                                                    <p className="text-xs text-amber-700">Código:</p>
                                                    <p className="font-mono font-bold text-amber-800">{r.code}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
