"use client";

import { useState, useEffect } from "react";
import { updateMerchant, toggleMerchantOpen } from "@/app/comercios/actions";
import { Loader2, Save, Power, DollarSign, Truck, ShoppingBag, Info, Percent, Link2, Unlink, AlertTriangle, CheckCircle, FileText, Eye, Lock, MessageSquare, X, Clock, XCircle } from "lucide-react";
import { confirm } from "@/store/confirm";
import { toast } from "@/store/toast";

type DocStatus = "PENDING" | "APPROVED" | "REJECTED";

interface ChangeRequest {
    id: string;
    documentField: string;
    documentLabel: string;
    reason: string;
    status: DocStatus;
    resolvedAt: string | null;
    resolutionNote: string | null;
    createdAt: string;
    updatedAt: string;
}

interface SettingsFormProps {
    merchant: {
        id: string;
        name: string;
        image: string;
        isOpen: boolean;
        deliveryTimeMin: number;
        deliveryTimeMax: number;
        deliveryFee: number;
        minOrderAmount: number;
        deliveryRadiusKm: number;
        allowPickup: boolean;
        commissionRate: number;
        mpEmail?: string | null;
        mpLinkedAt?: string | null;
        mpUserId?: string | null;
        cuit?: string | null;
        bankAccount?: string | null;
        constanciaAfipUrl?: string | null;
        habilitacionMunicipalUrl?: string | null;
        registroSanitarioUrl?: string | null;
        cuitStatus?: DocStatus;
        cuitRejectionReason?: string | null;
        bankAccountStatus?: DocStatus;
        bankAccountRejectionReason?: string | null;
        constanciaAfipStatus?: DocStatus;
        constanciaAfipRejectionReason?: string | null;
        habilitacionMunicipalStatus?: DocStatus;
        habilitacionMunicipalRejectionReason?: string | null;
        registroSanitarioStatus?: DocStatus;
        registroSanitarioRejectionReason?: string | null;
        approvalStatus: string;
        category?: string | null;
    };
}

export default function SettingsForm({ merchant }: SettingsFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isTogglingStore, setIsTogglingStore] = useState(false);
    const [isOpen, setIsOpen] = useState(merchant.isOpen);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [mpDisconnecting, setMpDisconnecting] = useState(false);
    const [mpEmail, setMpEmail] = useState(merchant.mpEmail || null);
    const [mpLinkedAt] = useState(merchant.mpLinkedAt || null);

    const handleSubmit = async (formData: FormData) => {
        const ok = await confirm({
            title: "Guardar cambios",
            message: "¿Querés guardar los cambios en la configuración operativa?",
            confirmLabel: "Guardar",
            cancelLabel: "Cancelar",
        });
        if (!ok) return;

        setIsLoading(true);
        setError("");
        formData.append("image", merchant.image);
        formData.append("name", merchant.name);
        const result = await updateMerchant(formData);
        if (result?.error) {
            toast.error(result.error);
            setError(result.error);
        } else {
            toast.success("Configuración guardada correctamente");
        }
        setIsLoading(false);
    };

    const handleToggleStore = async () => {
        setIsTogglingStore(true);
        const result = await toggleMerchantOpen(!isOpen);
        if (result?.success) {
            setIsOpen(result.isOpen ?? !isOpen);
        } else if (result?.error) {
            setError(result.error);
        }
        setIsTogglingStore(false);
    };

    const handleDisconnectMp = async () => {
        setMpDisconnecting(true);
        try {
            const res = await fetch("/api/mp/disconnect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "merchant" }),
            });
            if (res.ok) {
                setMpEmail(null);
                setSuccess("MercadoPago desvinculado correctamente");
                setTimeout(() => setSuccess(""), 3000);
            } else {
                setError("Error al desvincular MercadoPago");
            }
        } catch {
            setError("Error de conexión");
        } finally {
            setMpDisconnecting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Store Status Toggle */}
            <div className={`rounded-xl p-4 border flex items-center justify-between ${isOpen
                ? "bg-green-50 border-green-200"
                : "bg-gray-100 border-gray-200"
                }`}>
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOpen ? "bg-green-500" : "bg-gray-400"}`}>
                        <Power className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">{isOpen ? "Tienda Abierta" : "Tienda Cerrada"}</p>
                        <p className="text-sm text-gray-500">{isOpen ? "Recibiendo pedidos" : "No recibe pedidos"}</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleToggleStore}
                    disabled={isTogglingStore}
                    className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${isOpen
                        ? "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                        : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                >
                    {isTogglingStore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isOpen ? "Pausar Tienda" : "Abrir Tienda"}
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                    {error}
                </div>
            )}
            {success && (
                <div className="p-4 bg-green-50 text-green-600 rounded-xl text-sm font-medium border border-green-100">
                    {success}
                </div>
            )}

            {/* Delivery & Pickup Settings */}
            <form action={handleSubmit} className="space-y-6">
                {/* Hidden fields required by merchantSchema */}
                <input type="hidden" name="name" value={merchant.name} />
                <input type="hidden" name="image" value={merchant.image} />

                <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Truck className="w-5 h-5 text-blue-600" />
                        Entregas y Pedidos
                    </h2>

                    <div className="bg-blue-50 rounded-lg p-3 flex gap-2">
                        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-800">
                            El costo de envío se calcula automáticamente según la distancia entre tu comercio y el comprador. No necesitás configurar un precio fijo.
                        </p>
                    </div>

                    {/* Pickup toggle */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <ShoppingBag className="w-5 h-5 text-gray-600" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">Retiro en local</p>
                                <p className="text-xs text-gray-500">Permitir que los clientes retiren su pedido en tu comercio</p>
                            </div>
                        </div>
                        <label className="relative inline-flex cursor-pointer">
                            <input type="hidden" name="allowPickup" value="false" />
                            <input
                                type="checkbox"
                                name="allowPickup"
                                defaultChecked={merchant.allowPickup}
                                value="true"
                                className="sr-only peer"
                                disabled={isLoading}
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-checked:bg-green-500 rounded-full transition after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:shadow after:transition-transform peer-checked:after:translate-x-5" />
                        </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo de preparación (min)</label>
                            <div className="flex items-center gap-2">
                                <input name="deliveryTimeMin" type="number" min="5" defaultValue={merchant.deliveryTimeMin} className="input w-full" disabled={isLoading} placeholder="Mín" />
                                <span className="text-gray-400">a</span>
                                <input name="deliveryTimeMax" type="number" min="10" defaultValue={merchant.deliveryTimeMax} className="input w-full" disabled={isLoading} placeholder="Máx" />
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">Tiempo estimado para preparar un pedido</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Radio de entrega (km)</label>
                            <input name="deliveryRadiusKm" type="number" min="1" max="50" step="0.5" defaultValue={merchant.deliveryRadiusKm} className="input" disabled={isLoading} />
                            <p className="text-[10px] text-gray-500 mt-1">Distancia máxima para recibir pedidos</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <DollarSign className="w-4 h-4 inline" />
                                Pedido mínimo
                            </label>
                            <input name="minOrderAmount" type="number" min="0" step="100" defaultValue={merchant.minOrderAmount} className="input" disabled={isLoading} />
                            <p className="text-[10px] text-gray-500 mt-1">Monto mínimo para aceptar un pedido. $0 = sin mínimo</p>
                        </div>
                    </div>
                    <input type="hidden" name="deliveryFee" value={merchant.deliveryFee.toString()} />
                </div>

                {/* Commission Info (read-only) */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Percent className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">Tu comisión actual</p>
                                <p className="text-sm text-gray-500">Porcentaje que MOOVY cobra por cada venta</p>
                            </div>
                        </div>
                        <span className="text-2xl font-bold text-blue-600">{merchant.commissionRate}%</span>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2 px-8">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar Configuración
                    </button>
                </div>
            </form>

            {/* Document Status & Upload */}
            <DocumentsSection merchant={merchant} />

            {/* MercadoPago */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-blue-600" />
                    MercadoPago
                </h2>
                <p className="text-sm text-gray-500">
                    Vinculá tu cuenta de MercadoPago para recibir pagos directamente.
                </p>

                {mpEmail ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg">
                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            <div>
                                <p className="font-medium">Vinculado como: {mpEmail}</p>
                                {mpLinkedAt && (
                                    <p className="text-xs text-green-600">Desde: {new Date(mpLinkedAt).toLocaleDateString("es-AR")}</p>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleDisconnectMp}
                            disabled={mpDisconnecting}
                            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                            {mpDisconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />}
                            Desvincular MercadoPago
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-3 rounded-lg">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                            <p className="font-medium">No vinculado — los pagos se reciben en la cuenta de Moovy</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => window.location.href = "/api/mp/connect?type=merchant"}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                        >
                            <Link2 className="w-4 h-4" />
                            Vincular MercadoPago
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Documents Section Component ─────────────────────────────────────────────
// Documentos post fix/onboarding-comercio-completo: cada doc tiene su propio
// status (PENDING/APPROVED/REJECTED). Si está APPROVED, el merchant NO puede
// sobrescribirlo directamente — tiene que abrir una "solicitud de cambio" que
// OPS debe autorizar. Si OPS la autoriza, el status vuelve a PENDING y el
// merchant puede subir un archivo nuevo.
const FOOD_TYPES = new Set([
    "Restaurante", "Pizzería", "Hamburguesería", "Parrilla", "Cafetería",
    "Heladería", "Panadería/Pastelería", "Sushi", "Comida Saludable",
    "Rotisería", "Bebidas", "Vinoteca/Licorería",
]);

type DocKey = "cuit" | "bankAccount" | "constanciaAfipUrl" | "habilitacionMunicipalUrl" | "registroSanitarioUrl";
type DocKind = "text" | "url";

interface DocItem {
    key: DocKey;
    label: string;
    kind: DocKind;
    value: string | null;
    status: DocStatus;
    rejectionReason: string | null;
    required: boolean;
    placeholder: string;
}

function DocumentsSection({ merchant }: { merchant: SettingsFormProps["merchant"] }) {
    const [uploading, setUploading] = useState<DocKey | null>(null);
    const [savingField, setSavingField] = useState<DocKey | null>(null);
    const [textDrafts, setTextDrafts] = useState<{ cuit: string; bankAccount: string }>({
        cuit: merchant.cuit || "",
        bankAccount: merchant.bankAccount || "",
    });
    const [docState, setDocState] = useState<Record<DocKey, { value: string | null; status: DocStatus; rejectionReason: string | null }>>({
        cuit: {
            value: merchant.cuit || null,
            status: merchant.cuitStatus || "PENDING",
            rejectionReason: merchant.cuitRejectionReason || null,
        },
        bankAccount: {
            value: merchant.bankAccount || null,
            status: merchant.bankAccountStatus || "PENDING",
            rejectionReason: merchant.bankAccountRejectionReason || null,
        },
        constanciaAfipUrl: {
            value: merchant.constanciaAfipUrl || null,
            status: merchant.constanciaAfipStatus || "PENDING",
            rejectionReason: merchant.constanciaAfipRejectionReason || null,
        },
        habilitacionMunicipalUrl: {
            value: merchant.habilitacionMunicipalUrl || null,
            status: merchant.habilitacionMunicipalStatus || "PENDING",
            rejectionReason: merchant.habilitacionMunicipalRejectionReason || null,
        },
        registroSanitarioUrl: {
            value: merchant.registroSanitarioUrl || null,
            status: merchant.registroSanitarioStatus || "PENDING",
            rejectionReason: merchant.registroSanitarioRejectionReason || null,
        },
    });
    const [docError, setDocError] = useState("");
    const [docSuccess, setDocSuccess] = useState("");
    const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
    const [changeModalFor, setChangeModalFor] = useState<DocItem | null>(null);

    const isFoodBusiness = FOOD_TYPES.has(merchant.category || "");

    // Cargar solicitudes de cambio existentes.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/merchant/documents/change-request");
                if (!res.ok) return;
                const data = await res.json();
                if (!cancelled && Array.isArray(data.requests)) {
                    setChangeRequests(data.requests);
                }
            } catch {
                // silencioso — el panel es opcional, si falla no rompe el form.
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const refreshChangeRequests = async () => {
        try {
            const res = await fetch("/api/merchant/documents/change-request");
            if (!res.ok) return;
            const data = await res.json();
            if (Array.isArray(data.requests)) setChangeRequests(data.requests);
        } catch { /* silencioso */ }
    };

    const flashSuccess = (msg: string) => {
        setDocSuccess(msg);
        setTimeout(() => setDocSuccess(""), 3500);
    };

    // Subida de archivo (CUIT + bankAccount van por POST JSON, los 3 URL docs suben a /api/upload).
    const handleUploadDoc = async (field: DocKey, file: File) => {
        setUploading(field);
        setDocError("");
        try {
            const formData = new FormData();
            formData.append("file", file);
            const uploadRes = await fetch("/api/upload?folder=registration-docs", { method: "POST", body: formData });
            if (!uploadRes.ok) throw new Error("Error al subir archivo");
            const { url } = await uploadRes.json();

            const saveRes = await fetch("/api/merchant/update-docs", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [field]: url }),
            });
            const saveData = await saveRes.json().catch(() => ({}));
            if (!saveRes.ok) throw new Error(saveData.error || "Error al guardar documento");

            setDocState((prev) => ({
                ...prev,
                [field]: { value: url, status: "PENDING", rejectionReason: null },
            }));
            flashSuccess("Documento guardado. Queda pendiente de revisión por OPS.");
        } catch (err: any) {
            setDocError(err.message || "Error inesperado");
            toast.error(err.message || "Error inesperado");
        } finally {
            setUploading(null);
        }
    };

    // Guardar CUIT / CBU como texto.
    const handleSaveText = async (field: "cuit" | "bankAccount") => {
        const value = textDrafts[field].trim();
        if (!value) {
            setDocError(field === "cuit" ? "Ingresá tu CUIT" : "Ingresá tu CBU o Alias bancario");
            return;
        }
        setSavingField(field);
        setDocError("");
        try {
            const res = await fetch("/api/merchant/update-docs", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [field]: value }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Error al guardar");

            setDocState((prev) => ({
                ...prev,
                [field]: { value, status: "PENDING", rejectionReason: null },
            }));
            flashSuccess(field === "cuit"
                ? "CUIT guardado. Queda pendiente de revisión por OPS."
                : "Datos bancarios guardados. Quedan pendientes de revisión por OPS.");
        } catch (err: any) {
            setDocError(err.message || "Error inesperado");
            toast.error(err.message || "Error inesperado");
        } finally {
            setSavingField(null);
        }
    };

    // Abrir modal de solicitud de cambio para un doc APPROVED.
    const requestChange = (doc: DocItem) => {
        const hasPending = changeRequests.some(r => r.documentField === doc.key && r.status === "PENDING");
        if (hasPending) {
            toast.error("Ya tenés una solicitud pendiente para este documento. Esperá que OPS la resuelva.");
            return;
        }
        setChangeModalFor(doc);
    };

    const handleSubmitChangeRequest = async (reason: string): Promise<boolean> => {
        if (!changeModalFor) return false;
        try {
            const res = await fetch("/api/merchant/documents/change-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ documentField: changeModalFor.key, reason: reason.trim() }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(data.error || "No se pudo enviar la solicitud");
                return false;
            }
            toast.success("Solicitud enviada. OPS la va a revisar en breve.");
            await refreshChangeRequests();
            setChangeModalFor(null);
            return true;
        } catch {
            toast.error("Error de conexión");
            return false;
        }
    };

    // Items a mostrar (CUIT y CBU siempre, los 3 URL docs siempre excepto
    // Registro Sanitario que sólo aplica a food businesses).
    const docItems: DocItem[] = [
        {
            key: "cuit",
            label: "CUIT",
            kind: "text",
            value: docState.cuit.value,
            status: docState.cuit.status,
            rejectionReason: docState.cuit.rejectionReason,
            required: true,
            placeholder: "20-12345678-9",
        },
        {
            key: "bankAccount",
            label: "CBU o Alias bancario",
            kind: "text",
            value: docState.bankAccount.value,
            status: docState.bankAccount.status,
            rejectionReason: docState.bankAccount.rejectionReason,
            required: true,
            placeholder: "CBU de 22 dígitos o alias (6-20 caracteres)",
        },
        {
            key: "constanciaAfipUrl",
            label: "Constancia AFIP",
            kind: "url",
            value: docState.constanciaAfipUrl.value,
            status: docState.constanciaAfipUrl.status,
            rejectionReason: docState.constanciaAfipUrl.rejectionReason,
            required: true,
            placeholder: "",
        },
        {
            key: "habilitacionMunicipalUrl",
            label: "Habilitación Municipal",
            kind: "url",
            value: docState.habilitacionMunicipalUrl.value,
            status: docState.habilitacionMunicipalUrl.status,
            rejectionReason: docState.habilitacionMunicipalUrl.rejectionReason,
            required: true,
            placeholder: "",
        },
        ...(isFoodBusiness ? [{
            key: "registroSanitarioUrl" as DocKey,
            label: "Registro Sanitario",
            kind: "url" as DocKind,
            value: docState.registroSanitarioUrl.value,
            status: docState.registroSanitarioUrl.status,
            rejectionReason: docState.registroSanitarioUrl.rejectionReason,
            required: true,
            placeholder: "",
        }] : []),
    ];

    const pendingRequests = changeRequests.filter(r => r.status === "PENDING");
    const resolvedRequests = changeRequests.filter(r => r.status !== "PENDING");

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Documentación
            </h2>
            <p className="text-sm text-gray-500">
                Documentos obligatorios para operar tu comercio. Cada uno se aprueba de forma independiente desde OPS.
                Una vez aprobado, no podés sobrescribirlo directamente — tenés que solicitar permiso.
            </p>

            {docError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">
                    {docError}
                </div>
            )}
            {docSuccess && (
                <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm font-medium border border-green-100">
                    {docSuccess}
                </div>
            )}

            {/* Lista unificada de docs (CUIT, CBU, URL docs) */}
            <div className="space-y-3">
                {docItems.map((doc) => (
                    <DocumentRow
                        key={doc.key}
                        doc={doc}
                        uploading={uploading === doc.key}
                        saving={savingField === doc.key}
                        draft={doc.kind === "text" ? textDrafts[doc.key as "cuit" | "bankAccount"] : ""}
                        onDraftChange={(val) => {
                            if (doc.kind === "text") {
                                setTextDrafts((prev) => ({ ...prev, [doc.key]: val }));
                            }
                        }}
                        onSaveText={() => handleSaveText(doc.key as "cuit" | "bankAccount")}
                        onUploadFile={(file) => handleUploadDoc(doc.key, file)}
                        onRequestChange={() => requestChange(doc)}
                        hasPendingChangeRequest={changeRequests.some(r => r.documentField === doc.key && r.status === "PENDING")}
                    />
                ))}
            </div>

            {/* Solicitudes de cambio */}
            {(pendingRequests.length > 0 || resolvedRequests.length > 0) && (
                <div className="pt-4 border-t border-gray-100 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        Solicitudes de cambio
                    </h3>

                    {pendingRequests.length > 0 && (
                        <div className="space-y-2">
                            {pendingRequests.map((r) => (
                                <div key={r.id} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-amber-900">{r.documentLabel}</span>
                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            Esperando autorización
                                        </span>
                                    </div>
                                    <p className="text-xs text-amber-800 italic">"{r.reason}"</p>
                                    <p className="text-[10px] text-amber-700 mt-1">
                                        Enviada el {new Date(r.createdAt).toLocaleDateString("es-AR")}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {resolvedRequests.length > 0 && (
                        <details className="group">
                            <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-900 select-none">
                                Ver historial ({resolvedRequests.length})
                            </summary>
                            <div className="mt-2 space-y-2">
                                {resolvedRequests.map((r) => {
                                    const approved = r.status === "APPROVED";
                                    return (
                                        <div key={r.id} className={`p-2.5 rounded-lg border text-xs ${approved ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium text-gray-900">{r.documentLabel}</span>
                                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${approved ? "bg-green-200 text-green-900" : "bg-red-200 text-red-900"}`}>
                                                    {approved ? "Autorizada" : "Rechazada"}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 italic">"{r.reason}"</p>
                                            {r.resolutionNote && (
                                                <p className="text-gray-800 mt-1">
                                                    <span className="font-medium">Respuesta OPS:</span> {r.resolutionNote}
                                                </p>
                                            )}
                                            <p className="text-[10px] text-gray-500 mt-1">
                                                {r.resolvedAt ? new Date(r.resolvedAt).toLocaleDateString("es-AR") : ""}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </details>
                    )}
                </div>
            )}

            {merchant.approvalStatus === "APPROVED" && (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">Tu comercio está verificado y aprobado</p>
                </div>
            )}
            {merchant.approvalStatus === "PENDING" && (
                <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-3 rounded-lg">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">Documentos en revisión — te notificaremos cuando estén aprobados</p>
                </div>
            )}

            {/* Modal de solicitud de cambio */}
            {changeModalFor && (
                <ChangeRequestModal
                    doc={changeModalFor}
                    onClose={() => setChangeModalFor(null)}
                    onSubmit={handleSubmitChangeRequest}
                />
            )}
        </div>
    );
}

// ─── DocumentRow (un card por doc) ───────────────────────────────────────────
function DocumentRow({
    doc,
    uploading,
    saving,
    draft,
    onDraftChange,
    onSaveText,
    onUploadFile,
    onRequestChange,
    hasPendingChangeRequest,
}: {
    doc: DocItem;
    uploading: boolean;
    saving: boolean;
    draft: string;
    onDraftChange: (v: string) => void;
    onSaveText: () => void;
    onUploadFile: (file: File) => void;
    onRequestChange: () => void;
    hasPendingChangeRequest: boolean;
}) {
    const isApproved = doc.status === "APPROVED";
    const isRejected = doc.status === "REJECTED";
    const hasValue = Boolean(doc.value);

    const statusChip = (() => {
        if (!hasValue) {
            return (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                    Sin cargar
                </span>
            );
        }
        if (isApproved) {
            return (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Aprobado
                </span>
            );
        }
        if (isRejected) {
            return (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    Rechazado
                </span>
            );
        }
        return (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                En revisión
            </span>
        );
    })();

    return (
        <div className={`p-3 rounded-lg space-y-2 border ${isApproved ? "bg-green-50/40 border-green-200" : isRejected ? "bg-red-50/40 border-red-200" : "bg-gray-50 border-gray-100"}`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-800 flex items-center gap-2">
                    {doc.label}
                    {isApproved && <Lock className="w-3.5 h-3.5 text-green-600" />}
                </span>
                <div className="flex items-center gap-2">
                    {doc.kind === "url" && hasValue && (
                        <a
                            href={doc.value!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                            title={`Ver ${doc.label}`}
                        >
                            <Eye className="w-4 h-4" />
                        </a>
                    )}
                    {statusChip}
                </div>
            </div>

            {/* Motivo de rechazo */}
            {isRejected && doc.rejectionReason && (
                <div className="text-xs text-red-700 bg-red-100 border border-red-200 rounded-md px-2 py-1.5">
                    <span className="font-semibold">Motivo del rechazo:</span> {doc.rejectionReason}
                </div>
            )}

            {/* Valor actual de texto (CUIT / bankAccount) — mostrar aunque esté APPROVED */}
            {doc.kind === "text" && hasValue && isApproved && (
                <div className="text-xs font-mono text-gray-700 bg-white border border-gray-200 rounded px-2 py-1.5 break-all">
                    {doc.value}
                </div>
            )}

            {/* Editor / uploader — bloqueado si APPROVED */}
            {isApproved ? (
                <button
                    type="button"
                    onClick={onRequestChange}
                    disabled={hasPendingChangeRequest}
                    className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                    <MessageSquare className="w-4 h-4" />
                    {hasPendingChangeRequest ? "Solicitud pendiente" : "Solicitar cambio"}
                </button>
            ) : doc.kind === "text" ? (
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={draft}
                        onChange={(e) => onDraftChange(e.target.value)}
                        placeholder={doc.placeholder}
                        disabled={saving}
                        className="input flex-1 text-sm"
                    />
                    <button
                        type="button"
                        onClick={onSaveText}
                        disabled={saving || !draft.trim() || draft.trim() === (doc.value || "")}
                        className="flex items-center justify-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {hasValue ? "Actualizar" : "Guardar"}
                    </button>
                </div>
            ) : (
                <label className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    {hasValue ? "Reemplazar documento" : "Subir documento"}
                    <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onUploadFile(file);
                            e.target.value = "";
                        }}
                    />
                </label>
            )}
        </div>
    );
}

// ─── Modal "Solicitar cambio" ────────────────────────────────────────────────
function ChangeRequestModal({
    doc,
    onClose,
    onSubmit,
}: {
    doc: DocItem;
    onClose: () => void;
    onSubmit: (reason: string) => Promise<boolean>;
}) {
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const trimmed = reason.trim();
    const tooShort = trimmed.length > 0 && trimmed.length < 10;
    const tooLong = trimmed.length > 500;
    const canSubmit = trimmed.length >= 10 && trimmed.length <= 500 && !submitting;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        const ok = await onSubmit(reason);
        if (!ok) setSubmitting(false);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-request-title"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl w-full max-w-md shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between p-5 border-b border-gray-100">
                    <div>
                        <h3 id="change-request-title" className="font-semibold text-gray-900 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-600" />
                            Solicitar cambio
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{doc.label}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
                        aria-label="Cerrar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 space-y-3">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <p>
                            Este documento ya fue aprobado. Para modificarlo necesitamos que OPS autorice el cambio.
                            Explicá brevemente por qué tenés que actualizarlo (cambio de titularidad, error en la carga anterior, renovación, etc.).
                        </p>
                    </div>

                    <label className="block">
                        <span className="text-sm font-medium text-gray-700">Motivo del cambio</span>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ej: cambié de banco y necesito actualizar el CBU"
                            maxLength={500}
                            rows={4}
                            disabled={submitting}
                            className="input w-full mt-1 resize-none text-sm"
                        />
                        <div className="flex items-center justify-between text-[10px] mt-1">
                            <span className={tooShort ? "text-red-600" : "text-gray-500"}>
                                {tooShort ? "Mínimo 10 caracteres" : "Mínimo 10, máximo 500 caracteres"}
                            </span>
                            <span className={tooLong ? "text-red-600" : "text-gray-500"}>
                                {trimmed.length} / 500
                            </span>
                        </div>
                    </label>
                </div>

                <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                        Enviar solicitud
                    </button>
                </div>
            </div>
        </div>
    );
}