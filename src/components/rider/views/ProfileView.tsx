"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import {
    ChevronLeft,
    User,
    Mail,
    Phone,
    Bike,
    Star,
    Package,
    Loader2,
    Check,
    Edit,
    LogOut,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    MessageSquare,
    Upload,
    X,
    Save,
} from "lucide-react";
import ImageUpload from "@/components/ui/ImageUpload";
import ReviewsList from "@/components/ui/ReviewsList";
import { PortalSwitcherDark } from "@/components/ui/PortalSwitcher";

interface ProfileViewProps {
    onBack: () => void;
}

// ─── Config per-doc (mirror de DRIVER_DOCUMENT_COLUMNS del backend) ──────────
// Se mantiene client-side porque ProfileView.tsx es un componente cliente puro
// y no queremos forzar server-fetch de metadata que no cambia. Si los labels
// se mueven, actualizarlo acá también.
type DriverDocKey =
    | "cuit"
    | "constanciaCuitUrl"
    | "dniFrenteUrl"
    | "dniDorsoUrl"
    | "licenciaUrl"
    | "seguroUrl"
    | "vtvUrl"
    | "cedulaVerdeUrl";

type DocStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
type DocKind = "text" | "url";

interface DocDescriptor {
    key: DriverDocKey;
    label: string;
    shortLabel: string; // Para el título de cards
    kind: DocKind;
    motorizedOnly: boolean;
    hasExpiration: boolean;
    expirationKey?: string;
    placeholder?: string;
    helpText?: string;
}

const DOC_DESCRIPTORS: DocDescriptor[] = [
    {
        key: "cuit",
        label: "CUIT/CUIL",
        shortLabel: "CUIT/CUIL",
        kind: "text",
        motorizedOnly: false,
        hasExpiration: false,
        placeholder: "20-12345678-9",
        helpText: "Tu CUIT o CUIL (11 dígitos, con o sin guiones).",
    },
    {
        key: "constanciaCuitUrl",
        label: "Constancia de Inscripción AFIP / Monotributo",
        shortLabel: "Constancia AFIP",
        kind: "url",
        motorizedOnly: false,
        hasExpiration: false,
        helpText: "PDF o foto clara de tu constancia AFIP.",
    },
    {
        key: "dniFrenteUrl",
        label: "DNI (frente)",
        shortLabel: "DNI frente",
        kind: "url",
        motorizedOnly: false,
        hasExpiration: false,
        helpText: "Foto del frente del DNI, legible.",
    },
    {
        key: "dniDorsoUrl",
        label: "DNI (dorso)",
        shortLabel: "DNI dorso",
        kind: "url",
        motorizedOnly: false,
        hasExpiration: false,
        helpText: "Foto del dorso del DNI, legible.",
    },
    {
        key: "licenciaUrl",
        label: "Licencia de conducir",
        shortLabel: "Licencia",
        kind: "url",
        motorizedOnly: true,
        hasExpiration: true,
        expirationKey: "licenciaExpiresAt",
        helpText: "Licencia vigente de conducir.",
    },
    {
        key: "seguroUrl",
        label: "Póliza de seguro",
        shortLabel: "Seguro",
        kind: "url",
        motorizedOnly: true,
        hasExpiration: true,
        expirationKey: "seguroExpiresAt",
        helpText: "Póliza del vehículo a tu nombre.",
    },
    {
        key: "vtvUrl",
        label: "RTO (Revisión Técnica)",
        shortLabel: "RTO",
        kind: "url",
        motorizedOnly: true,
        hasExpiration: true,
        expirationKey: "vtvExpiresAt",
        helpText: "RTO vigente (Revisión Técnica Obligatoria).",
    },
    {
        key: "cedulaVerdeUrl",
        label: "Cédula verde",
        shortLabel: "Cédula verde",
        kind: "url",
        motorizedOnly: true,
        hasExpiration: true,
        expirationKey: "cedulaVerdeExpiresAt",
        helpText: "Cédula verde que acredita titularidad.",
    },
];

const NON_MOTORIZED = new Set(["BICI", "BICICLETA", "PATIN", "PATINETA", "TRICI"]);
function isMotorizedClient(vt: string | null | undefined): boolean {
    if (!vt) return false;
    return !NON_MOTORIZED.has(vt.toUpperCase());
}

interface DocFieldState {
    value: string | null;
    status: DocStatus;
    rejectionReason: string | null;
    approvedAt: string | null;
    expiresAt: string | null; // ISO
}

interface ChangeRequest {
    id: string;
    documentField: string;
    documentLabel: string;
    reason: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    resolvedAt: string | null;
    resolutionNote: string | null;
    createdAt: string;
}

export default function ProfileView({ onBack }: ProfileViewProps) {
    const { data: session } = useSession();
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [formData, setFormData] = useState({
        image: "",
        email: "",
        phone: "",
        vehicleType: "MOTO",
        vehicleModel: "",
        vehiclePlate: "",
    });

    const [driverId, setDriverId] = useState<string | null>(null);
    const [driverStats, setDriverStats] = useState({
        totalDeliveries: 0,
        rating: 5.0,
        memberSince: new Date().toISOString(),
    });

    // Estado documental: 8 campos + sus ISO de expiración. Se completan desde
    // /api/driver/profile en el primer fetch; luego se mutan optimísticamente
    // cuando el driver sube un archivo o pide un cambio.
    const [docState, setDocState] = useState<Record<DriverDocKey, DocFieldState>>({
        cuit: emptyDoc(),
        constanciaCuitUrl: emptyDoc(),
        dniFrenteUrl: emptyDoc(),
        dniDorsoUrl: emptyDoc(),
        licenciaUrl: emptyDoc(),
        seguroUrl: emptyDoc(),
        vtvUrl: emptyDoc(),
        cedulaVerdeUrl: emptyDoc(),
    });
    const [cuitDraft, setCuitDraft] = useState("");
    const [savingField, setSavingField] = useState<DriverDocKey | null>(null);
    const [uploadingField, setUploadingField] = useState<DriverDocKey | null>(null);
    const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
    const [changeModalFor, setChangeModalFor] = useState<DocDescriptor | null>(null);
    const [docError, setDocError] = useState("");
    const [docSuccess, setDocSuccess] = useState("");

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/driver/profile");
            if (!res.ok) return;
            const data = await res.json();
            setFormData({
                image: data.user?.image || "",
                email: data.user?.email || "",
                phone: data.user?.phone || "",
                vehicleType: data.vehicleType || "MOTO",
                vehicleModel: data.vehicleModel || "",
                vehiclePlate: data.vehiclePlate || data.licensePlate || "",
            });
            setDriverId(data.id || null);
            setDriverStats({
                totalDeliveries: data.totalDeliveries || 0,
                rating: data.rating || 5.0,
                memberSince: data.createdAt || new Date().toISOString(),
            });

            // Hidratar 8 docs desde la misma respuesta — el endpoint devuelve
            // todos los campos del Driver via include sin select filter.
            setDocState({
                cuit: extractDoc(data, "cuit", "cuit", "cuitStatus", "cuitRejectionReason", "cuitApprovedAt"),
                constanciaCuitUrl: extractDoc(data, "constanciaCuitUrl", "constanciaCuitUrl", "constanciaCuitStatus", "constanciaCuitRejectionReason", "constanciaCuitApprovedAt"),
                dniFrenteUrl: extractDoc(data, "dniFrenteUrl", "dniFrenteUrl", "dniFrenteStatus", "dniFrenteRejectionReason", "dniFrenteApprovedAt"),
                dniDorsoUrl: extractDoc(data, "dniDorsoUrl", "dniDorsoUrl", "dniDorsoStatus", "dniDorsoRejectionReason", "dniDorsoApprovedAt"),
                licenciaUrl: extractDoc(data, "licenciaUrl", "licenciaUrl", "licenciaStatus", "licenciaRejectionReason", "licenciaApprovedAt", "licenciaExpiresAt"),
                seguroUrl: extractDoc(data, "seguroUrl", "seguroUrl", "seguroStatus", "seguroRejectionReason", "seguroApprovedAt", "seguroExpiresAt"),
                vtvUrl: extractDoc(data, "vtvUrl", "vtvUrl", "vtvStatus", "vtvRejectionReason", "vtvApprovedAt", "vtvExpiresAt"),
                cedulaVerdeUrl: extractDoc(data, "cedulaVerdeUrl", "cedulaVerdeUrl", "cedulaVerdeStatus", "cedulaVerdeRejectionReason", "cedulaVerdeApprovedAt", "cedulaVerdeExpiresAt"),
            });
            setCuitDraft(data.cuit || "");
        } catch (err) {
            console.error("Error fetching profile", err);
        }
    };

    const fetchChangeRequests = async () => {
        try {
            const res = await fetch("/api/driver/documents/change-request");
            if (!res.ok) return;
            const data = await res.json();
            if (Array.isArray(data.requests)) setChangeRequests(data.requests);
        } catch {
            // silencioso — la sección es opcional
        }
    };

    useEffect(() => {
        if (session?.user) {
            fetchProfile();
            fetchChangeRequests();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/driver/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setEditMode(false);
                setShowConfirm(false);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setSaving(false);
        }
    };

    const flashSuccess = (msg: string) => {
        setDocSuccess(msg);
        setDocError("");
        setTimeout(() => setDocSuccess(""), 3500);
    };

    const flashError = (msg: string) => {
        setDocError(msg);
        setDocSuccess("");
        setTimeout(() => setDocError(""), 5000);
    };

    // Guardar CUIT como texto. Sólo funciona si el CUIT no está APPROVED.
    // Si está APPROVED, el botón "Solicitar cambio" abre el modal.
    const handleSaveCuit = async () => {
        const value = cuitDraft.trim();
        if (!value) {
            flashError("Ingresá tu CUIT o CUIL");
            return;
        }
        setSavingField("cuit");
        try {
            const res = await fetch("/api/driver/documents/update", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cuit: value }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Error al guardar CUIT");
            setDocState((prev) => ({
                ...prev,
                cuit: { ...prev.cuit, value, status: "PENDING", rejectionReason: null, approvedAt: null },
            }));
            flashSuccess("CUIT guardado. Queda pendiente de revisión por el equipo de Moovy.");
        } catch (err: any) {
            flashError(err?.message || "Error inesperado");
        } finally {
            setSavingField(null);
        }
    };

    // Subida de un archivo para un doc URL. El backend:
    //   1) recibe el archivo via /api/upload/registration (magic bytes, compresión)
    //   2) se llama /api/driver/documents/update con { <field>: url, <expirationKey>?: ISO }
    //   3) el helper server-side resetDriverDocumentToPending pone status=PENDING
    //      y limpia rejectionReason + notifiedStage.
    const handleUploadDoc = async (
        descriptor: DocDescriptor,
        file: File,
        expiresAt?: string | null
    ) => {
        setUploadingField(descriptor.key);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const uploadRes = await fetch("/api/upload/registration", {
                method: "POST",
                body: formData,
            });
            if (!uploadRes.ok) {
                const errData = await uploadRes.json().catch(() => ({}));
                throw new Error(errData.error || "Error al subir archivo");
            }
            const { url } = await uploadRes.json();

            const patchBody: Record<string, string> = { [descriptor.key]: url };
            if (descriptor.hasExpiration && descriptor.expirationKey && expiresAt) {
                patchBody[descriptor.expirationKey] = expiresAt;
            }

            const saveRes = await fetch("/api/driver/documents/update", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patchBody),
            });
            const saveData = await saveRes.json().catch(() => ({}));
            if (!saveRes.ok) throw new Error(saveData.error || "Error al guardar documento");

            setDocState((prev) => ({
                ...prev,
                [descriptor.key]: {
                    ...prev[descriptor.key],
                    value: url,
                    status: "PENDING",
                    rejectionReason: null,
                    approvedAt: null,
                    expiresAt: expiresAt ?? prev[descriptor.key].expiresAt,
                },
            }));
            flashSuccess("Documento guardado. Queda pendiente de revisión por el equipo de Moovy.");
        } catch (err: any) {
            flashError(err?.message || "Error inesperado");
        } finally {
            setUploadingField(null);
        }
    };

    const handleRequestChange = async (descriptor: DocDescriptor, reason: string): Promise<boolean> => {
        try {
            const res = await fetch("/api/driver/documents/change-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ documentField: descriptor.key, reason }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                flashError(data.error || "No se pudo enviar la solicitud");
                return false;
            }
            flashSuccess("Solicitud enviada. El equipo de Moovy la va a revisar en breve.");
            await fetchChangeRequests();
            setChangeModalFor(null);
            return true;
        } catch {
            flashError("Error de conexión");
            return false;
        }
    };

    // Filtrar docs según tipo de vehículo — los motorized-only se ocultan
    // completamente para los no-motorizados (bici, patín, etc.) para no
    // confundir al driver con "Sin cargar" de docs que no le aplican.
    const motorized = isMotorizedClient(formData.vehicleType);
    const visibleDocs = useMemo(
        () => DOC_DESCRIPTORS.filter((d) => !d.motorizedOnly || motorized),
        [motorized]
    );

    const pendingRequests = changeRequests.filter((r) => r.status === "PENDING");
    const resolvedRequests = changeRequests.filter((r) => r.status !== "PENDING");

    return (
        <div className="absolute inset-0 z-50 bg-gray-50 dark:bg-[#0f1117] flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-6 pb-20 shadow-md">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-white/10 rounded-lg transition active:scale-95"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-bold">Mi Perfil</h1>
                    </div>
                </div>
            </div>

            <div
                className="flex-1 overflow-y-auto px-4 -mt-14 max-w-4xl mx-auto w-full space-y-4"
                style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}
            >
                {/* Profile Card */}
                <div className="bg-white dark:bg-[#1a1d27] rounded-xl p-6 shadow-sm text-center">
                    {editMode ? (
                        <div className="w-full max-w-[220px] mx-auto mb-6">
                            <ImageUpload
                                value={formData.image}
                                onChange={(url) => setFormData({ ...formData, image: url })}
                                disabled={saving}
                            />
                            <p className="text-xs text-gray-400 mt-2">Toca para cambiar tu foto</p>
                        </div>
                    ) : (
                        <div className="w-24 h-24 mx-auto mb-4 relative">
                            <div className="w-24 h-24 bg-green-100 dark:bg-green-500/10 rounded-full flex items-center justify-center overflow-hidden border-4 border-white dark:border-[#1a1d27] shadow-lg relative mx-auto">
                                {formData.image ? (
                                    <img src={formData.image} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-12 h-12 text-green-600" />
                                )}
                            </div>
                        </div>
                    )}

                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {session?.user?.name || "Repartidor"}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Repartidor desde{" "}
                        {new Date(driverStats.memberSince).toLocaleDateString("es-AR", {
                            month: "long",
                            year: "numeric",
                        })}
                    </p>

                    <div className="flex items-center justify-center gap-4 mt-4">
                        <div className="flex items-center gap-1">
                            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                            <span className="font-bold dark:text-white">{driverStats.rating}</span>
                        </div>
                        <div className="h-4 w-px bg-gray-300 dark:bg-white/10" />
                        <div className="flex items-center gap-1">
                            <Package className="w-5 h-5 text-green-500" />
                            <span className="font-bold dark:text-white">{driverStats.totalDeliveries}</span>
                            <span className="text-gray-500 dark:text-gray-400 text-sm">entregas</span>
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="bg-white dark:bg-[#1a1d27] rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b dark:border-white/10 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Información de Contacto</h3>
                        {!editMode && (
                            <button
                                onClick={() => setEditMode(true)}
                                className="text-green-600 text-sm font-medium flex items-center gap-1"
                            >
                                <Edit className="w-4 h-4" />
                                Editar
                            </button>
                        )}
                    </div>

                    <div className="p-4 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 dark:bg-[#22252f] rounded-lg flex items-center justify-center flex-shrink-0">
                                <Mail className="w-5 h-5 text-gray-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                                <p className="text-gray-900 dark:text-white truncate">
                                    {formData.email || "No registrado"}
                                </p>
                                {editMode && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        El email no se puede modificar.{" "}
                                        <a href="/soporte" className="text-green-600 hover:underline">
                                            Solicitar cambio
                                        </a>
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 dark:bg-[#22252f] rounded-lg flex items-center justify-center flex-shrink-0">
                                <Phone className="w-5 h-5 text-gray-500" />
                            </div>
                            {editMode ? (
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="flex-1 min-w-0 px-3 py-2 border dark:bg-[#22252f] dark:border-white/10 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Teléfono"
                                />
                            ) : (
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Teléfono</p>
                                    <p className="text-gray-900 dark:text-white truncate">
                                        {formData.phone || "No registrado"}
                                    </p>
                                </div>
                            )}
                        </div>

                        {editMode && (
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setEditMode(false)}
                                    className="flex-1 py-2 border border-gray-300 dark:border-white/10 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-[#22252f]"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => setShowConfirm(true)}
                                    className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                >
                                    Guardar
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Vehicle Info */}
                <div className="bg-white dark:bg-[#1a1d27] rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b dark:border-white/10">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Vehículo</h3>
                    </div>
                    <div className="p-4 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Bike className="w-5 h-5 text-green-600" />
                            </div>
                            {editMode ? (
                                <div className="flex-1 space-y-3 min-w-0">
                                    <div className="relative">
                                        <select
                                            value={formData.vehicleType}
                                            onChange={(e) =>
                                                setFormData({ ...formData, vehicleType: e.target.value })
                                            }
                                            className="w-full px-3 py-2 border dark:bg-[#22252f] dark:border-white/10 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none pr-8 truncate"
                                        >
                                            <option value="MOTO">Moto</option>
                                            <option value="AUTO">Auto</option>
                                            <option value="BICICLETA">Bicicleta</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                            <svg
                                                className="w-4 h-4 text-gray-500"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M19 9l-7 7-7-7"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.vehicleModel}
                                        onChange={(e) =>
                                            setFormData({ ...formData, vehicleModel: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border dark:bg-[#22252f] dark:border-white/10 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="Modelo (Ej: Honda Wave)"
                                    />
                                    <input
                                        type="text"
                                        value={formData.vehiclePlate}
                                        onChange={(e) =>
                                            setFormData({ ...formData, vehiclePlate: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border dark:bg-[#22252f] dark:border-white/10 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="Patente (Opcional)"
                                    />
                                </div>
                            ) : (
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-white truncate">
                                        {formData.vehicleType === "MOTO"
                                            ? "Moto"
                                            : formData.vehicleType === "BICICLETA"
                                                ? "Bicicleta"
                                                : formData.vehicleType === "AUTO"
                                                    ? "Auto"
                                                    : formData.vehicleType}
                                        {formData.vehicleModel ? ` - ${formData.vehicleModel}` : ""}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {formData.vehiclePlate
                                            ? `Patente: ${formData.vehiclePlate}`
                                            : "Tipo de vehículo"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mis Documentos — P1 del plan onboarding repartidor.
                    Cada doc es una card con: status chip, expiración badge
                    (solo 4 docs), motivo de rechazo (si aplica), y acción
                    disponible según status (Subir/Reemplazar o Solicitar
                    cambio). Los docs motorized-only se ocultan para bici. */}
                <div className="bg-white dark:bg-[#1a1d27] rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b dark:border-white/10">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-green-600" />
                            Mis Documentos
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Documentos obligatorios para operar. Cada uno se aprueba por separado.
                            Una vez aprobado no podés sobrescribirlo — tenés que solicitar permiso.
                        </p>
                    </div>

                    <div className="p-4 space-y-3">
                        {docError && (
                            <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium border border-red-100 dark:border-red-500/30">
                                {docError}
                            </div>
                        )}
                        {docSuccess && (
                            <div className="p-3 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg text-sm font-medium border border-green-100 dark:border-green-500/30">
                                {docSuccess}
                            </div>
                        )}

                        {visibleDocs.map((doc) => {
                            const st = docState[doc.key];
                            const hasPendingCR = changeRequests.some(
                                (r) => r.documentField === doc.key && r.status === "PENDING"
                            );
                            return (
                                <DriverDocCard
                                    key={doc.key}
                                    doc={doc}
                                    state={st}
                                    cuitDraft={cuitDraft}
                                    onCuitDraftChange={setCuitDraft}
                                    onSaveCuit={handleSaveCuit}
                                    onUploadFile={(file, exp) => handleUploadDoc(doc, file, exp)}
                                    onRequestChange={() => setChangeModalFor(doc)}
                                    saving={savingField === doc.key}
                                    uploading={uploadingField === doc.key}
                                    hasPendingChangeRequest={hasPendingCR}
                                />
                            );
                        })}

                        {/* Lista de solicitudes de cambio (pending + resolved) */}
                        {(pendingRequests.length > 0 || resolvedRequests.length > 0) && (
                            <div className="pt-4 border-t border-gray-100 dark:border-white/10 space-y-3">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-green-600" />
                                    Solicitudes de cambio
                                </h4>

                                {pendingRequests.length > 0 && (
                                    <div className="space-y-2">
                                        {pendingRequests.map((r) => (
                                            <div
                                                key={r.id}
                                                className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg"
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium text-amber-900 dark:text-amber-200">
                                                        {r.documentLabel}
                                                    </span>
                                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-500/30 text-amber-900 dark:text-amber-200 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        Esperando autorización
                                                    </span>
                                                </div>
                                                <p className="text-xs text-amber-800 dark:text-amber-300 italic">
                                                    &ldquo;{r.reason}&rdquo;
                                                </p>
                                                <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1">
                                                    Enviada el{" "}
                                                    {new Date(r.createdAt).toLocaleDateString("es-AR")}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {resolvedRequests.length > 0 && (
                                    <details className="group">
                                        <summary className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white select-none">
                                            Ver historial ({resolvedRequests.length})
                                        </summary>
                                        <div className="mt-2 space-y-2">
                                            {resolvedRequests.map((r) => {
                                                const approved = r.status === "APPROVED";
                                                return (
                                                    <div
                                                        key={r.id}
                                                        className={`p-2.5 rounded-lg border text-xs ${approved
                                                            ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30"
                                                            : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30"
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-medium text-gray-900 dark:text-white">
                                                                {r.documentLabel}
                                                            </span>
                                                            <span
                                                                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${approved
                                                                    ? "bg-green-200 dark:bg-green-500/30 text-green-900 dark:text-green-200"
                                                                    : "bg-red-200 dark:bg-red-500/30 text-red-900 dark:text-red-200"
                                                                    }`}
                                                            >
                                                                {approved ? "Autorizada" : "Rechazada"}
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-700 dark:text-gray-300 italic">
                                                            &ldquo;{r.reason}&rdquo;
                                                        </p>
                                                        {r.resolutionNote && (
                                                            <p className="text-gray-800 dark:text-gray-200 mt-1">
                                                                <span className="font-medium">Respuesta del equipo:</span>{" "}
                                                                {r.resolutionNote}
                                                            </p>
                                                        )}
                                                        <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-1">
                                                            {r.resolvedAt
                                                                ? new Date(r.resolvedAt).toLocaleDateString("es-AR")
                                                                : ""}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </details>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Reviews */}
                {driverId && (
                    <div className="bg-white dark:bg-[#1a1d27] rounded-xl shadow-sm overflow-hidden">
                        <div className="p-4 border-b dark:border-white/10">
                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Star className="w-5 h-5 text-yellow-400" />
                                Reseñas de Clientes
                            </h3>
                        </div>
                        <div className="p-4">
                            <ReviewsList type="driver" entityId={driverId} />
                        </div>
                    </div>
                )}

                {/* Mis Portales & Options */}
                <div className="bg-white dark:bg-[#1a1d27] rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b dark:border-white/10">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Mis Portales</h3>
                    </div>
                    <div className="divide-y dark:divide-white/10">
                        <PortalSwitcherDark
                            currentPortal="repartidor"
                            userRoles={
                                (session?.user as any)?.roles ||
                                [(session?.user as any)?.role].filter(Boolean)
                            }
                        />
                        <button
                            onClick={() => signOut({ callbackUrl: "/repartidor/login" })}
                            className="flex items-center gap-3 p-4 w-full text-left hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                        >
                            <div className="w-10 h-10 bg-red-50 dark:bg-red-500/10 rounded-lg flex items-center justify-center">
                                <LogOut className="w-5 h-5 text-[#e60012]" />
                            </div>
                            <span className="text-[#e60012] font-medium">Cerrar sesión</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white dark:bg-[#1a1d27] rounded-xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="font-bold text-lg mb-4 dark:text-white">Confirmar Cambios</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            ¿Estás seguro de guardar los cambios en tu perfil?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 py-2 border border-gray-300 dark:border-white/10 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-[#22252f]"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Request Modal */}
            {changeModalFor && (
                <DriverChangeRequestModal
                    doc={changeModalFor}
                    onClose={() => setChangeModalFor(null)}
                    onSubmit={(reason) => handleRequestChange(changeModalFor, reason)}
                />
            )}
        </div>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyDoc(): DocFieldState {
    return { value: null, status: "PENDING", rejectionReason: null, approvedAt: null, expiresAt: null };
}

/**
 * Extrae el estado de un doc desde la respuesta del endpoint /api/driver/profile.
 * El endpoint usa `include` (no select filter) así que devuelve todos los
 * campos del Driver + user, sin tocar nada.
 */
function extractDoc(
    data: any,
    valueKey: string,
    _fieldKey: string,
    statusKey: string,
    rejectionKey: string,
    approvedAtKey: string,
    expiresAtKey?: string
): DocFieldState {
    return {
        value: data?.[valueKey] || null,
        status: (data?.[statusKey] as DocStatus) || "PENDING",
        rejectionReason: data?.[rejectionKey] || null,
        approvedAt: data?.[approvedAtKey] || null,
        expiresAt: expiresAtKey ? data?.[expiresAtKey] || null : null,
    };
}

function daysUntil(dateIso: string | null): number | null {
    if (!dateIso) return null;
    const target = new Date(dateIso);
    if (isNaN(target.getTime())) return null;
    const ms = target.getTime() - Date.now();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

// ─── Expiration Badge ─────────────────────────────────────────────────────────

function ExpirationBadge({ dateIso }: { dateIso: string | null }) {
    const days = daysUntil(dateIso);
    if (days === null) return null;

    // Colores alineados con STAGE_THRESHOLDS del cron driver-docs-expiry.
    if (days < 0) {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-200 dark:bg-red-500/30 text-red-900 dark:text-red-200">
                <AlertTriangle className="w-3 h-3" />
                Vencido
            </span>
        );
    }
    if (days <= 1) {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300">
                <AlertTriangle className="w-3 h-3" />
                Vence en {days === 0 ? "< 1 día" : "1 día"}
            </span>
        );
    }
    if (days <= 3) {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300">
                <Clock className="w-3 h-3" />
                Vence en {days}d
            </span>
        );
    }
    if (days <= 7) {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300">
                <Clock className="w-3 h-3" />
                Vence en {days}d
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-300">
            <Clock className="w-3 h-3" />
            Vence {new Date(dateIso!).toLocaleDateString("es-AR")}
        </span>
    );
}

// ─── DriverDocCard ────────────────────────────────────────────────────────────

function DriverDocCard({
    doc,
    state,
    cuitDraft,
    onCuitDraftChange,
    onSaveCuit,
    onUploadFile,
    onRequestChange,
    saving,
    uploading,
    hasPendingChangeRequest,
}: {
    doc: DocDescriptor;
    state: DocFieldState;
    cuitDraft: string;
    onCuitDraftChange: (v: string) => void;
    onSaveCuit: () => void;
    onUploadFile: (file: File, expiresAt?: string | null) => void;
    onRequestChange: () => void;
    saving: boolean;
    uploading: boolean;
    hasPendingChangeRequest: boolean;
}) {
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [pendingExpiration, setPendingExpiration] = useState<string>("");

    const isApproved = state.status === "APPROVED";
    const isRejected = state.status === "REJECTED";
    const isExpired = state.status === "EXPIRED";
    const hasValue = Boolean(state.value);

    const statusChip = (() => {
        if (!hasValue) {
            return (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                    Sin cargar
                </span>
            );
        }
        if (isApproved) {
            return (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 inline-flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Aprobado
                </span>
            );
        }
        if (isRejected) {
            return (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 inline-flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    Rechazado
                </span>
            );
        }
        if (isExpired) {
            return (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 inline-flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Vencido
                </span>
            );
        }
        return (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                En revisión
            </span>
        );
    })();

    // Cuando el doc tiene vencimiento y el usuario elige archivo, pedimos
    // también la fecha de vencimiento antes de disparar el upload. Así
    // /api/driver/documents/update recibe ambos campos juntos y el
    // notifiedStage se resetea correctamente.
    const needsExpiration = doc.hasExpiration;
    const canUploadNow = pendingFile && (!needsExpiration || pendingExpiration);

    const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (needsExpiration) {
            setPendingFile(file);
        } else {
            onUploadFile(file);
        }
        // Reset input para permitir volver a elegir el mismo archivo
        e.target.value = "";
    };

    const handleConfirmUpload = () => {
        if (!pendingFile) return;
        onUploadFile(pendingFile, pendingExpiration || null);
        setPendingFile(null);
        setPendingExpiration("");
    };

    const handleCancelUpload = () => {
        setPendingFile(null);
        setPendingExpiration("");
    };

    return (
        <div
            className={`p-3 rounded-lg border ${isApproved
                ? "bg-green-50/40 dark:bg-green-500/5 border-green-200 dark:border-green-500/30"
                : isRejected || isExpired
                    ? "bg-red-50/40 dark:bg-red-500/5 border-red-200 dark:border-red-500/30"
                    : "bg-gray-50 dark:bg-[#22252f] border-gray-100 dark:border-white/10"
                }`}
        >
            <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {doc.shortLabel}
                        </span>
                        {statusChip}
                        {doc.hasExpiration && state.expiresAt && (
                            <ExpirationBadge dateIso={state.expiresAt} />
                        )}
                    </div>
                    {doc.helpText && !hasValue && (
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                            {doc.helpText}
                        </p>
                    )}
                    {isApproved && state.approvedAt && (
                        <p className="text-[11px] text-green-700 dark:text-green-400 mt-1">
                            Aprobado el {new Date(state.approvedAt).toLocaleDateString("es-AR")}
                        </p>
                    )}
                </div>
            </div>

            {/* Motivo de rechazo visible */}
            {(isRejected || isExpired) && state.rejectionReason && (
                <div className="mt-2 p-2.5 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded text-xs text-red-700 dark:text-red-300">
                    <span className="font-semibold">Motivo:</span> {state.rejectionReason}
                </div>
            )}

            {/* Acción: para CUIT (text) input + botón Guardar; para URL docs
                 label-as-button con input file oculto, o modal confirm cuando
                 hay vencimiento a capturar. */}
            <div className="mt-3 space-y-2">
                {doc.kind === "text" && !isApproved && (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={cuitDraft}
                            onChange={(e) => onCuitDraftChange(e.target.value)}
                            placeholder={doc.placeholder}
                            disabled={saving}
                            className="flex-1 min-w-0 px-3 py-2 text-sm border dark:bg-[#22252f] dark:border-white/10 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                            type="button"
                            onClick={onSaveCuit}
                            disabled={saving || !cuitDraft.trim()}
                            className="px-3 py-2 text-sm font-medium rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 flex items-center gap-1"
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {hasValue ? "Actualizar" : "Guardar"}
                        </button>
                    </div>
                )}

                {doc.kind === "text" && isApproved && (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                        <span className="font-mono text-gray-900 dark:text-white">{state.value}</span>
                    </div>
                )}

                {doc.kind === "url" && !isApproved && !pendingFile && (
                    <label
                        className={`inline-flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition ${uploading
                            ? "bg-gray-300 dark:bg-white/10 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                            : hasValue
                                ? "bg-amber-500 text-white hover:bg-amber-600"
                                : "bg-green-500 text-white hover:bg-green-600"
                            }`}
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Subiendo...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" />
                                {hasValue ? "Reemplazar documento" : "Subir documento"}
                            </>
                        )}
                        <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleFilePicked}
                            disabled={uploading}
                            className="hidden"
                        />
                    </label>
                )}

                {/* Flujo con vencimiento: confirm step */}
                {doc.kind === "url" && !isApproved && pendingFile && (
                    <div className="p-3 bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-lg space-y-2">
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <FileText className="w-4 h-4 text-green-600" />
                            <span className="truncate flex-1 min-w-0">{pendingFile.name}</span>
                            <button
                                type="button"
                                onClick={handleCancelUpload}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded"
                                aria-label="Cancelar"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300">
                            Fecha de vencimiento
                            <input
                                type="date"
                                value={pendingExpiration}
                                onChange={(e) => setPendingExpiration(e.target.value)}
                                className="mt-1 w-full px-3 py-2 text-sm border dark:bg-[#22252f] dark:border-white/10 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </label>
                        <button
                            type="button"
                            onClick={handleConfirmUpload}
                            disabled={!canUploadNow || uploading}
                            className="w-full px-3 py-2 text-sm font-medium rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Subiendo...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    Subir con vencimiento
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* APPROVED: solo se ve el archivo + botón solicitar cambio */}
                {isApproved && (
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        {doc.kind === "url" && state.value && (
                            <a
                                href={state.value}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-green-600 dark:text-green-400 hover:underline flex items-center gap-1"
                            >
                                <FileText className="w-3 h-3" />
                                Ver documento
                            </a>
                        )}
                        <button
                            type="button"
                            onClick={onRequestChange}
                            disabled={hasPendingChangeRequest}
                            className="ml-auto px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-500/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                            <MessageSquare className="w-3 h-3" />
                            {hasPendingChangeRequest ? "Solicitud pendiente" : "Solicitar cambio"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── ChangeRequestModal ───────────────────────────────────────────────────────

function DriverChangeRequestModal({
    doc,
    onClose,
    onSubmit,
}: {
    doc: DocDescriptor;
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
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="driver-change-request-title"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-[#1a1d27] rounded-xl w-full max-w-md shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between p-5 border-b border-gray-100 dark:border-white/10">
                    <div>
                        <h3
                            id="driver-change-request-title"
                            className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"
                        >
                            <MessageSquare className="w-5 h-5 text-green-600" />
                            Solicitar cambio
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{doc.label}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500"
                        aria-label="Cerrar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 space-y-3">
                    <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg text-xs text-amber-800 dark:text-amber-300 flex gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <p>
                            Este documento ya fue aprobado. Para modificarlo necesitamos que el equipo de Moovy autorice el cambio.
                            Explicá brevemente por qué tenés que actualizarlo (renovación, error en la carga anterior,
                            cambio de vehículo, etc.).
                        </p>
                    </div>

                    <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Motivo del cambio
                        </span>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ej: renové mi RTO y tengo que actualizar la nueva fecha de vencimiento"
                            maxLength={500}
                            rows={4}
                            disabled={submitting}
                            className="w-full mt-1 px-3 py-2 border dark:bg-[#22252f] dark:border-white/10 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-sm"
                        />
                        <div className="flex items-center justify-between text-[10px] mt-1">
                            <span className={tooShort ? "text-red-600" : "text-gray-500 dark:text-gray-400"}>
                                {tooShort ? "Mínimo 10 caracteres" : "Mínimo 10, máximo 500 caracteres"}
                            </span>
                            <span className={tooLong ? "text-red-600" : "text-gray-500 dark:text-gray-400"}>
                                {trimmed.length} / 500
                            </span>
                        </div>
                    </label>
                </div>

                <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-100 dark:border-white/10">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-60"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                        Enviar solicitud
                    </button>
                </div>
            </div>
        </div>
    );
}
