"use client";

// Points Page - Mis Puntos / MOOVER Dashboard
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { formatPrice } from "@/lib/delivery";
import {
    Gift,
    TrendingUp,
    TrendingDown,
    Star,
    Award,
    Loader2,
    ShoppingBag,
    ChevronRight,
    Sparkles,
    UserPlus,
    Zap,
    Heart,
    QrCode,
    Share2,
    Copy,
    Check,
    Users,
    Crown
} from "lucide-react";

interface PointsTransaction {
    id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    description: string;
    createdAt: string;
}

export default function PuntosPage() {
    const { data: session, status: authStatus } = useSession();
    const [balance, setBalance] = useState(0);
    const [redeemableValue, setRedeemableValue] = useState(0);
    const [history, setHistory] = useState<PointsTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showQR, setShowQR] = useState(false);
    const [copied, setCopied] = useState(false);

    // Referral stats from API
    const [referralCode, setReferralCode] = useState("MOOV-XXXXXX");
    const [friendsInvited, setFriendsInvited] = useState(0);
    const [pointsFromReferrals, setPointsFromReferrals] = useState(0);

    const referralLink = `https://moovy.app/registro?ref=${referralCode}`;

    useEffect(() => {
        if (authStatus === "authenticated") {
            loadPoints();
            loadReferralStats();
        } else if (authStatus === "unauthenticated") {
            setLoading(false);
        }
    }, [authStatus]);

    async function loadReferralStats() {
        try {
            const res = await fetch("/api/referrals");
            if (res.ok) {
                const data = await res.json();
                setReferralCode(data.referralCode || "MOOV-XXXXXX");
                setFriendsInvited(data.friendsInvited || 0);
                setPointsFromReferrals(data.pointsFromReferrals || 0);
            }
        } catch (error) {
            console.error("Error loading referral stats:", error);
        }
    }

    async function loadPoints() {
        try {
            const res = await fetch("/api/points?history=true&config=true");
            if (res.ok) {
                const data = await res.json();
                setBalance(data.balance);
                setRedeemableValue(data.redeemableValue || 0);
                setHistory(data.history || []);
            }
        } catch (error) {
            console.error("Error loading points:", error);
        } finally {
            setLoading(false);
        }
    }

    const getTransactionIcon = (type: string, amount: number) => {
        if (amount > 0) {
            return <TrendingUp className="w-5 h-5 text-green-500" />;
        }
        return <TrendingDown className="w-5 h-5 text-red-500" />;
    };

    const getTransactionColor = (amount: number) => {
        return amount > 0 ? "text-green-500" : "text-red-500";
    };

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(referralCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: "¡Unite a Moovy!",
            text: `Usá mi código ${referralCode} y ganá 100 puntos de regalo. #SoyMoover`,
            url: referralLink,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch (err) {
            console.error("Share failed:", err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#e60012]" />
            </div>
        );
    }

    // ========== MOOVER LANDING PARA USUARIOS ANÓNIMOS ==========
    if (authStatus === "unauthenticated") {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#e60012] via-red-600 to-red-800 text-white">
                {/* Hero */}
                <div className="px-6 pt-8 pb-12 text-center">
                    <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-6">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm font-medium">Programa de Recompensas</span>
                    </div>

                    <h1 className="text-3xl font-bold mb-3">
                        ¿Todavía no sos un <span className="text-yellow-300">MOOVER</span>?
                    </h1>
                    <p className="text-white/80 text-lg mb-2">
                        Sumate y empezá a ganar puntos con cada pedido
                    </p>
                    <p className="text-white/60 text-sm">
                        #SoyMoover
                    </p>
                </div>

                {/* Benefits */}
                <div className="bg-white rounded-t-3xl px-6 py-8 text-gray-900">
                    <h2 className="font-bold text-xl mb-6 text-center">
                        Beneficios de ser <span className="text-[#e60012]">MOOVER</span>
                    </h2>

                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 bg-red-50 rounded-xl">
                            <div className="w-12 h-12 bg-[#e60012] rounded-full flex items-center justify-center flex-shrink-0">
                                <Gift className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-[#e60012]">100 Puntos de Regalo</h3>
                                <p className="text-sm text-gray-600">Al crear tu cuenta, ¡arrancás con puntos!</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                <Zap className="w-6 h-6 text-gray-700" />
                            </div>
                            <div>
                                <h3 className="font-bold">1 Punto = $1</h3>
                                <p className="text-sm text-gray-600">Acumulás puntos con cada compra que hagas</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                <ShoppingBag className="w-6 h-6 text-gray-700" />
                            </div>
                            <div>
                                <h3 className="font-bold">Canjeá por Descuentos</h3>
                                <p className="text-sm text-gray-600">Usá tus puntos para pagar hasta el 50% de tu pedido</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                <Heart className="w-6 h-6 text-gray-700" />
                            </div>
                            <div>
                                <h3 className="font-bold">Promos Exclusivas</h3>
                                <p className="text-sm text-gray-600">Ofertas especiales solo para MOOVERs</p>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-8 space-y-3">
                        <Link
                            href="/registro"
                            className="block w-full py-4 bg-[#e60012] text-white text-center font-bold rounded-xl shadow-lg hover:bg-red-700 transition"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <UserPlus className="w-5 h-5" />
                                ¡Quiero ser MOOVER!
                            </span>
                        </Link>

                        <Link
                            href="/login"
                            className="block w-full py-3 text-center text-gray-600 hover:text-[#e60012] transition"
                        >
                            Ya tengo cuenta, iniciar sesión
                        </Link>
                    </div>

                    {/* Hashtag */}
                    <p className="text-center text-gray-400 text-sm mt-8 mb-20">
                        Compartí tu experiencia con <span className="text-[#e60012] font-medium">#SoyMoover</span>
                    </p>
                </div>
            </div>
        );
    }

    // ========== MOOVER DASHBOARD PARA USUARIOS LOGUEADOS ==========
    return (
        <div className="pb-24">
            {/* MOOVER Hero Card */}
            <div className="bg-gradient-to-br from-[#e60012] via-red-600 to-red-800 mx-4 mt-4 rounded-2xl p-6 text-white relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 opacity-10">
                    <Crown className="w-32 h-32" />
                </div>

                <div className="relative">
                    {/* Title */}
                    <div className="flex items-center gap-2 mb-4">
                        <Crown className="w-6 h-6 text-yellow-300" />
                        <span className="font-bold text-lg">MOOVER</span>
                        <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold ml-1">
                            #SoyMoover
                        </span>
                    </div>

                    {/* Points Display */}
                    <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-5xl font-bold">{balance.toLocaleString("es-AR")}</span>
                        <span className="text-xl text-white/70">puntos</span>
                    </div>

                    {/* Redeemable Value */}
                    <div className="bg-white/20 rounded-xl p-3 mb-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-white/80">Valor en descuentos</span>
                            <span className="font-bold text-lg">{formatPrice(redeemableValue)}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowQR(true)}
                            className="flex-1 bg-white text-[#e60012] py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                        >
                            <QrCode className="w-5 h-5" />
                            Mi Código QR
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex-1 bg-white/20 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 border border-white/30"
                        >
                            <Share2 className="w-5 h-5" />
                            Compartir
                        </button>
                    </div>
                </div>
            </div>

            {/* Referral Code Section */}
            <div className="mx-4 mt-4 bg-white rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">Tu código de referido</p>
                        <p className="font-mono font-bold text-lg text-gray-900">{referralCode}</p>
                    </div>
                    <button
                        onClick={handleCopyCode}
                        className={`p-3 rounded-xl transition ${copied ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                    Compartí tu código y ganá 50 puntos por cada amigo que se registre
                </p>
            </div>

            {/* Referral Stats */}
            <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-4 text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{friendsInvited}</p>
                    <p className="text-xs text-gray-500">Amigos invitados</p>
                </div>
                <div className="bg-white rounded-xl p-4 text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Gift className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{pointsFromReferrals}</p>
                    <p className="text-xs text-gray-500">Puntos por referidos</p>
                </div>
            </div>

            {/* How to earn points */}
            <div className="mx-4 mt-6 bg-white rounded-xl p-4">
                <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Cómo ganar puntos
                </h2>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-[#e60012]" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">Comprando</p>
                            <p className="text-gray-500 text-xs">1 punto por cada $1 de compra</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">Refiriendo amigos</p>
                            <p className="text-gray-500 text-xs">50 puntos por cada amigo</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                            <Award className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">Bono de bienvenida</p>
                            <p className="text-gray-500 text-xs">100 puntos al registrarte</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* How to use points */}
            <div className="mx-4 mt-4 bg-gradient-to-r from-red-50 to-amber-50 rounded-xl p-4 border border-red-100">
                <h3 className="font-bold text-gray-900 mb-2">💡 ¿Cómo canjear?</h3>
                <p className="text-sm text-gray-600">
                    Usá tus puntos en el checkout para obtener hasta un <strong>50% de descuento</strong> en tu pedido.
                    Necesitás mínimo <strong>100 puntos</strong> para canjear.
                </p>
            </div>

            {/* Transaction History */}
            <div className="mx-4 mt-6">
                <h2 className="font-bold text-gray-900 mb-3">Historial de Movimientos</h2>

                {history.length === 0 ? (
                    <div className="bg-white rounded-xl p-6 text-center">
                        <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">Aún no tenés movimientos de puntos</p>
                        <p className="text-gray-400 text-xs mt-1">¡Hacé tu primera compra para empezar a acumular!</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl overflow-hidden">
                        {history.map((tx, index) => (
                            <div
                                key={tx.id}
                                className={`px-4 py-3 flex items-center gap-3 ${index < history.length - 1 ? "border-b border-gray-50" : ""
                                    }`}
                            >
                                <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                                    {getTransactionIcon(tx.type, tx.amount)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {tx.description}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {new Date(tx.createdAt).toLocaleDateString("es-AR", {
                                            day: "numeric",
                                            month: "short",
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${getTransactionColor(tx.amount)}`}>
                                        {tx.amount > 0 ? "+" : ""}{tx.amount}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Saldo: {tx.balanceAfter}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* QR Code Modal */}
            {showQR && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowQR(false)}>
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
                        <div className="mb-4">
                            <Crown className="w-10 h-10 text-[#e60012] mx-auto mb-2" />
                            <h3 className="font-bold text-xl text-gray-900">Tu Código MOOVER</h3>
                            <p className="text-gray-500 text-sm">Escaneá para registrarte con mi código</p>
                        </div>

                        {/* Real QR Code */}
                        <div className="bg-gray-100 rounded-2xl p-6 mb-4">
                            <div className="w-52 h-52 bg-white mx-auto rounded-xl flex items-center justify-center p-3">
                                <QRCodeSVG
                                    value={referralLink}
                                    size={180}
                                    level="H"
                                    includeMargin={false}
                                    bgColor="#ffffff"
                                    fgColor="#e60012"
                                />
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-3 mb-4">
                            <p className="font-mono font-bold text-lg text-[#e60012]">{referralCode}</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleCopyCode}
                                className="flex-1 py-3 bg-gray-100 rounded-xl font-medium text-gray-700 flex items-center justify-center gap-2"
                            >
                                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                {copied ? "¡Copiado!" : "Copiar"}
                            </button>
                            <button
                                onClick={handleShare}
                                className="flex-1 py-3 bg-[#e60012] text-white rounded-xl font-medium flex items-center justify-center gap-2"
                            >
                                <Share2 className="w-5 h-5" />
                                Compartir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
