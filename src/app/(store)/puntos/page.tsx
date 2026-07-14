"use client";

// Points Page - Mis Puntos / MOOVER Dashboard
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { formatPrice } from "@/lib/delivery";
import { toast } from "@/store/toast";
import AnimateIn from "@/components/ui/AnimateIn";
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
    Info,
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

// ISSUE-045: Definiciones visuales de los niveles Biblia v3.
// El backend devuelve solo el name (MOOVER/SILVER/GOLD/BLACK); acá mapeamos a ícono + copy.
const LEVEL_VISUALS: Record<string, { icon: string; label: string; nextIcon?: string; nextLabel?: string }> = {
    MOOVER: { icon: "🚀", label: "MOOVER", nextIcon: "🥈", nextLabel: "SILVER" },
    SILVER: { icon: "🥈", label: "SILVER", nextIcon: "🥇", nextLabel: "GOLD" },
    GOLD: { icon: "🥇", label: "GOLD", nextIcon: "👑", nextLabel: "BLACK" },
    BLACK: { icon: "👑", label: "BLACK" },
};

interface UserLevelData {
    level: "MOOVER" | "SILVER" | "GOLD" | "BLACK";
    ordersInWindow: number;
    earnMultiplier: number;
    nextLevel: "MOOVER" | "SILVER" | "GOLD" | "BLACK" | null;
    ordersToNextLevel: number;
}

interface PointsConfigData {
    pointsValue: number;
    minPointsToRedeem: number;
    maxDiscountPercent: number;
}

// Rama fix/restaurar-moover-y-marketplace-sin-flags (2026-05-17):
// MOOVER (sistema de puntos) forma parte del producto core y no debería
// estar detrás de un feature flag. Antes había un FeatureFlagGuard que
// ocultaba la página si buyer.puntos-moover estaba OFF — eso fue un
// over-reach del sistema de flags. La página ahora siempre carga.
export default function PuntosPage() {
    const { data: session, status: authStatus } = useSession();
    const [balance, setBalance] = useState(0);
    const [pointsLifetime, setPointsLifetime] = useState(0);
    const [redeemableValue, setRedeemableValue] = useState(0);
    const [history, setHistory] = useState<PointsTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    // ISSUE-045: nivel dinamico + config para progress bar y bloque explicativo.
    const [userLevel, setUserLevel] = useState<UserLevelData | null>(null);
    const [pointsConfig, setPointsConfig] = useState<PointsConfigData | null>(null);
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
                // ISSUE-045: guardar nivel dinamico + config
                if (data.userLevel) {
                    setUserLevel(data.userLevel);
                }
                if (data.config) {
                    setPointsConfig(data.config);
                }
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
        const shareText = `¡Unite a Moovy! Usá mi código ${referralCode} y ganá 2.500 puntos de regalo. #SoyMoover`;
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
                {/* HERO — el bono de bienvenida es el titular (estrategia de conversión). */}
                <section className="relative overflow-hidden bg-gradient-to-br from-[#a3000c] via-[#e60012] to-[#ff1a2e] text-white px-5 pt-14 pb-20 lg:pt-20 lg:pb-24">
                    <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-white/[0.08] blur-3xl pointer-events-none" />
                    <div className="relative max-w-2xl mx-auto text-center">
                        <span className="inline-block bg-white/15 text-white text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-5">
                            Programa MOOVER
                        </span>
                        <h1 className="text-4xl lg:text-5xl font-black leading-tight mb-4">
                            Registrate gratis y arrancá con{" "}
                            <span className="text-yellow-300">$2.500</span>{" "}
                            para tu primer pedido
                        </h1>
                        <p className="text-lg text-white/85 mb-8 max-w-xl mx-auto">
                            2.500 puntos de bienvenida, y cada compra suma más. En MOOVY tu plata rinde el doble.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                href="/empezar"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#e60012] font-black rounded-xl hover:bg-gray-100 transition active:scale-95 shadow-lg"
                            >
                                <UserPlus className="w-5 h-5" />
                                Quiero mis $2.500
                            </Link>
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center px-8 py-4 bg-white/15 text-white font-bold rounded-xl hover:bg-white/25 transition border border-white/25"
                            >
                                Ya tengo cuenta
                            </Link>
                        </div>
                        <p className="text-white/60 text-xs mt-4">
                            Los 2.500 puntos se activan con tu primer pedido.
                        </p>
                    </div>
                </section>

                {/* URGENCIA — boost de lanzamiento ×2 (FOMO). Debe coincidir con el config real. */}
                <section className="px-5 -mt-10 relative z-10">
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-yellow-400 text-yellow-950 rounded-2xl px-5 py-4 flex items-center justify-center gap-3 shadow-[0_12px_30px_rgba(0,0,0,0.14)] font-black text-center text-sm sm:text-base">
                            <span className="text-2xl">⚡</span>
                            <span>Semana de lanzamiento: <span className="underline decoration-2">×2 puntos</span> en cada pedido. Por tiempo limitado.</span>
                        </div>
                    </div>
                </section>

                {/* How it Works Section */}
                <AnimateIn animation="reveal">
                <section className="px-4 py-8 bg-gray-50 border-t border-gray-100">
                    <div className="max-w-4xl mx-auto">
                        <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-[#e60012]">Simple y automático</p>
                        <h2 className="text-2xl lg:text-3xl font-black text-gray-900 mb-6">
                            Cómo funciona
                        </h2>
                        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
                            {[
                                { n: 1, Icon: ShoppingBag, title: "Comprá", desc: "Cada pedido suma puntos, sin que hagas nada.", hl: "10 pts por cada $1.000" },
                                { n: 2, Icon: Star, title: "Acumulá", desc: "Tus puntos valen plata de verdad.", hl: "1 punto = $1" },
                                { n: 3, Icon: Gift, title: "Canjeá", desc: "Usalos como descuento en tu próximo pedido.", hl: "Hasta 50% off" },
                            ].map(({ n, Icon, title, desc, hl }) => (
                                <div key={n} className="relative flex sm:flex-col items-start gap-4 sm:gap-0 bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
                                    <span className="absolute top-3 right-4 text-2xl font-black text-gray-100 select-none">0{n}</span>
                                    <div className="w-12 h-12 rounded-xl bg-[#e60012]/10 flex items-center justify-center flex-shrink-0 sm:mb-3">
                                        <Icon className="w-5 h-5 text-[#e60012]" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base font-black text-gray-900 mb-1">{title}</h3>
                                        <p className="text-sm text-gray-500 leading-snug mb-2.5">{desc}</p>
                                        <span className="inline-block text-xs font-black text-[#e60012] bg-[#e60012]/[0.08] px-2.5 py-1 rounded-full">{hl}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                </AnimateIn>

                {/* Example Section */}
                <AnimateIn animation="reveal">
                <section className="px-4 py-8">
                    <div className="max-w-3xl mx-auto">
                        <div className="mb-2 flex items-center gap-2">
                            <span className="h-px w-6 bg-[#e60012]" />
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#e60012]">Hagamos números</p>
                        </div>
                        <h2 className="text-2xl lg:text-3xl font-black text-gray-900 mb-5">
                            Un ejemplo real
                        </h2>
                        <div className="relative overflow-hidden rounded-3xl border border-red-100 bg-gradient-to-br from-red-50 to-white p-6 lg:p-7 shadow-sm">
                            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#e60012]/10 blur-3xl" />
                            <div className="relative grid gap-3 sm:grid-cols-3 sm:gap-4">
                                <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-sm">
                                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-gray-400">Comprás</p>
                                    <p className="text-2xl font-black text-gray-900">$8.000</p>
                                    <p className="mt-1 text-xs text-gray-400">tu pedido de la semana</p>
                                </div>
                                <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-sm">
                                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-gray-400">Ganás</p>
                                    <p className="text-2xl font-black text-[#e60012]">80 pts</p>
                                    <p className="mt-1 text-xs text-gray-400">10 pts por cada $1.000</p>
                                </div>
                                <div className="rounded-2xl bg-[#e60012] p-4 shadow-sm">
                                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-white/70">Descontás</p>
                                    <p className="text-2xl font-black text-white">$80</p>
                                    <p className="mt-1 text-xs text-white/60">1 punto = $1</p>
                                </div>
                            </div>
                            <div className="relative mt-5 flex items-center justify-center gap-2">
                                <Sparkles className="h-4 w-4 text-[#e60012]" />
                                <p className="font-black text-gray-900">$80 listos para tu próximo pedido</p>
                            </div>
                        </div>
                    </div>
                </section>
                </AnimateIn>

                {/* Bonuses Section */}
                <AnimateIn animation="reveal">
                <section className="px-4 py-8 bg-gray-50 border-t border-gray-100">
                    <div className="max-w-4xl mx-auto">
                        <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-[#7C3AED]">Regalos para vos</p>
                        <h2 className="text-2xl lg:text-3xl font-black text-gray-900 mb-6">
                            Bonos extra
                        </h2>
                        <div className="grid gap-4 lg:grid-cols-3">
                            {/* Welcome — bono protagonista */}
                            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#e60012] to-[#ff3547] p-6 text-white shadow-lg shadow-red-500/20 lg:col-span-2">
                                <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
                                <div className="pointer-events-none absolute right-6 bottom-4 text-[110px] leading-none opacity-10 select-none">🎁</div>
                                <div className="relative">
                                    <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider backdrop-blur-sm">
                                        <Gift className="h-3.5 w-3.5" /> Bono de bienvenida
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="text-5xl lg:text-6xl font-black leading-none tracking-tight">2.500</span>
                                        <span className="mb-1.5 text-xl font-black">pts</span>
                                    </div>
                                    <p className="mt-3 text-base font-black">= $2.500 en descuentos para tu primer pedido</p>
                                    <p className="mt-1 text-sm text-white/75">Se activan con tu primer pedido.</p>
                                </div>
                            </div>
                            {/* Columna de apoyo — referido */}
                            <div className="grid gap-4">
                                {/* Referral */}
                                <div className="relative overflow-hidden rounded-3xl border border-violet-100 bg-white p-5 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#7C3AED] text-white shadow-sm">
                                            <Users className="h-6 w-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xl font-black text-[#7C3AED] leading-none">3.500 pts</p>
                                            <p className="mt-1 text-sm font-black text-gray-900">Por cada amigo</p>
                                        </div>
                                    </div>
                                    <p className="mt-3 text-xs leading-snug text-gray-500">Cuando hace su primera compra. Tu amigo también se lleva 2.500 pts.</p>
                                    <p className="mt-2 text-xs font-black text-[#7C3AED]">+ 1.000 pts cada 10 pedidos que haga tu amigo, ¡de por vida!</p>
                                </div>
                                {/* Reseña */}
                                <div className="relative overflow-hidden rounded-3xl border border-amber-100 bg-white p-5 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm">
                                            <Star className="h-6 w-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xl font-black text-amber-600 leading-none">1.000 pts</p>
                                            <p className="mt-1 text-sm font-black text-gray-900">Por cada reseña</p>
                                        </div>
                                    </div>
                                    <p className="mt-3 text-xs leading-snug text-gray-500">Después de recibir tu pedido, contanos qué te pareció.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                </AnimateIn>

                {/* Levels Section */}
                <AnimateIn animation="reveal">
                <section className="px-4 py-8">
                    <div className="max-w-4xl mx-auto">
                        <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-amber-500">Tu estatus MOOVER</p>
                        <h2 className="text-2xl lg:text-3xl font-black text-gray-900 mb-1">
                            Subí de nivel, <span className="text-amber-500">ganá más</span>
                        </h2>
                        <p className="text-gray-500 mb-5">
                            Cuanto más pedís, más rinde cada peso. Deslizá para ver los niveles.
                        </p>
                        <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pt-1 pb-3 -mr-4 pr-4 lg:mr-0 lg:pr-0">
                            {[
                                { emoji: "🚀", tag: "Inicial", name: "MOOVER", req: "Arrancás acá, sin pedidos", rate: "10", card: "bg-blue-50 border-blue-100", nameC: "text-gray-900", rateC: "text-blue-600", muted: "text-blue-400" },
                                { emoji: "🥈", tag: "Silver", name: "MOOVER SILVER", req: "3 pedidos en 90 días", rate: "12,5", card: "bg-gray-50 border-gray-200", nameC: "text-gray-900", rateC: "text-gray-600", muted: "text-gray-400" },
                                { emoji: "🥇", tag: "Gold", name: "MOOVER GOLD", req: "10 pedidos en 90 días", rate: "15", card: "bg-amber-50 border-amber-200", nameC: "text-gray-900", rateC: "text-amber-600", muted: "text-amber-500" },
                                { emoji: "👑", tag: "Máximo", name: "MOOVER BLACK", req: "22 pedidos en 90 días", rate: "20", card: "bg-gray-900 border-gray-800", nameC: "text-white", rateC: "text-yellow-400", muted: "text-gray-400" },
                            ].map((t) => (
                                <div key={t.name} className={`flex-shrink-0 w-[152px] snap-start rounded-2xl border p-4 shadow-sm ${t.card}`}>
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-2xl">{t.emoji}</span>
                                        <span className={`text-[10px] font-black uppercase tracking-wider ${t.muted}`}>{t.tag}</span>
                                    </div>
                                    <h3 className={`text-[15px] font-black leading-tight ${t.nameC}`}>{t.name}</h3>
                                    <p className={`mb-3 min-h-[32px] text-[11px] leading-snug ${t.muted}`}>{t.req}</p>
                                    <p className={`text-2xl font-black ${t.rateC}`}>{t.rate}</p>
                                    <p className={`text-[11px] ${t.muted}`}>pts por cada $1.000</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-gray-50 border border-gray-100 p-4">
                            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                            <p className="text-xs leading-relaxed text-gray-500">
                                <strong className="text-gray-700">Los pedidos se acumulan.</strong> Tu nivel se
                                mide por los pedidos entregados en los <strong className="text-gray-700">últimos 90 días</strong> (no es
                                por día ni por semana). Mientras sigas pidiendo, mantenés tu nivel; si dejás de
                                pedir, con el tiempo podés bajar.
                            </p>
                        </div>
                    </div>
                </section>
                </AnimateIn>

                {/* Program Details Section — reglas claras del programa */}
                <AnimateIn animation="reveal">
                <section className="px-4 py-8 bg-gray-50 border-t border-gray-100">
                    <div className="max-w-4xl mx-auto">
                        <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-gray-400">Transparencia total</p>
                        <h2 className="text-2xl lg:text-3xl font-black text-gray-900 mb-1">
                            El programa en detalle
                        </h2>
                        <p className="text-gray-500 mb-6">
                            Todo claro, sin letra chica escondida.
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {[
                                { emoji: "✅", title: "Ganás al recibir tu pedido", desc: "Los puntos se acreditan cuando el pedido queda entregado. Si cancelás, no se suman." },
                                { emoji: "💵", title: "1 punto = $1 de descuento", desc: "Canjeás desde 500 puntos y hasta el 50% de cada pedido. Vos elegís cuándo usarlos." },
                                { emoji: "📅", title: "Tu nivel mira los últimos 90 días", desc: "Los pedidos se acumulan en una ventana móvil de 90 días. No hay que hacerlos todos juntos." },
                                { emoji: "🤝", title: "Invitá y ganan los dos", desc: "Vos ganás 3.500 pts cuando tu amigo hace su primera compra. Él arranca con 2.500 pts." },
                                { emoji: "⚡", title: "×2 puntos de lanzamiento", desc: "Durante las primeras semanas todos tus puntos valen el doble. Aprovechá para arrancar fuerte." },
                                { emoji: "⏳", title: "Se mantienen si seguís pidiendo", desc: "Tus puntos quedan disponibles mientras uses Moovy. Pedí de vez en cuando y no los perdés." },
                            ].map((d) => (
                                <div key={d.title} className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                                    <span className="text-xl leading-none">{d.emoji}</span>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-black text-gray-900">{d.title}</h3>
                                        <p className="mt-1 text-xs leading-snug text-gray-500">{d.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                </AnimateIn>

                {/* CTA Final Section */}
                <section className="px-4 py-16 bg-gradient-to-r from-[#a3000c] via-[#e60012] to-[#ff1a2e] text-white">
                    <div className="max-w-2xl mx-auto text-center">
                        <h2 className="text-3xl lg:text-4xl font-black mb-4">
                            Sumate a los MOOVERS de Ushuaia
                        </h2>
                        <p className="text-xl text-white/90 mb-8">
                            Creá tu cuenta en 2 minutos y llevate $2.500 para tu primer pedido.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/empezar"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#e60012] font-bold rounded-xl hover:bg-gray-100 transition active:scale-95"
                            >
                                <UserPlus className="w-5 h-5" />
                                Registrarme y ganar $2.500
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
                <section className="px-4 pt-8 pb-4 text-center border-t border-gray-100">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#e60012]/[0.07] px-4 py-2 text-sm font-black text-[#e60012]">
                        Compartí tu experiencia con #SoyMoover
                    </span>
                </section>
            </div>
        );
    }

    // ========== MOOVER DASHBOARD PARA USUARIOS LOGUEADOS ==========
    return (
        <div className="pb-24 px-4">
            <div className="max-w-lg mx-auto">
                {/* MOOVER Hero Card */}
                <div className="bg-gradient-to-br from-[#a3000c] via-[#e60012] to-[#ff1a2e] rounded-2xl p-6 text-white relative overflow-hidden mt-4">
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

                        {/* ISSUE-045: Membership Level con progress bar al siguiente nivel */}
                        {(() => {
                            const lvlName = userLevel?.level ?? "MOOVER";
                            const visual = LEVEL_VISUALS[lvlName] ?? LEVEL_VISUALS.MOOVER;
                            const hasNext = userLevel?.nextLevel != null;
                            const nextVisual = hasNext && userLevel?.nextLevel ? LEVEL_VISUALS[userLevel.nextLevel] : null;
                            const orders = userLevel?.ordersInWindow ?? 0;
                            const ordersToNext = userLevel?.ordersToNextLevel ?? 0;
                            // Progress bar: pedidos actuales en la ventana vs pedidos que necesitaria para llegar al next
                            // Si esta en BLACK (nivel maximo) mostramos barra full.
                            const targetForNext = hasNext ? orders + ordersToNext : orders;
                            const progressPercent = hasNext
                                ? targetForNext > 0 ? Math.min(100, (orders / targetForNext) * 100) : 0
                                : 100;

                            return (
                                <button
                                    onClick={() => setShowLevelModal(true)}
                                    className="w-full bg-white/20 rounded-xl p-3 mb-4 hover:bg-white/30 transition active:scale-[0.98]"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-white/80">Tu nivel</span>
                                        <span className="font-bold text-lg flex items-center gap-1">
                                            {visual.icon} {visual.label}
                                        </span>
                                    </div>

                                    {/* Progress bar hacia el siguiente nivel */}
                                    {hasNext && nextVisual ? (
                                        <div className="mt-3">
                                            <div className="flex items-center justify-between text-[11px] text-white/80 mb-1">
                                                <span>
                                                    {orders} {orders === 1 ? "pedido" : "pedidos"} (90 días)
                                                </span>
                                                <span className="font-semibold">
                                                    {ordersToNext === 1
                                                        ? `Falta 1 para ${nextVisual.icon} ${nextVisual.label}`
                                                        : `Faltan ${ordersToNext} para ${nextVisual.icon} ${nextVisual.label}`}
                                                </span>
                                            </div>
                                            <div
                                                className="w-full h-2 bg-white/20 rounded-full overflow-hidden"
                                                role="progressbar"
                                                aria-valuenow={Math.round(progressPercent)}
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                                aria-label={`Progreso al siguiente nivel ${nextVisual.label}`}
                                            >
                                                <div
                                                    className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${progressPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-3">
                                            <div className="flex items-center gap-2 text-[11px] text-yellow-200 font-semibold">
                                                <Sparkles className="w-3.5 h-3.5" />
                                                Nivel máximo alcanzado. Seguí pidiendo para mantenerlo.
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-[10px] text-white/60 mt-2 text-left">
                                        Tu nivel se calcula por pedidos entregados en los últimos 90 días.
                                        Tocá para ver los niveles.
                                    </p>
                                </button>
                            );
                        })()}

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

                {/* ISSUE-045: Bloque destacado con la regla de canje (Biblia v3).
                    Le aclara al comprador en una mirada: cuánto vale un punto,
                    cuándo puede canjear y cuál es el tope. Evita la confusión
                    típica del primer canje ("¿500 pts son $500? ¿el descuento llega hasta todo el pedido?"). */}
                <div className="mt-4 bg-white rounded-2xl p-4 border border-amber-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="font-bold text-gray-900">Cómo funcionan tus puntos</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
                            <p className="text-[10px] uppercase tracking-wider text-amber-700 font-bold mb-1">Valor</p>
                            <p className="text-lg font-bold text-gray-900 leading-tight">
                                1 pt = ${pointsConfig?.pointsValue ?? 1}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-0.5">En el checkout</p>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
                            <p className="text-[10px] uppercase tracking-wider text-amber-700 font-bold mb-1">Mínimo</p>
                            <p className="text-lg font-bold text-gray-900 leading-tight">
                                {(pointsConfig?.minPointsToRedeem ?? 500).toLocaleString("es-AR")}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-0.5">Para canjear</p>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
                            <p className="text-[10px] uppercase tracking-wider text-amber-700 font-bold mb-1">Máximo</p>
                            <p className="text-lg font-bold text-gray-900 leading-tight">
                                {pointsConfig?.maxDiscountPercent ?? 50}%
                            </p>
                            <p className="text-[10px] text-gray-500 mt-0.5">Del subtotal</p>
                        </div>
                    </div>
                    {balance >= (pointsConfig?.minPointsToRedeem ?? 500) ? (
                        <p className="text-xs text-emerald-700 mt-3 flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" />
                            Ya podés canjear tus puntos en el próximo pedido.
                        </p>
                    ) : (
                        <p className="text-xs text-gray-500 mt-3">
                            Te faltan {((pointsConfig?.minPointsToRedeem ?? 500) - balance).toLocaleString("es-AR")} pts para empezar a canjear.
                        </p>
                    )}
                    {/* Dónde aplican los puntos: las dos aclaraciones que más evitan
                        confusión/reclamos, ahora visibles (antes solo en el desplegable). */}
                    <div className="mt-3 pt-3 border-t border-amber-100 space-y-1.5">
                        <p className="text-xs text-gray-500 flex items-start gap-1.5">
                            <ShoppingBag className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                            Se calculan sobre tus productos, no sobre el costo de envío.
                        </p>
                        <p className="text-xs text-gray-500 flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                            Se acreditan cuando recibís el pedido, no al pagar.
                        </p>
                    </div>
                </div>

                {/* Referral Code Section */}
                <div className="mt-4 bg-white rounded-xl p-4">
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
                        Compartí tu código y ganá 3.500 puntos por cada amigo que se
                        registre
                    </p>
                </div>

                {/* Referral Stats - Monthly */}
                <div className="mt-4 grid grid-cols-2 gap-3">
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
                <div className="mt-4">
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
                <div className="mt-6 bg-white rounded-xl p-4">
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
                                        Ganás puntos con cada compra
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
                                        <strong className="text-gray-900">Cómo se calcula:</strong> ganás
                                        10 puntos por cada $1.000 de compra.
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 text-xs">
                                        <li>Por ejemplo, $10.000 = 100 puntos ($100 en descuentos)</li>
                                        <li>Los puntos suben con tu nivel (hasta 20 puntos por $1.000 en BLACK)</li>
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
                                        3.500 puntos por cada amigo
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
                                        <li>Vos ganás 3.500 puntos cuando tu amigo hace su primera compra</li>
                                        <li>Tu amigo gana 2.500 puntos extras de bienvenida</li>
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
                                    2.500 puntos con tu primer pedido ✓
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* How to use points */}
                <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                    <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                        💳 Usá tus Puntos en el Checkout
                    </h3>
                    <p className="text-sm text-gray-600">
                        Al finalizar tu compra, elegí cuántos puntos querés usar para
                        obtener un descuento. ¡Cuantos más puntos uses, mayor será tu
                        ahorro!
                    </p>
                </div>

                {/* Transaction History */}
                <div className="mt-6">
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
                                Compartí tu código para que otros ganen 2.500 puntos
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
                                {/* MOOVER */}
                                <div className="rounded-xl p-4 border-2 border-blue-400 bg-blue-50">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-3xl">🚀</span>
                                        <div>
                                            <p className="font-bold text-gray-900">MOOVER</p>
                                            <p className="text-xs text-gray-500">Todos empiezan acá</p>
                                        </div>
                                    </div>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>✓ 10 puntos por cada $1,000 gastados</li>
                                        <li>✓ Descuentos hasta 50% del subtotal</li>
                                    </ul>
                                </div>

                                {/* SILVER */}
                                <div className="rounded-xl p-4 border-2 border-gray-300 bg-gray-50">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-3xl">🥈</span>
                                        <div>
                                            <p className="font-bold text-gray-900">MOOVER SILVER</p>
                                            <p className="text-xs text-gray-500">3 pedidos en 90 días</p>
                                        </div>
                                    </div>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>✓ 12.5 puntos por cada $1,000</li>
                                        <li>✓ Badge Silver en tu perfil</li>
                                    </ul>
                                </div>

                                {/* GOLD */}
                                <div className="rounded-xl p-4 border-2 border-yellow-300 bg-yellow-50">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-3xl">🥇</span>
                                        <div>
                                            <p className="font-bold text-gray-900">MOOVER GOLD</p>
                                            <p className="text-xs text-gray-500">10 pedidos en 90 días</p>
                                        </div>
                                    </div>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>✓ 15 puntos por cada $1,000</li>
                                        <li>✓ Badge Gold + soporte prioritario</li>
                                    </ul>
                                </div>

                                {/* BLACK */}
                                <div className="rounded-xl p-4 border-2 border-gray-800 bg-gray-900 text-white">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-3xl">👑</span>
                                        <div>
                                            <p className="font-bold text-white">MOOVER BLACK</p>
                                            <p className="text-xs text-gray-400">22 pedidos en 90 días</p>
                                        </div>
                                    </div>
                                    <ul className="text-sm text-gray-300 space-y-1">
                                        <li>✓ 20 puntos por cada $1,000</li>
                                        <li>✓ Badge Black + soporte VIP + eventos</li>
                                    </ul>
                                </div>

                                <p className="text-xs text-gray-400 text-center pt-4">
                                    Los niveles se calculan según pedidos entregados en los
                                    últimos 90 días. Si dejás de pedir, podés bajar de nivel.
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
