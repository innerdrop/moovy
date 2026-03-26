"use client";

// Points Page - Mis Puntos / MOOVER Dashboard
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { formatPrice } from "@/lib/delivery";
import { toast } from "@/store/toast";
import {
    Gift,
    TrendingUp,
    TrendingDown,
    Star,
    Award,
    Loader2,
    ShoppingBag,
    ChevronRight,
    ChevronDown,
    Sparkles,
    UserPlus,
    Zap,
    Heart,
    QrCode,
    Share2,
    Copy,
    Check,
    Users,
    Crown,
    X,
    Download
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
    const [pointsLifetime, setPointsLifetime] = useState(0);
    const [redeemableValue, setRedeemableValue] = useState(0);
    const [history, setHistory] = useState<PointsTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showQR, setShowQR] = useState(false);
    const [copied, setCopied] = useState(false);
    const [expandedItem, setExpandedItem] = useState<string | null>(null);

    // Referral stats from API
    const [referralCode, setReferralCode] = useState("MOV-XXXX");
    const [friendsInvited, setFriendsInvited] = useState(0);
    const [pointsFromReferrals, setPointsFromReferrals] = useState(0);
    const [monthlyFriendsInvited, setMonthlyFriendsInvited] = useState(0);
    const [monthlyPointsFromReferrals, setMonthlyPointsFromReferrals] = useState(0);
    const [currentMonthName, setCurrentMonthName] = useState("");
    const [referralLink, setReferralLink] = useState("");

    // Friends list modal
    const [showFriendsModal, setShowFriendsModal] = useState(false);
    const [friendsList, setFriendsList] = useState<{ id: string; name: string; pointsEarned: number; joinedAt: string }[]>([]);
    const [loadingFriends, setLoadingFriends] = useState(false);

    // Monthly stats modal
    const [showStatsModal, setShowStatsModal] = useState(false);

    // Level benefits modal
    const [showLevelModal, setShowLevelModal] = useState(false);

    // Gift points modal
    const [showGiftModal, setShowGiftModal] = useState(false);
    const [giftEmail, setGiftEmail] = useState("");
    const [giftAmount, setGiftAmount] = useState("");
    const [giftLoading, setGiftLoading] = useState(false);
    const [giftError, setGiftError] = useState("");
    const [giftSuccess, setGiftSuccess] = useState("");

    useEffect(() => {
        // Set dynamic link based on current browser URL
        if (typeof window !== "undefined") {
            setReferralLink(`${window.location.origin}/registro?ref=${referralCode}`);
        }
    }, [referralCode]);

    useEffect(() => {
        if (authStatus === "authenticated") {
            // Instant load from session if available
            if ((session?.user as any)?.referralCode) {
                setReferralCode((session.user as any).referralCode);
            }
            loadPoints();
            loadReferralStats();
            // Also load friends/monthly stats on initial load
            loadFriendsList();
        } else if (authStatus === "unauthenticated") {
            setLoading(false);
        }
    }, [authStatus, session]);

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
                setPointsLifetime(data.pointsLifetime || 0);
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
            // Try modern clipboard API first
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(referralCode);
            } else {
                // Fallback for mobile and older browsers
                const textArea = document.createElement("textarea");
                textArea.value = referralCode;
                textArea.style.position = "fixed";
                textArea.style.left = "-999999px";
                textArea.style.top = "-999999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand("copy");
                textArea.remove();
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
            // Last resort: show toast with code
            toast.info(`Tu código: ${referralCode}`);
        }
    };

    const handleShare = async () => {
        const shareText = `¡Unite a Moovy! Usá mi código ${referralCode} y ganá 100 puntos de regalo. #SoyMoover`;
        const fullText = `${shareText} ${referralLink}`;

        // Check if on mobile
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        // Try Web Share API first (works on most mobile browsers)
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({
                    title: "¡Unite a Moovy!",
                    text: shareText,
                    url: referralLink,
                });
                return; // Success
            } catch (err: any) {
                // User cancelled - don't fallback
                if (err.name === 'AbortError') return;
                // For other errors, continue to fallback
            }
        }

        // Mobile fallback: open WhatsApp directly
        if (isMobile) {
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(fullText)}`;
            window.open(whatsappUrl, '_blank');
            return;
        }

        // Desktop fallback: copy to clipboard
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(fullText);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } else {
                // Legacy fallback
                const textArea = document.createElement("textarea");
                textArea.value = fullText;
                textArea.style.cssText = "position:fixed;left:-9999px;top:-9999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand("copy");
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                } catch {
                    toast.info("Mensaje copiado al portapapeles");
                }
                textArea.remove();
            }
        } catch {
            toast.info("Mensaje copiado al portapapeles");
        }
    };

    const handleCopyToClipboard = async (text: string) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.cssText = "position:fixed;left:-9999px;top:-9999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand("copy");
                textArea.remove();
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.info(`Tu código: ${text}`);
        }
    };

    const handleDownloadQR = async () => {
        try {
            // Load the template image
            const loadImage = (src: string): Promise<HTMLImageElement> => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                    img.src = src;
                });
            };

            const template = await loadImage('/qr-template.png');

            // Create canvas matching template size (500x500)
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Use template dimensions
            canvas.width = template.width;
            canvas.height = template.height;

            // Draw template as background
            ctx.drawImage(template, 0, 0);

            // Get QR code canvas
            const qrCanvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
            if (qrCanvas) {
                // Position QR in center of white area
                const qrSize = 270;
                const qrX = (canvas.width - qrSize) / 2;
                const qrY = 95; // Positioned in white area
                ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
            }

            // Add referral code below QR
            ctx.textAlign = 'center';
            ctx.fillStyle = '#e60012';
            ctx.font = 'bold 22px monospace';
            ctx.fillText(referralCode, canvas.width / 2, 375);

            // Download PNG
            const link = document.createElement('a');
            link.download = `moover-${referralCode}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
        } catch (error) {
            console.error('Error generating QR card:', error);
            // Fallback: download plain QR
            const qrCanvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
            if (qrCanvas) {
                const link = document.createElement('a');
                link.download = `moover-${referralCode}.png`;
                link.href = qrCanvas.toDataURL('image/png');
                link.click();
            }
        }
    };

    // Load friends list for modal with monthly stats
    const loadFriendsList = async () => {
        setLoadingFriends(true);
        try {
            const res = await fetch("/api/moover/friends");
            if (res.ok) {
                const data = await res.json();
                setFriendsList(data.friends || []);
                // Set monthly stats
                if (data.stats) {
                    setMonthlyFriendsInvited(data.stats.monthly?.friendsCount || 0);
                    setMonthlyPointsFromReferrals(data.stats.monthly?.pointsEarned || 0);
                    setCurrentMonthName(data.stats.monthly?.monthName || "");
                    // Also update totals
                    setFriendsInvited(data.stats.total?.friendsCount || 0);
                    setPointsFromReferrals(data.stats.total?.pointsEarned || 0);
                }
            }
        } catch (error) {
            console.error("Error loading friends:", error);
        } finally {
            setLoadingFriends(false);
        }
    };

    const handleOpenFriendsModal = () => {
        setShowFriendsModal(true);
        loadFriendsList();
    };

    // Gift points handler
    const handleGiftPoints = async (e: React.FormEvent) => {
        e.preventDefault();
        setGiftError("");
        setGiftSuccess("");
        setGiftLoading(true);

        try {
            const res = await fetch("/api/moover/gift", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recipientEmail: giftEmail.trim(),
                    amount: parseInt(giftAmount)
                })
            });

            const data = await res.json();

            if (res.ok) {
                setGiftSuccess(data.message);
                setBalance(data.newBalance);
                setGiftEmail("");
                setGiftAmount("");
                // Close modal after 2 seconds
                setTimeout(() => {
                    setShowGiftModal(false);
                    setGiftSuccess("");
                }, 2000);
            } else {
                setGiftError(data.error || "Error al enviar puntos");
            }
        } catch {
            setGiftError("Error de conexión");
        } finally {
            setGiftLoading(false);
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
            <div className="min-h-screen bg-white">
                {/* Hero Section */}
                <section className="px-4 py-20 lg:py-28 max-w-7xl mx-auto">
                    <div className="max-w-2xl">
                        <div className="inline-block mb-6">
                            <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                                Programa de Recompensas
                            </span>
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                            Comprá y ganácon{" "}
                            <span
                                className="text-[#e60012]"
                                style={{ fontFamily: "'Junegull', sans-serif" }}
                            >
                                MOOVER
                            </span>
                        </h1>

                        <p className="text-xl lg:text-2xl text-gray-600 mb-8 leading-relaxed">
                            Cada compra te acerca a tu próximo descuento. Ganásiempre,
                            canjeá cuando quieras.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href="/registro"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#e60012] text-white font-bold rounded-xl hover:bg-red-700 transition active:scale-95"
                            >
                                <UserPlus className="w-5 h-5" />
                                Quiero ser MOOVER
                            </Link>
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center px-8 py-4 bg-gray-100 text-gray-900 font-semibold rounded-xl hover:bg-gray-200 transition"
                            >
                                Tengo cuenta
                            </Link>
                        </div>
                    </div>
                </section>

                {/* How it Works Section */}
                <section className="px-4 py-20 bg-gray-50 border-t border-gray-200">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-16 text-center">
                            Cómo Funciona
                        </h2>

                        <div className="max-w-4xl mx-auto space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-12">
                            {/* Step 1 */}
                            <div className="flex flex-col">
                                <div className="mb-6">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#e60012] text-white rounded-full text-2xl font-bold mb-4">
                                        1
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                        Comprá
                                    </h3>
                                    <p className="text-lg text-gray-600 leading-relaxed">
                                        Cada peso que gastás se convierte automáticamente en puntos.
                                        <strong className="block text-gray-900 mt-2">
                                            1 punto por cada $1
                                        </strong>
                                    </p>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex flex-col">
                                <div className="mb-6">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#e60012] text-white rounded-full text-2xl font-bold mb-4">
                                        2
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                        Acumulá
                                    </h3>
                                    <p className="text-lg text-gray-600 leading-relaxed">
                                        Tus puntos tienen valor real y nunca expiran.
                                        <strong className="block text-gray-900 mt-2">
                                            Cada punto vale $0.015
                                        </strong>
                                    </p>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex flex-col">
                                <div className="mb-6">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#e60012] text-white rounded-full text-2xl font-bold mb-4">
                                        3
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                        Canjeá
                                    </h3>
                                    <p className="text-lg text-gray-600 leading-relaxed">
                                        Usálos como descuento en tu próximo pedido.
                                        <strong className="block text-gray-900 mt-2">
                                            Hasta 15% de descuento
                                        </strong>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Example Section */}
                <section className="px-4 py-20">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-12 text-center">
                            Te Mostramos un Ejemplo
                        </h2>

                        <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-2xl p-8 lg:p-12">
                            <div className="space-y-8">
                                <div className="flex items-start gap-6">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center w-12 h-12 bg-[#e60012] text-white rounded-full font-bold">
                                            🛍️
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-lg text-gray-900">
                                            Si comprás por{" "}
                                            <strong className="text-[#e60012]">$8,000</strong>
                                        </p>
                                        <p className="text-gray-600 mt-1">
                                            (Tu pedido de almuerzo para toda la semana)
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-6">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center w-12 h-12 bg-[#e60012] text-white rounded-full font-bold">
                                            ⭐
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-lg text-gray-900">
                                            Ganás{" "}
                                            <strong className="text-[#e60012]">8,000 puntos</strong>
                                        </p>
                                        <p className="text-gray-600 mt-1">
                                            (1 punto por cada peso)
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-6">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center w-12 h-12 bg-[#e60012] text-white rounded-full font-bold">
                                            💳
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-lg text-gray-900">
                                            Esos puntos valen{" "}
                                            <strong className="text-[#e60012]">$120</strong>
                                        </p>
                                        <p className="text-gray-600 mt-1">
                                            (8,000 × $0.015 cada punto)
                                        </p>
                                    </div>
                                </div>

                                <div className="border-t-2 border-red-300 pt-8">
                                    <p className="text-center text-gray-900 text-lg">
                                        <strong>En tu próximo pedido de $800,</strong>
                                        <br />
                                        <span className="text-[#e60012] text-2xl font-bold">
                                            tenés $120 de descuento listo
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Bonuses Section */}
                <section className="px-4 py-20 bg-gray-50 border-t border-gray-200">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-16 text-center">
                            Bonificaciones Extras
                        </h2>

                        <div className="space-y-8">
                            {/* Welcome bonus */}
                            <div className="bg-white rounded-2xl p-8 border border-gray-200">
                                <div className="flex items-start gap-4 mb-4">
                                    <span className="text-4xl">🎁</span>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">
                                            Al registrarte
                                        </h3>
                                        <p className="text-gray-600 mt-1">
                                            <strong className="text-[#e60012] text-lg">
                                                250 puntos de bienvenida
                                            </strong>
                                            <br />
                                            ($3.75 en valor real) en tu primera compra
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Referral bonus */}
                            <div className="bg-white rounded-2xl p-8 border border-gray-200">
                                <div className="flex items-start gap-4 mb-4">
                                    <span className="text-4xl">👥</span>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">
                                            Invitá a amigos
                                        </h3>
                                        <p className="text-gray-600 mt-1">
                                            <strong className="text-[#e60012] text-lg">
                                                500 puntos por cada amigo
                                            </strong>
                                            <br />
                                            Cuando tu amigo hace su primera compra de $8,000+
                                        </p>
                                        <p className="text-gray-600 mt-2 text-sm">
                                            Además, tu amigo recibe 250 puntos extras al registrarse
                                            con tu código
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Review bonus */}
                            <div className="bg-white rounded-2xl p-8 border border-gray-200">
                                <div className="flex items-start gap-4 mb-4">
                                    <span className="text-4xl">⭐</span>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">
                                            Dejá una reseña
                                        </h3>
                                        <p className="text-gray-600 mt-1">
                                            <strong className="text-[#e60012] text-lg">
                                                25 puntos por reseña
                                            </strong>
                                            <br />
                                            Después de cada compra
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 p-8 bg-blue-50 border border-blue-200 rounded-2xl">
                            <p className="text-gray-700 text-center">
                                <span className="block text-sm text-gray-600 mb-2">
                                    💡 Nota
                                </span>
                                Los bonos de bienvenida se activan con tu primera compra de $5,000+.
                                Los bonos por referidos se otorgan cuando tu amigo gasta $8,000.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Levels Section */}
                <section className="px-4 py-20">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-16 text-center">
                            Niveles Exclusivos
                        </h2>

                        <div className="space-y-6">
                            {/* Moover */}
                            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-8">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-blue-600 uppercase tracking-wide mb-2">
                                            🚀 Nivel Inicial
                                        </p>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                            Moover
                                        </h3>
                                        <p className="text-gray-600 mb-4">
                                            0 a 299,999 puntos acumulados
                                        </p>
                                        <ul className="space-y-2 text-gray-700">
                                            <li>✓ Acumulás 1 punto por cada $1</li>
                                            <li>✓ Canjeás descuentos hasta 15%</li>
                                            <li>✓ Referidos y bonificaciones</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Pro */}
                            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-8">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-red-600 uppercase tracking-wide mb-2">
                                            ⚡ Nivel Pro
                                        </p>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                            Pro
                                        </h3>
                                        <p className="text-gray-600 mb-4">
                                            300,000 a 999,999 puntos acumulados
                                        </p>
                                        <ul className="space-y-2 text-gray-700">
                                            <li>✓ Todo lo de Moover</li>
                                            <li>✓ 5% OFF en envíos</li>
                                            <li>✓ Sorteos exclusivos</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="bg-gradient-to-r from-yellow-50 to-pink-50 border border-yellow-200 rounded-2xl p-8">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-yellow-700 uppercase tracking-wide mb-2">
                                            👑 Máximo Nivel
                                        </p>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                            Leyenda
                                        </h3>
                                        <p className="text-gray-600 mb-4">
                                            1,000,000+ puntos acumulados
                                        </p>
                                        <ul className="space-y-2 text-gray-700">
                                            <li>✓ Todo lo de Pro</li>
                                            <li>✓ Envíos gratis en pedidos +$20k</li>
                                            <li>✓ Atención prioritaria 24/7</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p className="text-center text-gray-500 text-sm mt-12">
                            Los niveles se calculan con tu historial total de puntos acumulados.
                            No se pierden al canjeár.
                        </p>
                    </div>
                </section>

                {/* CTA Final Section */}
                <section className="px-4 py-20 bg-gradient-to-r from-[#a3000c] via-[#e60012] to-[#ff1a2e] text-white">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                            ¿Listo para ser MOOVER?
                        </h2>
                        <p className="text-xl text-white/90 mb-8">
                            Creá tu cuenta en 2 minutos y empezá a acumular puntos con tu
                            primer pedido.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/registro"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#e60012] font-bold rounded-xl hover:bg-gray-100 transition active:scale-95"
                            >
                                <UserPlus className="w-5 h-5" />
                                Registrarme Ahora
                            </Link>
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center px-8 py-4 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition border border-white/30"
                            >
                                Ya tengo cuenta
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Footer hashtag */}
                <section className="px-4 py-12 text-center border-t border-gray-200">
                    <p className="text-gray-600 text-lg">
                        Compartí tu experiencia con{" "}
                        <span className="text-[#e60012] font-bold">#SoyMoover</span>
                    </p>
                </section>
            </div>
        );
    }

    // ========== MOOVER DASHBOARD PARA USUARIOS LOGUEADOS ==========
    return (
        <div className="pb-24 px-4 lg:px-6 xl:px-8">
            <div className="max-w-7xl mx-auto">
                {/* MOOVER Hero Card */}
                <div className="bg-gradient-to-br from-[#a3000c] via-[#e60012] to-[#ff1a2e] rounded-2xl p-6 lg:p-10 text-white relative overflow-hidden mt-4 lg:mt-8">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 opacity-10">
                        <Crown className="w-32 h-32" />
                    </div>

                    <div className="relative">
                        {/* Title */}
                        <div className="flex items-center gap-2 mb-4">
                            <Crown className="w-6 h-6 text-yellow-300" />
                            <span className="font-bold text-lg" style={{ fontFamily: "'Junegull', sans-serif" }}>
                                MOOVER
                            </span>
                            <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold ml-1">
                                #SoyMoover
                            </span>
                        </div>

                        {/* Points Display */}
                        <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-5xl font-bold">
                                {balance.toLocaleString("es-AR")}
                            </span>
                            <span className="text-xl text-white/70">puntos</span>
                        </div>

                        {/* Membership Level - Clickable */}
                        <button
                            onClick={() => setShowLevelModal(true)}
                            className="w-full bg-white/20 rounded-xl p-3 mb-4 hover:bg-white/30 transition active:scale-[0.98]"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-white/80">Tu nivel</span>
                                <span className="font-bold text-lg flex items-center gap-1">
                                    {pointsLifetime >= 1000000
                                        ? "👑 Leyenda"
                                        : pointsLifetime >= 300000
                                            ? "⚡ Pro"
                                            : "🚀 Moover"}
                                </span>
                            </div>
                            <div className="mt-2 bg-white/10 rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-full bg-yellow-400 rounded-full transition-all"
                                    style={{
                                        width: `${Math.min(
                                            100,
                                            pointsLifetime >= 1000000
                                                ? 100
                                                : pointsLifetime >= 300000
                                                    ? (pointsLifetime / 1000000) * 100
                                                    : (pointsLifetime / 300000) * 100
                                        )}%`
                                    }}
                                />
                            </div>
                            <p className="text-[10px] text-white/60 mt-1 text-left">
                                {pointsLifetime >= 1000000
                                    ? "¡Nivel máximo! • Tocá para ver beneficios"
                                    : pointsLifetime >= 300000
                                        ? `${(1000000 - pointsLifetime).toLocaleString("es-AR")} para Leyenda`
                                        : `${(300000 - pointsLifetime).toLocaleString("es-AR")} para Pro`}
                            </p>
                        </button>

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
                            <p className="font-mono font-bold text-lg text-gray-900">
                                {referralCode}
                            </p>
                        </div>
                        <button
                            onClick={handleCopyCode}
                            className={`p-3 rounded-xl transition ${
                                copied
                                    ? "bg-green-100 text-green-600"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            {copied ? (
                                <Check className="w-5 h-5" />
                            ) : (
                                <Copy className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        Compartí tu código y ganá 1,000 puntos por cada amigo que se
                        registre
                    </p>
                </div>

                {/* Referral Stats - Monthly */}
                <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
                    <button
                        onClick={handleOpenFriendsModal}
                        className="bg-white rounded-xl p-4 text-center hover:bg-red-50 transition active:scale-95"
                    >
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Users className="w-6 h-6 text-red-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                            {friendsInvited}
                        </p>
                        <p className="text-xs text-gray-500">Amigos invitados</p>
                        <p className="text-[10px] text-red-600 mt-1">Ver lista →</p>
                    </button>
                    <button
                        onClick={() => setShowStatsModal(true)}
                        className="bg-white rounded-xl p-4 text-center hover:bg-amber-50 transition active:scale-95"
                    >
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <TrendingUp className="w-6 h-6 text-amber-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                            {monthlyPointsFromReferrals}
                        </p>
                        <p className="text-xs text-gray-500">
                            Puntos {currentMonthName || "este mes"}
                        </p>
                        <p className="text-[10px] text-amber-600 mt-1">Ver detalles →</p>
                    </button>
                </div>

                {/* Gift Points Button */}
                <div className="mx-4 mt-4">
                    <button
                        onClick={() => setShowGiftModal(true)}
                        className="w-full bg-white rounded-xl p-4 flex items-center gap-4 hover:bg-green-50 transition active:scale-[0.98]"
                    >
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <Gift className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="text-left flex-1">
                            <p className="font-bold text-gray-900">Regalar puntos</p>
                            <p className="text-xs text-gray-500">Enviá puntos a un amigo</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* How to earn points */}
                <div className="mx-4 mt-6 bg-white rounded-xl p-4">
                    <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        Cómo ganar puntos
                    </h2>
                    <div className="space-y-2">
                        {/* Comprando - Expandable */}
                        <div>
                            <button
                                onClick={() =>
                                    setExpandedItem(
                                        expandedItem === "compras" ? null : "compras"
                                    )
                                }
                                className="w-full flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-gray-50 transition"
                            >
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                    <ShoppingBag className="w-5 h-5 text-[#e60012]" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-medium text-gray-900">Comprando</p>
                                    <p className="text-gray-500 text-xs">
                                        1 punto por cada $1 de compra
                                    </p>
                                </div>
                                {expandedItem === "compras" ? (
                                    <ChevronDown className="w-5 h-5 text-[#e60012]" />
                                ) : (
                                    <ChevronRight className="w-5 h-5 text-gray-300" />
                                )}
                            </button>
                            {expandedItem === "compras" && (
                                <div className="ml-14 mr-2 mt-2 p-3 bg-red-50 rounded-lg text-sm text-gray-600">
                                    <p className="mb-2">
                                        📦 Por cada compra que realices, acumulás puntos
                                        automáticamente:
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 text-xs">
                                        <li>Si gastás $1.000, sumás 1.000 puntos</li>
                                        <li>Los puntos se acreditan al recibir tu pedido</li>
                                        <li>Aplica para productos, no para envío</li>
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Refiriendo amigos - Expandable */}
                        <div>
                            <button
                                onClick={() =>
                                    setExpandedItem(
                                        expandedItem === "referidos" ? null : "referidos"
                                    )
                                }
                                className="w-full flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-gray-50 transition"
                            >
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                    <Users className="w-5 h-5 text-red-600" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-medium text-gray-900">
                                        Refiriendo amigos
                                    </p>
                                    <p className="text-gray-500 text-xs">
                                        500 puntos por cada amigo
                                    </p>
                                </div>
                                {expandedItem === "referidos" ? (
                                    <ChevronDown className="w-5 h-5 text-red-600" />
                                ) : (
                                    <ChevronRight className="w-5 h-5 text-gray-300" />
                                )}
                            </button>
                            {expandedItem === "referidos" && (
                                <div className="ml-14 mr-2 mt-2 p-3 bg-red-50 rounded-lg text-sm text-gray-600">
                                    <p className="mb-2">
                                        👥 Compartí tu código y ganá puntos cuando tu amigo haga su
                                        primera compra:
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 text-xs">
                                        <li>Vos ganás 500 puntos cuando tu amigo compra $8,000+</li>
                                        <li>Tu amigo gana 250 puntos extras de bienvenida</li>
                                        <li>¡No hay límite! Invitá a todos los que quieras</li>
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Bono de bienvenida - Info only */}
                        <div className="flex items-center gap-3 text-sm p-2">
                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                <Award className="w-5 h-5 text-amber-600" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                    Bono de bienvenida
                                </p>
                                <p className="text-gray-500 text-xs">
                                    250 puntos con tu primera compra ✓
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* How to use points */}
                <div className="mx-4 mt-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                    <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                        💳 Usá tus Puntos en el Checkout
                    </h3>
                    <p className="text-sm text-gray-600">
                        Al finalizar tu compra, elegí cuántos puntos querés usar para
                        obtener un descuento. ¡Cuantos más puntos uses, mayor será tu
                        ahorro!
                    </p>
                </div>

                {/* Catalog Teaser */}
                <div className="mx-4 mt-4 bg-gradient-to-r from-red-600 to-indigo-600 rounded-xl p-4 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 opacity-20">
                        <Gift className="w-24 h-24 -mt-4 -mr-4" />
                    </div>
                    <div className="relative">
                        <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold">
                            PRÓXIMAMENTE
                        </span>
                        <h3 className="font-bold text-lg mt-2">🎁 Catálogo de Canje</h3>
                        <p className="text-sm text-white/80 mt-1">
                            Muy pronto podrás canjear tus puntos por productos exclusivos,
                            experiencias únicas y mucho más.
                        </p>
                        <div className="flex gap-2 mt-3">
                            <div className="bg-white/20 rounded-lg px-3 py-1 text-xs">
                                🎧 Auriculares
                            </div>
                            <div className="bg-white/20 rounded-lg px-3 py-1 text-xs">
                                🎫 Descuentos
                            </div>
                            <div className="bg-white/20 rounded-lg px-3 py-1 text-xs">
                                🎁 Sorpresas
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="mx-4 mt-6">
                    <h2 className="font-bold text-gray-900 mb-3">Historial de Movimientos</h2>

                    {history.length === 0 ? (
                        <div className="bg-white rounded-xl p-6 text-center">
                            <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">
                                Aún no tenés movimientos de puntos
                            </p>
                            <p className="text-gray-400 text-xs mt-1">
                                ¡Hacé tu primera compra para empezar a acumular!
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl overflow-hidden">
                            <div className="max-h-[320px] overflow-y-auto overscroll-contain touch-pan-y">
                                {history.map((tx, index) => (
                                    <div
                                        key={tx.id}
                                        className={`px-4 py-3 flex items-center gap-3 ${
                                            index < history.length - 1
                                                ? "border-b border-gray-50"
                                                : ""
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
                                                {new Date(tx.createdAt).toLocaleDateString(
                                                    "es-AR",
                                                    {
                                                        day: "numeric",
                                                        month: "short",
                                                        hour: "2-digit",
                                                        minute: "2-digit"
                                                    }
                                                )}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p
                                                className={`font-bold ${getTransactionColor(
                                                    tx.amount
                                                )}`}
                                            >
                                                {tx.amount > 0 ? "+" : ""}
                                                {tx.amount}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Saldo: {tx.balanceAfter}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {history.length > 5 && (
                                <p className="text-center text-xs text-gray-400 py-2 border-t border-gray-100">
                                    Deslizá para ver más movimientos
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* QR Code Modal */}
                {showQR && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                        onClick={() => setShowQR(false)}
                    >
                        <div
                            className="bg-white rounded-2xl p-6 max-w-sm w-full text-center relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowQR(false)}
                                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>

                            <h2 className="font-bold text-lg text-gray-900 mb-4">
                                Mi Código QR
                            </h2>

                            <div className="bg-white p-4 rounded-xl flex justify-center mb-4">
                                <QRCodeCanvas
                                    id="qr-canvas"
                                    value={referralLink}
                                    size={256}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                <p className="text-sm text-gray-500 mb-2">Tu código:</p>
                                <p className="font-mono font-bold text-lg text-gray-900 break-all">
                                    {referralCode}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <button
                                    onClick={handleDownloadQR}
                                    className="w-full bg-[#e60012] text-white py-3 font-semibold rounded-xl hover:bg-red-700 transition flex items-center justify-center gap-2"
                                >
                                    <Download className="w-5 h-5" />
                                    Descargar QR
                                </button>
                                <button
                                    onClick={handleCopyCode}
                                    className="w-full bg-gray-100 text-gray-900 py-3 font-semibold rounded-xl hover:bg-gray-200 transition"
                                >
                                    {copied ? "Código copiado ✓" : "Copiar Código"}
                                </button>
                            </div>

                            <p className="text-xs text-gray-400 mt-4">
                                Compartí tu código para que otros ganen 100 puntos
                            </p>
                        </div>
                    </div>
                )}

                {/* ========== FRIENDS MODAL ========== */}
                {showFriendsModal && (
                    <div
                        className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
                        onClick={() => setShowFriendsModal(false)}
                    >
                        <div
                            className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-red-600" />
                                    Mis Amigos Invitados
                                </h2>
                                <button
                                    onClick={() => setShowFriendsModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-4">
                                {loadingFriends ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-[#e60012]" />
                                    </div>
                                ) : friendsList.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 text-sm mb-2">
                                            Aún no invitaste a nadie
                                        </p>
                                        <p className="text-gray-400 text-xs">
                                            Compartí tu código para que tus amigos se registren
                                        </p>
                                    </div>
                                ) : (
                                    <ul className="space-y-2">
                                        {friendsList.map((friend) => (
                                            <li
                                                key={friend.id}
                                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                                            >
                                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                                    <span className="text-red-600 font-bold text-sm">
                                                        {friend.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">
                                                        {friend.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Se unió el{" "}
                                                        {new Date(friend.joinedAt).toLocaleDateString(
                                                            "es-AR"
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-green-600 font-bold">
                                                        +{friend.pointsEarned}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400">
                                                        puntos
                                                    </p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ========== GIFT POINTS MODAL ========== */}
                {showGiftModal && (
                    <div
                        className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
                        onClick={() => setShowGiftModal(false)}
                    >
                        <div
                            className="bg-white rounded-2xl w-full max-w-md"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-4 border-b">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Gift className="w-5 h-5 text-green-600" />
                                    Regalar Puntos
                                </h2>
                                <button
                                    onClick={() => setShowGiftModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleGiftPoints} className="p-4 space-y-4">
                                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                                    <p className="text-sm text-green-800">
                                        Tu balance actual:{" "}
                                        <strong>
                                            {balance.toLocaleString("es-AR")} puntos
                                        </strong>
                                    </p>
                                    <p className="text-xs text-green-600">
                                        Podés regalar hasta{" "}
                                        {Math.floor(balance * 0.5).toLocaleString("es-AR")}{" "}
                                        puntos
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email del destinatario
                                    </label>
                                    <input
                                        type="email"
                                        value={giftEmail}
                                        onChange={(e) => setGiftEmail(e.target.value)}
                                        placeholder="amigo@email.com"
                                        className="input"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Cantidad de puntos
                                    </label>
                                    <input
                                        type="number"
                                        value={giftAmount}
                                        onChange={(e) => setGiftAmount(e.target.value)}
                                        placeholder="Mínimo 100"
                                        min="100"
                                        max={Math.floor(balance * 0.5)}
                                        className="input"
                                        required
                                    />
                                </div>

                                {giftError && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
                                        {giftError}
                                    </div>
                                )}

                                {giftSuccess && (
                                    <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl p-3 flex items-center gap-2">
                                        <Check className="w-4 h-4" />
                                        {giftSuccess}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={giftLoading || !giftEmail || !giftAmount}
                                    className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {giftLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Gift className="w-5 h-5" />
                                    )}
                                    Enviar Regalo
                                </button>

                                <p className="text-xs text-gray-400 text-center">
                                    Al enviar, aceptás los{" "}
                                    <Link
                                        href="/terminos-moover"
                                        className="text-[#e60012] hover:underline"
                                        onClick={() => setShowGiftModal(false)}
                                    >
                                        términos del programa MOOVER
                                    </Link>
                                </p>
                            </form>
                        </div>
                    </div>
                )}

                {/* Level Benefits Modal */}
                {showLevelModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                        onClick={() => setShowLevelModal(false)}
                    >
                        <div
                            className="w-full max-w-lg bg-white rounded-2xl max-h-[80vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between rounded-t-2xl">
                                <h3 className="text-lg font-bold text-gray-900">
                                    Niveles MOOVER
                                </h3>
                                <button
                                    onClick={() => setShowLevelModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="p-4 space-y-4">
                                {/* Moover */}
                                <div
                                    className={`rounded-xl p-4 border-2 ${
                                        pointsLifetime < 300000
                                            ? "border-blue-400 bg-blue-50"
                                            : "border-gray-200 bg-gray-50"
                                    }`}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-3xl">🚀</span>
                                        <div>
                                            <p className="font-bold text-gray-900">Moover</p>
                                            <p className="text-xs text-gray-500">
                                                0 - 299,999 puntos
                                            </p>
                                        </div>
                                        {pointsLifetime < 300000 && (
                                            <span className="ml-auto text-xs bg-blue-400 text-white px-2 py-0.5 rounded-full font-bold">
                                                Tu nivel
                                            </span>
                                        )}
                                    </div>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>✓ Acumulás 1 punto por cada $1</li>
                                        <li>✓ Acceso a descuentos base</li>
                                    </ul>
                                </div>

                                {/* Pro */}
                                <div
                                    className={`rounded-xl p-4 border-2 ${
                                        pointsLifetime >= 300000 &&
                                        pointsLifetime < 1000000
                                            ? "border-red-500 bg-red-50"
                                            : "border-gray-200 bg-gray-50"
                                    }`}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-3xl">⚡</span>
                                        <div>
                                            <p className="font-bold text-gray-900">Pro</p>
                                            <p className="text-xs text-gray-500">
                                                300,000 - 999,999 puntos
                                            </p>
                                        </div>
                                        {pointsLifetime >= 300000 &&
                                            pointsLifetime < 1000000 && (
                                                <span className="ml-auto text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                                                    Tu nivel
                                                </span>
                                            )}
                                    </div>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>✓ Todo lo de Moover</li>
                                        <li>✓ 5% OFF en envíos</li>
                                        <li>✓ Sorteos exclusivos</li>
                                    </ul>
                                </div>

                                {/* Leyenda */}
                                <div
                                    className={`rounded-xl p-4 border-2 ${
                                        pointsLifetime >= 1000000
                                            ? "border-pink-500 bg-pink-50"
                                            : "border-gray-200 bg-gray-50"
                                    }`}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-3xl">👑</span>
                                        <div>
                                            <p className="font-bold text-gray-900">Leyenda</p>
                                            <p className="text-xs text-gray-500">
                                                1,000,000+ puntos
                                            </p>
                                        </div>
                                        {pointsLifetime >= 1000000 && (
                                            <span className="ml-auto text-xs bg-pink-500 text-white px-2 py-0.5 rounded-full font-bold">
                                                Tu nivel
                                            </span>
                                        )}
                                    </div>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>✓ Todo lo de Pro</li>
                                        <li>✓ Envíos gratis en pedidos +$20k</li>
                                        <li>✓ Atención prioritaria 24/7</li>
                                    </ul>
                                </div>

                                <p className="text-xs text-gray-400 text-center pt-4">
                                    Los niveles se calculan con los puntos totales acumulados
                                    (no se restan al canjear)
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Monthly Stats Modal */}
                {showStatsModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                        onClick={() => setShowStatsModal(false)}
                    >
                        <div
                            className="w-full max-w-lg bg-white rounded-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-4 flex items-center justify-between border-b border-gray-100 rounded-t-2xl">
                                <h3 className="text-lg font-bold text-gray-900">
                                    Puntos por Referidos
                                </h3>
                                <button
                                    onClick={() => setShowStatsModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="p-4 space-y-4">
                                {/* This month */}
                                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-amber-800">
                                            {currentMonthName
                                                ? currentMonthName.charAt(0).toUpperCase() +
                                                currentMonthName.slice(1)
                                                : "Este mes"}
                                        </span>
                                        <span className="text-2xl font-bold text-amber-600">
                                            +{monthlyPointsFromReferrals}
                                        </span>
                                    </div>
                                    <p className="text-xs text-amber-700">
                                        {monthlyFriendsInvited} amigos invitados este mes
                                    </p>
                                    <div className="mt-3 pt-3 border-t border-amber-200">
                                        <p className="text-xs text-amber-600">
                                            Puntos ganados por referidos este mes
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
