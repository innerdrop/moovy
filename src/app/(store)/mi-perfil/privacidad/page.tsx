"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
    ArrowLeft,
    Shield,
    Download,
    Mail,
    Check,
    AlertCircle,
    Loader2,
    Clock,
    Trash2,
    FileText,
    Cookie,
} from "lucide-react";

interface ConsentHistoryItem {
    id: string;
    consentType: string;
    version: string;
    action: string;
    acceptedAt: string;
    ipAddress: string | null;
    userAgent: string | null;
    details: string | null;
}

interface PrivacyState {
    current: {
        terms: { version: string | null; acceptedAt: string | null; latest: string; upToDate: boolean };
        privacy: { version: string | null; acceptedAt: string | null; latest: string; upToDate: boolean };
        marketing: { active: boolean; acceptedAt: string | null; revokedAt: string | null; version: string };
        cookies: { preferences: string | null; acceptedAt: string | null; version: string };
        age18Confirmed: boolean;
    };
    history: ConsentHistoryItem[];
}

function formatDate(iso: string | null | undefined) {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleString("es-AR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return iso;
    }
}

function actionLabel(action: string) {
    switch (action) {
        case "ACCEPT":
            return { label: "Aceptó", color: "bg-green-50 text-green-700" };
        case "REVOKE":
            return { label: "Revocó", color: "bg-amber-50 text-amber-700" };
        case "UPDATE":
            return { label: "Actualizó", color: "bg-blue-50 text-blue-700" };
        default:
            return { label: action, color: "bg-gray-50 text-gray-700" };
    }
}

function consentTypeLabel(type: string) {
    switch (type) {
        case "TERMS":
            return "Términos y Condiciones";
        case "PRIVACY":
            return "Política de Privacidad";
        case "MARKETING":
            return "Comunicaciones de marketing";
        case "COOKIES":
            return "Cookies";
        default:
            return type;
    }
}

export default function PrivacyPage() {
    const [data, setData] = useState<PrivacyState | null>(null);
    const [loading, setLoading] = useState(true);
    const [togglingMarketing, setTogglingMarketing] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        try {
            const res = await fetch("/api/profile/privacy");
            if (res.ok) {
                setData(await res.json());
            } else {
                setError("No pudimos cargar tus datos de privacidad.");
            }
        } catch {
            setError("Error de conexión.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const toggleMarketing = async () => {
        if (!data) return;
        setTogglingMarketing(true);
        setError(null);
        setSuccess(null);
        try {
            const res = await fetch("/api/profile/privacy", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ marketingConsent: !data.current.marketing.active }),
            });
            if (res.ok) {
                setSuccess(
                    data.current.marketing.active
                        ? "Revocaste tu consentimiento de marketing."
                        : "Aceptaste recibir comunicaciones de marketing."
                );
                await load();
            } else {
                const err = await res.json().catch(() => ({}));
                setError(err.error || "Error al actualizar.");
            }
        } catch {
            setError("Error de conexión.");
        } finally {
            setTogglingMarketing(false);
            setTimeout(() => setSuccess(null), 4000);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        setError(null);
        try {
            const res = await fetch("/api/profile/export-data");
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                setError(err.error || "No se pudo generar la exportación.");
                return;
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const contentDisposition = res.headers.get("Content-Disposition") || "";
            const match = /filename="?([^";]+)"?/i.exec(contentDisposition);
            const filename = match?.[1] || `moovy-datos-${Date.now()}.json`;
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setSuccess("Archivo descargado. Revisalo en tu carpeta de Descargas.");
        } catch {
            setError("Error al descargar el archivo.");
        } finally {
            setExporting(false);
            setTimeout(() => setSuccess(null), 6000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#e60012] animate-spin" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <p className="text-gray-700 mb-4">{error || "No pudimos cargar tus datos."}</p>
                    <button
                        onClick={load}
                        className="px-4 py-2 bg-[#e60012] text-white rounded-xl text-sm font-medium"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    const marketingActive = data.current.marketing.active;

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-4 lg:px-6 xl:px-8 py-4 lg:py-6 sticky top-0 z-10">
                <div className="max-w-md mx-auto lg:max-w-4xl flex items-center gap-3">
                    <Link href="/mi-perfil" className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <h1 className="font-bold text-lg text-gray-900">Privacidad y Datos</h1>
                </div>
            </div>

            <div className="max-w-md mx-auto lg:max-w-4xl px-4 lg:px-6 xl:px-8 py-6 lg:py-8 space-y-6">
                {/* Banner legal */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5">
                    <div className="flex items-start gap-3">
                        <Shield className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h2 className="font-bold text-gray-900 mb-1">Tus derechos ARCO</h2>
                            <p className="text-sm text-gray-700">
                                En cumplimiento de la <strong>Ley 25.326</strong> tenés derecho a <strong>Acceder</strong>,{" "}
                                <strong>Rectificar</strong>, <strong>Cancelar</strong> y <strong>Oponerte</strong> al
                                tratamiento de tus datos personales. Acá podés ejercerlos.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mensajes flotantes */}
                {success && (
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <p className="text-sm text-green-700 font-medium">{success}</p>
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {/* Sección: Exportar datos */}
                <section className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                            <Download className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900">Exportar tus datos</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Descargá un archivo JSON con todos tus datos almacenados: perfil, pedidos, puntos,
                                direcciones, consentimientos y referidos. Ejercé tu derecho de <strong>acceso y portabilidad</strong>{" "}
                                (Art. 14 y 19 bis Ley 25.326).
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="w-full sm:w-auto px-5 py-3 bg-[#e60012] text-white rounded-xl font-semibold hover:bg-[#cc000f] transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {exporting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generando…
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                Descargar mis datos (JSON)
                            </>
                        )}
                    </button>
                </section>

                {/* Sección: Consentimientos */}
                <section className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900">Consentimientos vigentes</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Estos son los documentos que aceptaste al registrarte. Si se actualiza una versión te
                                vamos a pedir que la revises.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div>
                                <p className="text-sm font-medium text-gray-800">Términos y Condiciones</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    v{data.current.terms.version || "—"} · {formatDate(data.current.terms.acceptedAt)}
                                </p>
                            </div>
                            {data.current.terms.upToDate ? (
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-lg">Al día</span>
                            ) : (
                                <Link href="/terminos" className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-lg">
                                    Revisar v{data.current.terms.latest}
                                </Link>
                            )}
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div>
                                <p className="text-sm font-medium text-gray-800">Política de Privacidad</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    v{data.current.privacy.version || "—"} · {formatDate(data.current.privacy.acceptedAt)}
                                </p>
                            </div>
                            {data.current.privacy.upToDate ? (
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-lg">Al día</span>
                            ) : (
                                <Link href="/privacidad" className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-lg">
                                    Revisar v{data.current.privacy.latest}
                                </Link>
                            )}
                        </div>

                        <div className="p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p className="text-sm font-medium text-gray-800">Comunicaciones de marketing</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {marketingActive
                                            ? `Activas desde ${formatDate(data.current.marketing.acceptedAt)}`
                                            : data.current.marketing.revokedAt
                                            ? `Revocadas el ${formatDate(data.current.marketing.revokedAt)}`
                                            : "No aceptadas"}
                                    </p>
                                </div>
                                <button
                                    onClick={toggleMarketing}
                                    disabled={togglingMarketing}
                                    className={`px-4 py-2 text-xs rounded-lg font-semibold transition flex items-center gap-2 disabled:opacity-50 ${
                                        marketingActive
                                            ? "bg-red-50 text-red-700 hover:bg-red-100"
                                            : "bg-[#e60012] text-white hover:bg-[#cc000f]"
                                    }`}
                                >
                                    {togglingMarketing && <Loader2 className="w-3 h-3 animate-spin" />}
                                    {marketingActive ? "Revocar" : "Activar"}
                                </button>
                            </div>
                            <p className="text-[11px] text-gray-500 leading-snug">
                                Marketing opt-in: solo si lo activás te enviamos novedades, promos y cupones por email/push.
                                Podés revocarlo cuando quieras sin afectar tu cuenta (Ley 26.951 "No Llame").
                            </p>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-2">
                                <Cookie className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-800">Preferencias de cookies</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {data.current.cookies.preferences
                                            ? `Configurado · ${formatDate(data.current.cookies.acceptedAt)}`
                                            : "Sin configurar"}
                                    </p>
                                </div>
                            </div>
                            <Link href="/cookies" className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-lg">
                                Ver detalle
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Sección: Historial de consentimientos */}
                <section className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900">Historial de consentimientos</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Auditable. Cada aceptación o revocación queda registrada con fecha, IP y navegador
                                (últimos 50 eventos).
                            </p>
                        </div>
                    </div>

                    {data.history.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-6">Sin eventos registrados todavía.</p>
                    ) : (
                        <ul className="space-y-2">
                            {data.history.map((item) => {
                                const { label, color } = actionLabel(item.action);
                                return (
                                    <li key={item.id} className="p-3 bg-gray-50 rounded-xl">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${color}`}>
                                                {label}
                                            </span>
                                            <span className="text-sm font-medium text-gray-800">
                                                {consentTypeLabel(item.consentType)}
                                            </span>
                                            <span className="text-[11px] text-gray-500">v{item.version}</span>
                                        </div>
                                        <p className="text-[11px] text-gray-500">
                                            {formatDate(item.acceptedAt)}
                                            {item.ipAddress ? ` · IP ${item.ipAddress}` : ""}
                                        </p>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>

                {/* Sección: Contacto DPO */}
                <section className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 flex-shrink-0">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Contacto Oficial de Protección de Datos</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Si necesitás rectificar un dato que no podés modificar solo/a, escribinos:
                            </p>
                        </div>
                    </div>
                    <a
                        href="mailto:privacidad@somosmoovy.com"
                        className="inline-flex items-center gap-2 text-[#e60012] font-medium text-sm"
                    >
                        <Mail className="w-4 h-4" />
                        privacidad@somosmoovy.com
                    </a>
                </section>

                {/* Sección: Eliminar cuenta */}
                <section className="bg-red-50 border border-red-200 rounded-2xl p-5">
                    <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                            <Trash2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Eliminar mi cuenta</h3>
                            <p className="text-sm text-gray-700 mt-1">
                                Ejercé tu derecho de <strong>cancelación</strong>. Anonimizamos tus datos personales
                                manteniendo los registros fiscales obligatorios por ley.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/mi-perfil/datos"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-red-300 text-red-700 rounded-xl font-semibold text-sm hover:bg-red-50"
                    >
                        <Trash2 className="w-4 h-4" />
                        Ir a eliminar cuenta
                    </Link>
                </section>
            </div>
        </div>
    );
}
