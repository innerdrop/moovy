"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
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
    Clock,
    ShoppingBag,
    ExternalLink,
    LayoutDashboard,
    Truck,
    UserPlus,
    Trash2,
    AlertTriangle,
} from "lucide-react";
import { useUserPoints } from "@/hooks/useUserPoints";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function ProfilePage() {
    const { data: session, update: updateSession } = useSession();
    const router = useRouter();
    const { points, level, nextLevelPoints } = useUserPoints();
    const { isSupported: pushSupported, isSubscribed: pushSubscribed, permission: pushPermission, requestPermission: requestPush, loading: pushLoading } = usePushNotifications();
    const [showRedemptions, setShowRedemptions] = useState(false);
    const [redemptions, setRedemptions] = useState<any[]>([]);
    const [loadingRedemptions, setLoadingRedemptions] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");

    const firstName = session?.user?.name?.split(" ")[0] || "Usuario";

    // Role activation state
    const [sellerStatus, setSellerStatus] = useState<string | null>(null);
    const [driverStatus, setDriverStatus] = useState<string | null>(null);
    const [merchantStatus, setMerchantStatus] = useState<string | null>(null);
    const [activatingRole, setActivatingRole] = useState<string | null>(null);
    const [showDriverConfirm, setShowDriverConfirm] = useState(false);

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

    // Check driver & seller status once on mount — NO updateSession() here to avoid remount loops
    const mountChecked = useRef(false);

    useEffect(() => {
        if (!session?.user || mountChecked.current) return;
        mountChecked.current = true;

        // Check driver status via API (independent of JWT)
        fetch("/api/driver/profile")
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (!data) return;
                if (data.approvalStatus === "APPROVED" || data.isActive) {
                    setDriverStatus("ACTIVE");
                } else {
                    setDriverStatus("PENDING_VERIFICATION");
                }
            })
            .catch(() => { /* no driver profile yet */ });

        // Check seller status via API (independent of JWT)
        // FIX 2026-04-15: evitar llamada al endpoint cuando el JWT ya tiene SELLER.
        // Esto tambi\u00e9n resuelve un 404 ruidoso en la console cuando el user tiene
        // SELLER en roles[] (porque en este path no hace falta verificar status via API).
        // La condici\u00f3n original `if (!hasSeller)` dispara en el primer render antes
        // de que la sesi\u00f3n termine de cargar, generando el 404 visible en consola.
        const sessionReady = !!session?.user?.email;
        if (sessionReady && !hasSeller) {
            fetch("/api/seller/profile")
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data?.isActive) {
                        setSellerStatus("ACTIVE");
                        // Don't call updateSession here — it causes render loops.
                        // The JWT auto-heal on next signIn will pick up the SELLER role.
                    }
                })
                .catch(() => { /* no seller profile yet */ });
        } else if (hasSeller) {
            // El JWT ya confirma que es SELLER — marcamos activo sin pegarle al endpoint
            setSellerStatus("ACTIVE");
        }

        // Check merchant status via API (independent of JWT)
        if (!hasMerchant) {
            fetch("/api/auth/merchant-status")
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (!data?.exists) return;
                    if (data.approvalStatus === "APPROVED") {
                        setMerchantStatus("ACTIVE");
                        // Don't call updateSession here — it causes render loops.
                    } else {
                        setMerchantStatus("PENDING_VERIFICATION");
                    }
                })
                .catch(() => { /* no merchant yet */ });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [!!session?.user]);

    // On tab focus: re-check driver status (e.g. after OPS approval)
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState !== "visible") return;
            fetch("/api/driver/profile")
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (!data) return;
                    if (data.approvalStatus === "APPROVED" || data.isActive) {
                        setDriverStatus("ACTIVE");
                    } else {
                        setDriverStatus("PENDING_VERIFICATION");
                    }
                })
                .catch(() => { /* ignore */ });
        };
        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, []);

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

    const handleActivateDriver = () => {
        setShowDriverConfirm(true);
    };

    const handleConfirmDriver = () => {
        setShowDriverConfirm(false);
        router.push("/repartidor/registro?from=profile");
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== "ELIMINAR") return;
        setDeleteLoading(true);
        try {
            const res = await fetch("/api/profile/delete", { method: "POST" });
            if (res.ok) {
                toast.success("Tu cuenta ha sido eliminada");
                signOut({ callbackUrl: "/" });
            } else {
                const data = await res.json();
                toast.error(data.error || "Error al eliminar la cuenta");
            }
        } catch {
            toast.error("Error de conexión");
        } finally {
            setDeleteLoading(false);
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
            <div className="bg-white border-b border-gray-100 pt-8 pb-6 px-4 lg:pt-12 lg:pb-8">
                <div className="max-w-md mx-auto lg:max-w-7xl lg:flex lg:items-start lg:gap-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-[#e60012] flex items-center justify-center text-white text-2xl font-bold shadow-md">
                            {session?.user?.name?.charAt(0).toUpperCase() || <User />}
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">{session?.user?.name}</h1>
                            <p className="text-gray-500 text-sm">{session?.user?.email}</p>
                            <div className="flex items-center gap-1 mt-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                Miembro Activo
                            </div>
                        </div>
                    </div>

                    {/* MOOVER card removed — info available via MOOVER star button in BottomNav */}
                </div>
            </div>

            <div className="max-w-md mx-auto lg:max-w-7xl px-4 mt-6 lg:mt-0 space-y-6 lg:flex lg:gap-8 lg:flex-1">
                {/* Desktop Sidebar Navigation */}
                <nav className="hidden lg:flex lg:flex-col lg:w-64 lg:flex-shrink-0 lg:space-y-4">
                </nav>

                {/* Content wrapper for flex layout */}
                <div className="lg:flex-1 space-y-6">
                {/* 1. My Account Section */}
                <section>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">Mi Cuenta</h3>
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
                        <Link href="/mi-perfil/privacidad" className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                    <Shield className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-700 block">Privacidad y Datos</span>
                                    <span className="text-[10px] text-gray-400">Exportar, revocar consentimientos (Ley 25.326)</span>
                                </div>
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
                {(hasSeller || sellerStatus === "ACTIVE" || driverStatus === "ACTIVE" || hasMerchant || merchantStatus === "ACTIVE" || hasAdmin) && (
                    <section>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">Mis Portales</h3>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {(hasSeller || sellerStatus === "ACTIVE") && (
                                <button
                                    onClick={async () => {
                                        if (!hasSeller) {
                                            await updateSession({ refreshRoles: true });
                                            // Directo al dashboard para evitar el parpadeo del redirect
                                            // intermedio en /vendedor/page.tsx. Ver fix/portal-switcher-direct-links.
                                            window.location.href = "/vendedor/dashboard";
                                        } else {
                                            router.push("/vendedor/dashboard");
                                        }
                                    }}
                                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-50 group w-full text-left"
                                >
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
                                </button>
                            )}
                            {(hasDriver || driverStatus === "ACTIVE") && (
                                <button
                                    onClick={async () => {
                                        // FIX 2026-04-15: proxy.ts ya no gatea por JWT roles[] para /repartidor/*
                                        // (el layout protegido usa computeUserAccess como source of truth).
                                        // Por eso ahora es seguro usar router.push() cuando el JWT ya tiene DRIVER
                                        // (navegaci\u00f3n client-side instant\u00e1nea sin flicker). Si el JWT no tiene
                                        // DRIVER a\u00fan, refrescamos y hacemos full reload para garantizar la cookie.
                                        if (!hasDriver) {
                                            await updateSession({ refreshRoles: true });
                                            window.location.href = "/repartidor/dashboard";
                                        } else {
                                            router.push("/repartidor/dashboard");
                                        }
                                    }}
                                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-50 group w-full text-left"
                                >
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
                                </button>
                            )}
                            {(hasMerchant || merchantStatus === "ACTIVE") && (
                                <button
                                    onClick={async () => {
                                        if (!hasMerchant) {
                                            await updateSession({ refreshRoles: true });
                                            window.location.href = "/comercios";
                                        } else {
                                            router.push("/comercios");
                                        }
                                    }}
                                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-50 group w-full text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                                            <Store className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-900 block">Panel de Comercio</span>
                                            <span className="text-[10px] text-gray-400">Productos, pedidos y configuración</span>
                                        </div>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-gray-300" />
                                </button>
                            )}
                            {hasAdmin && (
                                // Directo al dashboard para evitar el parpadeo del redirect
                                // intermedio en /ops/page.tsx.
                                <Link href="/ops/dashboard" className="flex items-center justify-between p-4 hover:bg-gray-50 transition group">
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
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">Oportunidades MOOVY</h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Comercio — register or show pending status */}
                        {!hasMerchant && merchantStatus !== "ACTIVE" && (
                            <div>
                                <Link
                                    href="/comercio/registro?from=profile"
                                    className={`flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-50 group ${merchantStatus === "PENDING_VERIFICATION" ? "pointer-events-none opacity-70" : ""}`}
                                    aria-disabled={merchantStatus === "PENDING_VERIFICATION"}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                                            <Store className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-900 block">Registrar mi Comercio</span>
                                            <span className="text-[10px] text-gray-400">Vendé tus productos en Moovy</span>
                                        </div>
                                    </div>
                                    {merchantStatus === "PENDING_VERIFICATION" ? (
                                        <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full font-medium">Pendiente</span>
                                    ) : (
                                        <ChevronRight className="w-4 h-4 text-gray-300" />
                                    )}
                                </Link>
                                {/* Cancel pending merchant request */}
                                {merchantStatus === "PENDING_VERIFICATION" && (
                                    <button
                                        onClick={async () => {
                                            if (!confirm("¿Estás seguro de que querés cancelar tu solicitud de comercio?")) return;
                                            try {
                                                const res = await fetch("/api/auth/cancel-merchant", { method: "POST" });
                                                if (res.ok) {
                                                    setMerchantStatus(null);
                                                } else {
                                                    const data = await res.json();
                                                    alert(data.error || "Error al cancelar");
                                                }
                                            } catch {
                                                alert("Error de conexión");
                                            }
                                        }}
                                        className="flex items-center justify-center gap-2 w-full p-3 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 transition border-b border-gray-50"
                                    >
                                        <X className="w-3 h-3" />
                                        Cancelar solicitud de comercio
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Seller - link al onboarding (solo si no tiene el rol) */}
                        {!hasSeller && sellerStatus !== "ACTIVE" && (
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
                                        <span className="text-[10px] text-gray-400">Manejás tus tiempos, cobrás por cada viaje</span>
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

                        {/* Cancel pending driver request */}
                        {driverStatus === "PENDING_VERIFICATION" && (
                            <button
                                onClick={async () => {
                                    if (!confirm("¿Estás seguro de que querés cancelar tu solicitud de repartidor?")) return;
                                    try {
                                        const res = await fetch("/api/auth/cancel-driver", { method: "POST" });
                                        if (res.ok) {
                                            setDriverStatus(null);
                                        } else {
                                            const data = await res.json();
                                            alert(data.error || "Error al cancelar");
                                        }
                                    } catch {
                                        alert("Error de conexión");
                                    }
                                }}
                                className="flex items-center justify-center gap-2 w-full p-3 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 transition border-t border-gray-100"
                            >
                                <X className="w-3 h-3" />
                                Cancelar solicitud de repartidor
                            </button>
                        )}
                    </div>
                </section>

                {/* 3. Settings & Support */}
                <section>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">Configuración y Ayuda</h3>
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

                {/* Delete Account Button */}
                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full text-gray-400 font-medium text-xs py-3 flex items-center justify-center gap-2 hover:text-red-500 transition"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar mi cuenta
                </button>

                <div className="pb-4" />
                </div>
            </div>

            {/* Driver Confirmation Modal */}
            {showDriverConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                <Car className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Quiero ser Repartidor</h3>
                                <p className="text-sm text-gray-500">Manejás tus tiempos, cobrás por cada viaje</p>
                            </div>
                        </div>

                        <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-4 space-y-2">
                            <p className="text-sm text-green-800 leading-relaxed">
                                Para ser repartidor en MOOVY necesitás completar tus datos: tipo de vehículo, documentación (DNI, CUIT) y aceptar los términos.
                            </p>
                            <p className="text-sm text-green-800 leading-relaxed">
                                Una vez enviada tu solicitud, nuestro equipo la revisará y te notificará cuando esté aprobada.
                            </p>
                        </div>

                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-4">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <span>Tiempo estimado: 3-5 minutos</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDriverConfirm(false)}
                                className="flex-1 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-sm font-medium"
                            >
                                Ahora no
                            </button>
                            <button
                                onClick={handleConfirmDriver}
                                className="flex-1 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition text-sm font-bold flex items-center justify-center gap-2"
                            >
                                <Car className="w-4 h-4" />
                                Completar datos
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Account Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Eliminar cuenta</h3>
                                <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
                            </div>
                        </div>

                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
                            <p className="text-sm text-red-800 leading-relaxed">
                                Al eliminar tu cuenta se borrarán permanentemente tus datos personales, historial de pedidos, puntos MOOVER y favoritos. Los pedidos activos en curso no serán afectados.
                            </p>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">
                            Escribí <strong className="text-red-600">ELIMINAR</strong> para confirmar:
                        </p>
                        <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="ELIMINAR"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm mb-4"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                                className="flex-1 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-sm font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmText !== "ELIMINAR" || deleteLoading}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {deleteLoading ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                Eliminar definitivamente
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
