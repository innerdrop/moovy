"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "@/store/toast";
import {
    UserPlus,
    Copy,
    Check,
    Share2,
    Users,
    Gift,
    ArrowLeft,
    Loader2,
    QrCode,
    X,
    Download,
    Star,
} from "lucide-react";

interface Friend {
    id: string;
    name: string;
    pointsEarned: number;
    joinedAt: string;
}

interface ReferralStats {
    referralCode: string;
    friendsInvited: number;
    pointsFromReferrals: number;
    recentReferrals: {
        id: string;
        createdAt: string;
        referrerPoints: number;
        refereeName: string;
    }[];
}

interface FriendsData {
    friends: Friend[];
    stats: {
        monthly: { friendsCount: number; pointsEarned: number; monthName: string };
        total: { friendsCount: number; pointsEarned: number };
    };
}

export default function InvitarAmigosPage() {
    const { data: session, status: authStatus } = useSession();
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const qrRef = useRef<HTMLDivElement>(null);

    // Data
    const [referralCode, setReferralCode] = useState("");
    const [referralLink, setReferralLink] = useState("");
    const [stats, setStats] = useState<ReferralStats | null>(null);
    const [friendsData, setFriendsData] = useState<FriendsData | null>(null);

    // QR code - dynamic import to avoid SSR issues
    const [QRComponent, setQRComponent] = useState<any>(null);

    useEffect(() => {
        import("qrcode.react").then((mod) => {
            setQRComponent(() => mod.QRCodeSVG);
        });
    }, []);

    useEffect(() => {
        if (authStatus === "authenticated") {
            loadData();
        } else if (authStatus === "unauthenticated") {
            setLoading(false);
        }
    }, [authStatus]);

    useEffect(() => {
        if (referralCode && typeof window !== "undefined") {
            setReferralLink(`${window.location.origin}/registro?ref=${referralCode}`);
        }
    }, [referralCode]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsRes, friendsRes] = await Promise.all([
                fetch("/api/referrals"),
                fetch("/api/moover/friends"),
            ]);

            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data);
                setReferralCode(data.referralCode || "");
            }

            if (friendsRes.ok) {
                const data = await friendsRes.json();
                setFriendsData(data);
            }
        } catch {
            toast.error("Error al cargar datos de referidos");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(referralLink);
            setCopied(true);
            toast.success("Link copiado al portapapeles");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("No se pudo copiar el link");
        }
    };

    const handleShareWhatsApp = () => {
        const text = `Te invito a probar MOOVY, la app de delivery y marketplace de Ushuaia. Registrate con mi link y ganás puntos de bienvenida: ${referralLink}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    };

    const handleShareNative = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "MOOVY - Invitá a tus amigos",
                    text: "Registrate en MOOVY con mi link y ganás puntos de bienvenida",
                    url: referralLink,
                });
            } catch {
                // User cancelled
            }
        } else {
            handleCopy();
        }
    };

    const handleDownloadQR = () => {
        if (!qrRef.current) return;
        const svg = qrRef.current.querySelector("svg");
        if (!svg) return;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const img = new Image();
        img.onload = () => {
            canvas.width = 512;
            canvas.height = 512;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, 512, 512);
            ctx.drawImage(img, 0, 0, 512, 512);
            const a = document.createElement("a");
            a.download = `moovy-invitacion-${referralCode}.png`;
            a.href = canvas.toDataURL("image/png");
            a.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    };

    if (authStatus === "unauthenticated") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium mb-2">Iniciá sesión para invitar amigos</p>
                    <Link href="/login" className="text-[#e60012] font-semibold text-sm">
                        Iniciar Sesión
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#e60012] via-[#ff2a3a] to-[#ff6b6b] text-white pt-8 pb-10 px-4">
                <div className="max-w-md mx-auto">
                    <Link href="/mi-perfil" className="inline-flex items-center gap-1 text-white/80 text-sm mb-4 hover:text-white transition">
                        <ArrowLeft className="w-4 h-4" />
                        Mi Perfil
                    </Link>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                            <UserPlus className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Invitá Amigos</h1>
                            <p className="text-white/80 text-sm">Ganá puntos MOOVER por cada amigo</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 -mt-4 space-y-4">

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 text-[#e60012] animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
                                <Users className="w-5 h-5 text-[#e60012] mx-auto mb-1" />
                                <p className="text-xl font-bold text-gray-900">
                                    {stats?.friendsInvited || 0}
                                </p>
                                <p className="text-[10px] text-gray-400">Amigos invitados</p>
                            </div>
                            <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
                                <Star className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                                <p className="text-xl font-bold text-gray-900">
                                    {stats?.pointsFromReferrals || 0}
                                </p>
                                <p className="text-[10px] text-gray-400">Puntos ganados</p>
                            </div>
                            <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
                                <Gift className="w-5 h-5 text-green-500 mx-auto mb-1" />
                                <p className="text-xl font-bold text-gray-900">
                                    {friendsData?.stats.monthly.friendsCount || 0}
                                </p>
                                <p className="text-[10px] text-gray-400">Este mes</p>
                            </div>
                        </div>

                        {/* Referral Code Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <h3 className="text-sm font-bold text-gray-900 mb-1">Tu código de referido</h3>
                            <p className="text-xs text-gray-400 mb-3">Compartí este link y tu amigo recibe puntos de bienvenida</p>

                            {/* Code display */}
                            <div className="bg-gray-50 rounded-xl p-3 mb-3 flex items-center justify-between border border-gray-100">
                                <code className="text-sm font-mono font-bold text-gray-700 truncate flex-1">
                                    {referralCode || "..."}
                                </code>
                                <button
                                    onClick={handleCopy}
                                    className="ml-2 p-2 hover:bg-gray-200 rounded-lg transition"
                                    title="Copiar link"
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <Copy className="w-4 h-4 text-gray-500" />
                                    )}
                                </button>
                            </div>

                            {/* Link display */}
                            <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100">
                                <p className="text-xs text-gray-500 truncate">{referralLink || "..."}</p>
                            </div>

                            {/* Share buttons */}
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={handleShareWhatsApp}
                                    className="flex flex-col items-center gap-1 py-3 px-2 bg-green-50 hover:bg-green-100 rounded-xl transition text-green-700"
                                >
                                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                    <span className="text-[10px] font-medium">WhatsApp</span>
                                </button>
                                <button
                                    onClick={() => setShowQR(true)}
                                    className="flex flex-col items-center gap-1 py-3 px-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition text-gray-700"
                                >
                                    <QrCode className="w-5 h-5" />
                                    <span className="text-[10px] font-medium">Código QR</span>
                                </button>
                                <button
                                    onClick={handleShareNative}
                                    className="flex flex-col items-center gap-1 py-3 px-2 bg-blue-50 hover:bg-blue-100 rounded-xl transition text-blue-700"
                                >
                                    <Share2 className="w-5 h-5" />
                                    <span className="text-[10px] font-medium">Compartir</span>
                                </button>
                            </div>
                        </div>

                        {/* How it works */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <h3 className="text-sm font-bold text-gray-900 mb-3">Cómo funciona</h3>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-full bg-[#e60012] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">Compartí tu link</p>
                                        <p className="text-xs text-gray-400">Envialo por WhatsApp, redes o donde quieras</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-full bg-[#e60012] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">Tu amigo se registra</p>
                                        <p className="text-xs text-gray-400">Se crea una cuenta con tu código de referido</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-full bg-[#e60012] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">Los dos ganan puntos</p>
                                        <p className="text-xs text-gray-400">Tu amigo recibe 100 puntos y vos ganás 50</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Friends list */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-gray-900">Amigos invitados</h3>
                                {friendsData && friendsData.friends.length > 0 && (
                                    <span className="text-xs text-gray-400">{friendsData.friends.length} total</span>
                                )}
                            </div>

                            {!friendsData || friendsData.friends.length === 0 ? (
                                <div className="text-center py-6">
                                    <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                                    <p className="text-sm text-gray-400">Todavía no invitaste a nadie</p>
                                    <p className="text-xs text-gray-300 mt-1">Compartí tu link y empezá a ganar puntos</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {friendsData.friends.map((friend) => (
                                        <div key={friend.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold">
                                                    {friend.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">{friend.name}</p>
                                                    <p className="text-[10px] text-gray-400">
                                                        {new Date(friend.joinedAt).toLocaleDateString("es-AR", {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                                +{friend.pointsEarned} pts
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* QR Modal */}
            {showQR && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">Tu código QR</h3>
                            <button
                                onClick={() => setShowQR(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 flex flex-col items-center gap-4" ref={qrRef}>
                            {QRComponent && referralLink ? (
                                <QRComponent
                                    value={referralLink}
                                    size={220}
                                    level="M"
                                    fgColor="#e60012"
                                    bgColor="#ffffff"
                                />
                            ) : (
                                <div className="w-[220px] h-[220px] bg-gray-100 rounded-lg flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                                </div>
                            )}
                            <p className="text-xs text-gray-400 text-center">
                                Escaneá este código para registrarse con tu referido
                            </p>
                            <button
                                onClick={handleDownloadQR}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition text-sm font-medium text-gray-700"
                            >
                                <Download className="w-4 h-4" />
                                Descargar QR
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
