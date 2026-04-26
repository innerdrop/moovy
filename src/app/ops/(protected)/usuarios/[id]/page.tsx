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
import { useSession } from "next-auth/react";
import { toast } from "@/store/toast";
import { confirm } from "@/store/confirm";
import { formatPrice } from "@/lib/delivery";
import { UserAdminActions } from "@/components/ops/UserAdminActions";
import { UserActivityLog } from "@/components/ops/UserActivityLog";
import { AdminNotesSection } from "@/components/ops/AdminNotesSection";
import ImageUpload from "@/components/ui/ImageUpload";
import DocApprovalModal from "@/components/ops/DocApprovalModal";

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
    // ISSUE-062: estado de bloqueo por intentos fallidos
    failedLoginAttempts?: number;
    loginLockedUntil?: string | null;
    roles: Array<{ id: string; role: string; isActive: boolean; activatedAt: string }>;
    merchant: MerchantData | null;
    driver: DriverData | null;
    seller: SellerData | null;
    addresses: Address[];
    recentOrders: Order[];
    pointsTransactions: PointsTransaction[];
    stats: {
        totalOrders: number;
        totalSpent: number;
        openOrdersValue?: number;
        openOrdersCount?: number;
        memberSince: string;
    };
}

type DocStatus = "PENDING" | "APPROVED" | "REJECTED";

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
    isSuspended: boolean;
    suspendedAt: string | null;
    suspendedUntil: string | null;
    suspensionReason: string | null;
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
    bankAccount: string | null;
    constanciaAfipUrl: string | null;
    habilitacionMunicipalUrl: string | null;
    registroSanitarioUrl: string | null;
    // Per-doc approval status (granular, fix/onboarding-comercio-completo)
    cuitStatus: DocStatus;
    cuitApprovedAt: string | null;
    cuitRejectionReason: string | null;
    bankAccountStatus: DocStatus;
    bankAccountApprovedAt: string | null;
    bankAccountRejectionReason: string | null;
    constanciaAfipStatus: DocStatus;
    constanciaAfipApprovedAt: string | null;
    constanciaAfipRejectionReason: string | null;
    habilitacionMunicipalStatus: DocStatus;
    habilitacionMunicipalApprovedAt: string | null;
    habilitacionMunicipalRejectionReason: string | null;
    registroSanitarioStatus: DocStatus;
    registroSanitarioApprovedAt: string | null;
    registroSanitarioRejectionReason: string | null;
    approvedAt: string | null;
    rejectionReason: string | null;
    createdAt: string;
    updatedAt: string;
    _count: { orders: number; products: number };
}

interface ChangeRequest {
    id: string;
    documentField: string;
    reason: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    resolvedAt: string | null;
    resolvedBy: string | null;
    resolvedByName: string | null;
    resolutionNote: string | null;
    createdAt: string;
    updatedAt: string;
}

interface DriverData {
    id: string;
    vehicleType: string | null;
    vehicleBrand: string | null;
    vehicleModel: string | null;
    vehicleYear: number | null;
    vehicleColor: string | null;
    licensePlate: string | null;
    // Docs (texto + URLs)
    cuit: string | null;
    constanciaCuitUrl: string | null;
    dniFrenteUrl: string | null;
    dniDorsoUrl: string | null;
    licenciaUrl: string | null;
    seguroUrl: string | null;
    vtvUrl: string | null;
    cedulaVerdeUrl: string | null;
    // Status/approvedAt/rejectionReason triples (8 docs)
    cuitStatus: DocStatus;
    cuitApprovedAt: string | null;
    cuitRejectionReason: string | null;
    constanciaCuitStatus: DocStatus;
    constanciaCuitApprovedAt: string | null;
    constanciaCuitRejectionReason: string | null;
    dniFrenteStatus: DocStatus;
    dniFrenteApprovedAt: string | null;
    dniFrenteRejectionReason: string | null;
    dniDorsoStatus: DocStatus;
    dniDorsoApprovedAt: string | null;
    dniDorsoRejectionReason: string | null;
    licenciaStatus: DocStatus;
    licenciaApprovedAt: string | null;
    licenciaRejectionReason: string | null;
    seguroStatus: DocStatus;
    seguroApprovedAt: string | null;
    seguroRejectionReason: string | null;
    vtvStatus: DocStatus;
    vtvApprovedAt: string | null;
    vtvRejectionReason: string | null;
    cedulaVerdeStatus: DocStatus;
    cedulaVerdeApprovedAt: string | null;
    cedulaVerdeRejectionReason: string | null;
    // Vencimientos + stage de notificación (4 docs)
    licenciaExpiresAt: string | null;
    licenciaNotifiedStage: number;
    seguroExpiresAt: string | null;
    seguroNotifiedStage: number;
    vtvExpiresAt: string | null;
    vtvNotifiedStage: number;
    cedulaVerdeExpiresAt: string | null;
    cedulaVerdeNotifiedStage: number;
    isActive: boolean;
    isOnline: boolean;
    totalDeliveries: number;
    rating: number | null;
    isSuspended: boolean;
    suspendedAt: string | null;
    suspendedUntil: string | null;
    suspensionReason: string | null;
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
    isSuspended: boolean;
    suspendedAt: string | null;
    suspendedUntil: string | null;
    suspensionReason: string | null;
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

// Mirror del FOOD_BUSINESS_TYPES del lib server. Cliente-side para decidir si
// mostrar el card de Registro Sanitario como requerido.
const FOOD_CATEGORIES_CLIENT = new Set([
    "Restaurante",
    "Pizzería",
    "Hamburguesería",
    "Parrilla",
    "Cafetería",
    "Heladería",
    "Panadería/Pastelería",
    "Sushi",
    "Comida Saludable",
    "Rotisería",
    "Bebidas",
    "Vinoteca/Licorería",
]);

// Labels human-readable por documentField (para toasts y headers).
const DOC_LABELS: Record<string, string> = {
    cuit: "CUIT",
    bankAccount: "CBU/Alias",
    constanciaAfipUrl: "Constancia AFIP",
    habilitacionMunicipalUrl: "Habilitación Municipal",
    registroSanitarioUrl: "Registro Sanitario",
};

// Mirror del DRIVER_DOCUMENT_COLUMNS del lib (src/lib/driver-document-approval.ts).
// Labels usados en toasts, headers y modales del admin driver.
const DRIVER_DOC_LABELS: Record<string, string> = {
    cuit: "CUIT/CUIL",
    constanciaCuitUrl: "Constancia de Inscripción AFIP / Monotributo",
    dniFrenteUrl: "DNI (frente)",
    dniDorsoUrl: "DNI (dorso)",
    licenciaUrl: "Licencia de conducir",
    seguroUrl: "Póliza de seguro",
    vtvUrl: "RTO (Revisión Técnica)",
    cedulaVerdeUrl: "Cédula verde",
};

// Mirror del NON_MOTORIZED_TYPES del lib server. Cliente-side para decidir si
// mostrar los 4 docs motorizados (licencia/seguro/RTO/cédula verde).
const NON_MOTORIZED_TYPES_CLIENT = new Set([
    "BICI",
    "BICICLETA",
    "PATIN",
    "PATINETA",
    "TRICI",
]);

function isMotorizedVehicleClient(vehicleType: string | null | undefined): boolean {
    if (!vehicleType) return false;
    return !NON_MOTORIZED_TYPES_CLIENT.has(vehicleType.toUpperCase());
}

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
    const { data: session } = useSession();
    const currentAdminId = (session?.user as { id?: string } | undefined)?.id || null;

    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState<"info" | "actions" | "activity">("info");

    // Cerradas por default. El admin expande la que necesita consultar —
    // evita que al abrir la ficha se dispare un muro de información sin foco.
    const [expandedMerchant, setExpandedMerchant] = useState(false);
    const [expandedDriver, setExpandedDriver] = useState(false);
    const [expandedSeller, setExpandedSeller] = useState(false);

    // Change requests del merchant — se cargan en paralelo con el user detail.
    // Append-only (pending + histórico), se refresca junto con fetchUser.
    const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
    // Change requests del driver — mismo patrón, endpoint paralelo.
    const [driverChangeRequests, setDriverChangeRequests] = useState<ChangeRequest[]>([]);
    // Doc que está siendo procesado (para deshabilitar solo ese card y no toda la sección).
    // Compartido entre merchant y driver (no pueden procesarse simultáneamente en la misma página).
    const [docProcessing, setDocProcessing] = useState<string | null>(null);

    // Estado del modal de aprobación de documento (merchant + driver).
    // Reemplaza el flujo viejo basado en window.confirm/window.prompt nativos.
    // null = modal cerrado. Cuando hay objeto, el modal se muestra para ese doc.
    // Se diferencia merchant/driver con el campo `entity` para que el callback
    // sepa a qué endpoint pegar.
    const [approvalModal, setApprovalModal] = useState<
        | { entity: "merchant" | "driver"; field: string; label: string }
        | null
    >(null);
    const [approvalSubmitting, setApprovalSubmitting] = useState(false);

    useEffect(() => {
        fetchUser();
    }, [userId]);

    const fetchUser = async () => {
        try {
            const res = await fetch(`/api/admin/users-unified/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                // Si el usuario tiene merchant, levantamos las change requests en paralelo.
                if (data.merchant?.id) {
                    fetchChangeRequests(data.merchant.id);
                }
                // Mismo tratamiento para driver.
                if (data.driver?.id) {
                    fetchDriverChangeRequests(data.driver.id);
                }
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

    const fetchChangeRequests = async (merchantId: string) => {
        try {
            const res = await fetch(`/api/admin/merchants/${merchantId}/change-requests`);
            if (res.ok) {
                const data = await res.json();
                setChangeRequests(data.requests || []);
            }
        } catch (error) {
            console.error("Error fetching change requests:", error);
        }
    };

    const fetchDriverChangeRequests = async (driverId: string) => {
        try {
            const res = await fetch(`/api/admin/drivers/${driverId}/change-requests`);
            if (res.ok) {
                const data = await res.json();
                setDriverChangeRequests(data.requests || []);
            }
        } catch (error) {
            console.error("Error fetching driver change requests:", error);
        }
    };

    /**
     * Abre el modal Moovy para aprobar un doc del merchant. La lógica de validación
     * (DIGITAL vs PHYSICAL + nota mín 5 chars) vive dentro del DocApprovalModal —
     * acá sólo abrimos el modal con el contexto del doc. El submit final pasa por
     * `submitApprovalDecision` (callback compartido entre merchant y driver).
     */
    const handleApproveDocument = (field: string) => {
        if (!user?.merchant) return;
        const docLabel = DOC_LABELS[field] || field;
        setApprovalModal({ entity: "merchant", field, label: docLabel });
    };

    /**
     * Callback del DocApprovalModal cuando el admin confirma.
     * Recibe { source, note } ya validados y dispara el fetch al endpoint
     * correspondiente según la entidad (merchant o driver).
     */
    const submitApprovalDecision = async (decision: { source: "DIGITAL" | "PHYSICAL"; note: string | null }) => {
        if (!approvalModal) return;
        const { entity, field, label } = approvalModal;
        const isPhysical = decision.source === "PHYSICAL";

        setApprovalSubmitting(true);
        setDocProcessing(field);
        try {
            const url = entity === "merchant"
                ? `/api/admin/merchants/${user?.merchant?.id}/documents/approve`
                : `/api/admin/drivers/${user?.driver?.id}/documents/approve`;
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    field,
                    source: decision.source,
                    note: decision.note,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                const autoActivated = entity === "merchant"
                    ? data.merchantAutoActivated
                    : data.driverAutoActivated;
                const entityLabel = entity === "merchant" ? "Comercio" : "Repartidor";
                if (autoActivated) {
                    toast.success(`✓ ${data.label || label} aprobado. ¡${entityLabel} activado!`);
                } else {
                    toast.success(`${data.label || label} aprobado${isPhysical ? " (físico)" : ""}`);
                }
                fetchUser();
                setApprovalModal(null);
            } else {
                // Errores típicos: LOGO_MISSING / PHOTO_MISSING (auto-activación bloqueada),
                // o validación del backend (nota muy corta, doc ya aprobado, etc.).
                toast.error(data.error || "Error al aprobar el documento");
            }
        } catch (error) {
            console.error("Error approving document:", error);
            toast.error("Error de conexión");
        } finally {
            setApprovalSubmitting(false);
            setDocProcessing(null);
        }
    };

    const handleRejectDocument = async (field: string, label: string) => {
        if (!user?.merchant) return;
        const reason = window.prompt(`Motivo de rechazo para ${label} (obligatorio, mín. 3 caracteres):`);
        if (!reason || reason.trim().length < 3) {
            toast.error("Debés indicar un motivo de al menos 3 caracteres");
            return;
        }
        const ok = await confirm({
            title: `Rechazar ${label}`,
            message: `¿Confirmar el rechazo?\n\nMotivo: ${reason.trim()}\n\nEl comercio recibirá un email con el motivo y podrá re-subir el documento.`,
            confirmLabel: "Rechazar",
            variant: "danger",
        });
        if (!ok) return;

        setDocProcessing(field);
        try {
            const res = await fetch(
                `/api/admin/merchants/${user.merchant.id}/documents/reject`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ field, reason: reason.trim() }),
                }
            );
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                toast.success(`${label} rechazado. Se notificó al comercio.`);
                fetchUser();
            } else {
                toast.error(data.error || "Error al rechazar el documento");
            }
        } catch (error) {
            console.error("Error rejecting document:", error);
            toast.error("Error de conexión");
        } finally {
            setDocProcessing(null);
        }
    };

    const handleResolveChangeRequest = async (
        requestId: string,
        status: "APPROVED" | "REJECTED",
        label: string
    ) => {
        if (!user?.merchant) return;
        let note = "";
        if (status === "REJECTED") {
            const input = window.prompt(
                `Motivo para rechazar la solicitud de cambio (${label}) (obligatorio, mín. 3 caracteres):`
            );
            if (!input || input.trim().length < 3) {
                toast.error("Debés indicar un motivo de al menos 3 caracteres");
                return;
            }
            note = input.trim();
        } else {
            const input = window.prompt(
                `Comentario opcional para el comercio sobre por qué se autoriza el cambio (dejá vacío para ninguno):`
            );
            note = input ? input.trim() : "";
        }

        const ok = await confirm({
            title: status === "APPROVED" ? "Autorizar cambio" : "Rechazar solicitud",
            message:
                status === "APPROVED"
                    ? `¿Autorizar al comercio a reemplazar ${label}?\n\nEl documento volverá a estado PENDIENTE hasta que suba uno nuevo.`
                    : `¿Confirmar el rechazo de la solicitud?\n\nMotivo: ${note}`,
            confirmLabel: status === "APPROVED" ? "Autorizar" : "Rechazar",
            variant: status === "APPROVED" ? "default" : "danger",
        });
        if (!ok) return;

        setProcessing(true);
        try {
            const res = await fetch(
                `/api/admin/merchants/${user.merchant.id}/change-requests/${requestId}/resolve`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status, note }),
                }
            );
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                toast.success(
                    status === "APPROVED"
                        ? `Solicitud autorizada. ${data.documentLabel || label} volvió a PENDIENTE.`
                        : "Solicitud rechazada."
                );
                fetchUser();
            } else {
                toast.error(data.error || "Error al resolver la solicitud");
            }
        } catch (error) {
            console.error("Error resolving change request:", error);
            toast.error("Error de conexión");
        } finally {
            setProcessing(false);
        }
    };

    // =====================================================================
    // Driver — handlers de aprobación per-doc y change requests.
    // Misma lógica que merchant pero contra /api/admin/drivers/[id]/...
    // =====================================================================

    /**
     * Abre el modal Moovy para aprobar un doc del driver.
     * Comparte el mismo modal y callback que el handler del merchant — la
     * diferencia se resuelve por el campo `entity` del estado approvalModal.
     */
    const handleApproveDriverDocument = (field: string) => {
        if (!user?.driver) return;
        const label = DRIVER_DOC_LABELS[field] || field;
        setApprovalModal({ entity: "driver", field, label });
    };

    const handleRejectDriverDocument = async (field: string, label: string) => {
        if (!user?.driver) return;
        const reason = window.prompt(`Motivo de rechazo para ${label} (obligatorio, mín. 3 caracteres):`);
        if (!reason || reason.trim().length < 3) {
            toast.error("Debés indicar un motivo de al menos 3 caracteres");
            return;
        }
        const ok = await confirm({
            title: `Rechazar ${label}`,
            message: `¿Confirmar el rechazo?\n\nMotivo: ${reason.trim()}\n\nEl repartidor recibirá un email con el motivo y podrá re-subir el documento.`,
            confirmLabel: "Rechazar",
            variant: "danger",
        });
        if (!ok) return;

        setDocProcessing(field);
        try {
            const res = await fetch(
                `/api/admin/drivers/${user.driver.id}/documents/reject`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ field, reason: reason.trim() }),
                }
            );
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                toast.success(`${label} rechazado. Se notificó al repartidor.`);
                fetchUser();
            } else {
                toast.error(data.error || "Error al rechazar el documento");
            }
        } catch (error) {
            console.error("Error rejecting driver document:", error);
            toast.error("Error de conexión");
        } finally {
            setDocProcessing(null);
        }
    };

    const handleResolveDriverChangeRequest = async (
        requestId: string,
        status: "APPROVED" | "REJECTED",
        label: string
    ) => {
        if (!user?.driver) return;
        let note = "";
        if (status === "REJECTED") {
            const input = window.prompt(
                `Motivo para rechazar la solicitud de cambio (${label}) (obligatorio, mín. 3 caracteres):`
            );
            if (!input || input.trim().length < 3) {
                toast.error("Debés indicar un motivo de al menos 3 caracteres");
                return;
            }
            note = input.trim();
        } else {
            const input = window.prompt(
                `Comentario opcional para el repartidor sobre por qué se autoriza el cambio (dejá vacío para ninguno):`
            );
            note = input ? input.trim() : "";
        }

        const ok = await confirm({
            title: status === "APPROVED" ? "Autorizar cambio" : "Rechazar solicitud",
            message:
                status === "APPROVED"
                    ? `¿Autorizar al repartidor a reemplazar ${label}?\n\nEl documento volverá a estado PENDIENTE hasta que suba uno nuevo.`
                    : `¿Confirmar el rechazo de la solicitud?\n\nMotivo: ${note}`,
            confirmLabel: status === "APPROVED" ? "Autorizar" : "Rechazar",
            variant: status === "APPROVED" ? "default" : "danger",
        });
        if (!ok) return;

        setProcessing(true);
        try {
            const res = await fetch(
                `/api/admin/drivers/${user.driver.id}/change-requests/${requestId}/resolve`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status, note }),
                }
            );
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                toast.success(
                    status === "APPROVED"
                        ? `Solicitud autorizada. ${data.documentLabel || label} volvió a PENDIENTE.`
                        : "Solicitud rechazada."
                );
                fetchUser();
            } else {
                toast.error(data.error || "Error al resolver la solicitud");
            }
        } catch (error) {
            console.error("Error resolving driver change request:", error);
            toast.error("Error de conexión");
        } finally {
            setProcessing(false);
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

        const roleName = roleType === "merchant" ? "Comercio" : "Repartidor";

        // Pedir motivo de rechazo (obligatorio)
        const reason = window.prompt(`Motivo de rechazo para ${roleName} (obligatorio):`);
        if (!reason || !reason.trim()) {
            toast.error("Debés indicar un motivo de rechazo");
            return;
        }

        const ok = await confirm({
            title: `Rechazar ${roleName}`,
            message: `¿Confirmar el rechazo de "${roleType === "merchant" ? (roleData as MerchantData).name : "Repartidor"}"?\n\nMotivo: ${reason.trim()}`,
            confirmLabel: "Rechazar",
            variant: "danger",
        });

        if (!ok) return;

        setProcessing(true);
        try {
            const endpoint = roleType === "merchant"
                ? `/api/admin/merchants/${roleData.id}/reject`
                : `/api/admin/drivers/${roleData.id}/reject`;

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: reason.trim() }),
            });

            if (res.ok) {
                toast.success(`${roleName} rechazado correctamente`);
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
                            {(user.stats.openOrdersCount ?? 0) > 0 && (
                                <p className="text-[10px] text-green-700/70 mt-1 font-medium">
                                    + {formatPrice(user.stats.openOrdersValue ?? 0)} en {user.stats.openOrdersCount} pedido{user.stats.openOrdersCount === 1 ? "" : "s"} abierto{user.stats.openOrdersCount === 1 ? "" : "s"}
                                </p>
                            )}
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

            {/* Notas internas del admin — visibles en toda pestaña.
                Mostramos solo cuando la sesión ya cargó el id del admin actual,
                porque la UI depende de ese valor para ownership (editar/pin). */}
            {currentAdminId && (
                <AdminNotesSection userId={userId} currentAdminId={currentAdminId} />
            )}

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
                            {/* Approval Status — editable */}
                            <div className="space-y-3">
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
                                {user.merchant.rejectionReason && (
                                    <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                                        Motivo: {user.merchant.rejectionReason}
                                    </p>
                                )}
                                <div className="flex gap-2 flex-wrap">
                                    {user.merchant.approvalStatus !== "APPROVED" && (
                                        <button
                                            onClick={() => handleApproveRole("merchant")}
                                            disabled={processing}
                                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-xs font-bold py-2 px-4 rounded-lg transition inline-flex items-center gap-1.5"
                                        >
                                            {processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                            Aprobar
                                        </button>
                                    )}
                                    {user.merchant.approvalStatus !== "REJECTED" && (
                                        <button
                                            onClick={() => handleRejectRole("merchant")}
                                            disabled={processing}
                                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-xs font-bold py-2 px-4 rounded-lg transition inline-flex items-center gap-1.5"
                                        >
                                            {processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                                            Rechazar
                                        </button>
                                    )}
                                </div>
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

                            {/* Documentación granular — aprobación doc por doc.
                                Reemplaza el "Ver / Sin cargar" simple por un card
                                por cada documento con status chip + botones
                                Aprobar/Rechazar. El merchant se auto-activa
                                cuando todos los docs requeridos están APPROVED. */}
                            <div className="border-t border-slate-200 pt-4">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-xs font-bold text-gray-500 uppercase">
                                        Documentación
                                    </p>
                                    {(() => {
                                        const isFood = FOOD_CATEGORIES_CLIENT.has(
                                            user.merchant.category || ""
                                        );
                                        const required: Array<{
                                            status: DocStatus;
                                            label: string;
                                        }> = [
                                            { status: user.merchant.cuitStatus, label: "CUIT" },
                                            {
                                                status: user.merchant.bankAccountStatus,
                                                label: "CBU/Alias",
                                            },
                                            {
                                                status: user.merchant.constanciaAfipStatus,
                                                label: "Constancia AFIP",
                                            },
                                            {
                                                status: user.merchant.habilitacionMunicipalStatus,
                                                label: "Habilitación Municipal",
                                            },
                                        ];
                                        if (isFood) {
                                            required.push({
                                                status: user.merchant.registroSanitarioStatus,
                                                label: "Registro Sanitario",
                                            });
                                        }
                                        const approved = required.filter(
                                            (d) => d.status === "APPROVED"
                                        ).length;
                                        const allApproved = approved === required.length;
                                        return (
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                    allApproved
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-amber-100 text-amber-700"
                                                }`}
                                            >
                                                {approved}/{required.length} aprobados
                                            </span>
                                        );
                                    })()}
                                </div>

                                {/* Logo del comercio — gestionable desde OPS para casos donde el merchant
                                    entrega el logo fuera del sistema (USB, WhatsApp, email). El admin lo sube
                                    en su nombre para destrabar la aprobación (que requiere logo presente). */}
                                <MerchantLogoAdmin
                                    merchantId={user.merchant.id}
                                    currentImage={user.merchant.image ?? null}
                                    onUpdated={fetchUser}
                                />

                                <MerchantDocumentsAdmin
                                    merchant={user.merchant}
                                    docProcessing={docProcessing}
                                    onApprove={handleApproveDocument}
                                    onReject={handleRejectDocument}
                                />
                            </div>

                            {/* Solicitudes de cambio de documentos (post-APPROVED).
                                El merchant pidió reemplazar algo que ya estaba
                                aprobado y OPS tiene que autorizarlo. */}
                            <div className="border-t border-slate-200 pt-4">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-xs font-bold text-gray-500 uppercase">
                                        Solicitudes de cambio
                                    </p>
                                    {changeRequests.filter((r) => r.status === "PENDING").length >
                                        0 && (
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                            {
                                                changeRequests.filter((r) => r.status === "PENDING")
                                                    .length
                                            }{" "}
                                            pendiente
                                            {changeRequests.filter((r) => r.status === "PENDING")
                                                .length === 1
                                                ? ""
                                                : "s"}
                                        </span>
                                    )}
                                </div>
                                <ChangeRequestsAdmin
                                    requests={changeRequests}
                                    processing={processing}
                                    onResolve={handleResolveChangeRequest}
                                />
                            </div>

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
                            {/* Approval Status — editable */}
                            <div className="space-y-3">
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
                                {user.driver.rejectionReason && (
                                    <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                                        Motivo: {user.driver.rejectionReason}
                                    </p>
                                )}
                                <div className="flex gap-2 flex-wrap">
                                    {user.driver.approvalStatus !== "APPROVED" && (
                                        <button
                                            onClick={() => handleApproveRole("driver")}
                                            disabled={processing}
                                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-xs font-bold py-2 px-4 rounded-lg transition inline-flex items-center gap-1.5"
                                        >
                                            {processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                            Aprobar
                                        </button>
                                    )}
                                    {user.driver.approvalStatus !== "REJECTED" && (
                                        <button
                                            onClick={() => handleRejectRole("driver")}
                                            disabled={processing}
                                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-xs font-bold py-2 px-4 rounded-lg transition inline-flex items-center gap-1.5"
                                        >
                                            {processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                                            Rechazar
                                        </button>
                                    )}
                                </div>
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

                            {/* Documents — aprobación granular per-doc con status chips,
                                cédula verde + constancia CUIT incluidas, y badges de
                                vencimiento en licencia/seguro/RTO/cédula verde. */}
                            <div className="border-t border-slate-200 pt-4">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-4">
                                    Documentación
                                </p>
                                <DriverDocumentsAdmin
                                    driver={user.driver}
                                    docProcessing={docProcessing}
                                    onApprove={handleApproveDriverDocument}
                                    onReject={handleRejectDriverDocument}
                                />
                            </div>

                            {/* Solicitudes de cambio del repartidor */}
                            <div className="border-t border-slate-200 pt-4">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-4">
                                    Solicitudes de cambio de documento
                                </p>
                                <DriverChangeRequestsAdmin
                                    requests={driverChangeRequests}
                                    processing={processing}
                                    onResolve={handleResolveDriverChangeRequest}
                                />
                            </div>
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
                    deletedAt={user.deletedAt}
                    merchant={user.merchant ? {
                        id: user.merchant.id,
                        isSuspended: user.merchant.isSuspended,
                        suspendedUntil: user.merchant.suspendedUntil,
                        suspensionReason: user.merchant.suspensionReason,
                        commissionOverride: user.merchant.commissionOverride,
                        commissionOverrideReason: user.merchant.commissionOverrideReason,
                        loyaltyTier: user.merchant.loyaltyTier,
                        loyaltyTierLocked: user.merchant.loyaltyTierLocked,
                    } : undefined}
                    driver={user.driver ? {
                        id: user.driver.id,
                        isSuspended: user.driver.isSuspended,
                        suspendedUntil: user.driver.suspendedUntil,
                        suspensionReason: user.driver.suspensionReason,
                    } : undefined}
                    seller={user.seller ? {
                        id: user.seller.id,
                        isSuspended: user.seller.isSuspended,
                        suspendedUntil: user.seller.suspendedUntil,
                        suspensionReason: user.seller.suspensionReason,
                    } : undefined}
                    onRefresh={fetchUser}
                />

                {/* Legacy Actions Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Acciones Adicionales</h2>

                    {/* ISSUE-062: badge de bloqueo + contador de intentos */}
                    {(() => {
                        const lockedUntil = user.loginLockedUntil ? new Date(user.loginLockedUntil) : null;
                        const isLocked = lockedUntil !== null && lockedUntil > new Date();
                        const failedAttempts = user.failedLoginAttempts ?? 0;
                        if (!isLocked && failedAttempts === 0) return null;
                        return (
                            <div className={`mb-6 rounded-lg border p-4 ${isLocked ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
                                <div className="flex items-start gap-3">
                                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${isLocked ? "bg-red-100" : "bg-amber-100"}`}>
                                        {isLocked ? (
                                            <Lock className="w-5 h-5 text-red-600" />
                                        ) : (
                                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-semibold text-sm ${isLocked ? "text-red-900" : "text-amber-900"}`}>
                                            {isLocked
                                                ? `Cuenta bloqueada hasta ${lockedUntil!.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}`
                                                : `${failedAttempts}/5 intentos fallidos consecutivos`}
                                        </p>
                                        <p className={`text-xs mt-1 ${isLocked ? "text-red-700" : "text-amber-700"}`}>
                                            {isLocked
                                                ? "El bloqueo se levanta solo a esa hora. El usuario también puede resetear su contraseña para entrar antes."
                                                : `El próximo fallo ${5 - failedAttempts === 1 ? "bloquea" : "acerca al bloqueo de"} la cuenta por 15 minutos.`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(() => {
                            const lockedUntil = user.loginLockedUntil ? new Date(user.loginLockedUntil) : null;
                            const isLocked = lockedUntil !== null && lockedUntil > new Date();
                            const failedAttempts = user.failedLoginAttempts ?? 0;
                            const showUnlock = isLocked || failedAttempts > 0;
                            if (!showUnlock) return null;
                            return (
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
                            );
                        })()}
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

            {/* Modal Moovy de aprobación de documento (merchant + driver).
                Reemplaza el flujo viejo basado en window.confirm + window.prompt.
                Se monta una sola vez — el state approvalModal decide qué entity
                + field aplicar cuando el admin confirma. */}
            <DocApprovalModal
                isOpen={approvalModal !== null}
                docLabel={approvalModal?.label ?? ""}
                submitting={approvalSubmitting}
                onClose={() => !approvalSubmitting && setApprovalModal(null)}
                onConfirm={submitApprovalDecision}
            />
        </div>
    );
}

// =====================================================================
// Sub-componentes de la sección Documentación
// =====================================================================

interface MerchantDocumentsAdminProps {
    merchant: MerchantData;
    docProcessing: string | null;
    onApprove: (field: string) => void;
    onReject: (field: string, label: string) => void;
}

/**
 * Lista de cards, uno por documento, con status chip + rejection reason
 * (si REJECTED) + botones Aprobar/Rechazar. La lista incluye el Registro
 * Sanitario sólo para rubros alimenticios.
 */
function MerchantDocumentsAdmin({
    merchant,
    docProcessing,
    onApprove,
    onReject,
}: MerchantDocumentsAdminProps) {
    const isFood = FOOD_CATEGORIES_CLIENT.has(merchant.category || "");

    const docs: Array<{
        field: string;
        label: string;
        value: string | null;
        status: DocStatus;
        approvedAt: string | null;
        rejectionReason: string | null;
        // Campos nuevos (rama ops-upload-logo-merchant): origen + nota de la
        // aprobación. Cuando admin aprueba PHYSICAL desde OPS, escribe acá la
        // nota describiendo cómo recibió el doc — la mostramos en la card para
        // que el admin recuerde su propia decisión post-mortem.
        approvalSource: string | null;
        approvalNote: string | null;
        isUrl: boolean; // true si `value` es URL para abrir; false si es texto a mostrar
        required: boolean;
    }> = [
        {
            field: "cuit",
            label: "CUIT",
            value: merchant.cuit,
            status: merchant.cuitStatus,
            approvedAt: merchant.cuitApprovedAt,
            rejectionReason: merchant.cuitRejectionReason,
            approvalSource: (merchant as any).cuitApprovalSource ?? null,
            approvalNote: (merchant as any).cuitApprovalNote ?? null,
            isUrl: false,
            required: true,
        },
        {
            field: "bankAccount",
            label: "CBU / Alias bancario",
            value: merchant.bankAccount,
            status: merchant.bankAccountStatus,
            approvedAt: merchant.bankAccountApprovedAt,
            rejectionReason: merchant.bankAccountRejectionReason,
            approvalSource: (merchant as any).bankAccountApprovalSource ?? null,
            approvalNote: (merchant as any).bankAccountApprovalNote ?? null,
            isUrl: false,
            required: true,
        },
        {
            field: "constanciaAfipUrl",
            label: "Constancia AFIP",
            value: merchant.constanciaAfipUrl,
            status: merchant.constanciaAfipStatus,
            approvedAt: merchant.constanciaAfipApprovedAt,
            rejectionReason: merchant.constanciaAfipRejectionReason,
            approvalSource: (merchant as any).constanciaAfipApprovalSource ?? null,
            approvalNote: (merchant as any).constanciaAfipApprovalNote ?? null,
            isUrl: true,
            required: true,
        },
        {
            field: "habilitacionMunicipalUrl",
            label: "Habilitación Municipal",
            value: merchant.habilitacionMunicipalUrl,
            status: merchant.habilitacionMunicipalStatus,
            approvedAt: merchant.habilitacionMunicipalApprovedAt,
            rejectionReason: merchant.habilitacionMunicipalRejectionReason,
            approvalSource: (merchant as any).habilitacionMunicipalApprovalSource ?? null,
            approvalNote: (merchant as any).habilitacionMunicipalApprovalNote ?? null,
            isUrl: true,
            required: true,
        },
        {
            field: "registroSanitarioUrl",
            label: "Registro Sanitario / Bromatológico",
            value: merchant.registroSanitarioUrl,
            status: merchant.registroSanitarioStatus,
            approvedAt: merchant.registroSanitarioApprovedAt,
            rejectionReason: merchant.registroSanitarioRejectionReason,
            approvalSource: (merchant as any).registroSanitarioApprovalSource ?? null,
            approvalNote: (merchant as any).registroSanitarioApprovalNote ?? null,
            isUrl: true,
            required: isFood,
        },
    ];

    return (
        <div className="space-y-3">
            {docs.map((doc) => {
                const isThisProcessing = docProcessing === doc.field;
                const hasValue = doc.value !== null && doc.value !== "";
                const statusStyle =
                    statusLabels[doc.status] || {
                        label: doc.status,
                        color: "bg-gray-100 text-gray-800",
                    };

                // Registro sanitario en rubros no-food: se muestra como "No
                // requerido" si no tiene valor, pero si el merchant lo cargó
                // por su cuenta se valida igual (es opcional pero válido).
                const optionalAndEmpty = !doc.required && !hasValue;

                return (
                    <div
                        key={doc.field}
                        className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 transition"
                    >
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                    <p className="text-sm font-bold text-gray-900">
                                        {doc.label}
                                    </p>
                                    {!doc.required && (
                                        <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                                            Opcional
                                        </span>
                                    )}
                                    {optionalAndEmpty ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                                            <Clock className="w-3 h-3" /> No requerido
                                        </span>
                                    ) : (doc.status === "APPROVED" || doc.status === "REJECTED" || hasValue) ? (
                                        // APPROVED / REJECTED tienen prioridad sobre "Sin cargar":
                                        // si admin aprobó FÍSICO sin que el merchant cargue el valor,
                                        // el chip verde gana — el doc está dado por bueno.
                                        <span
                                            className={`px-2 py-0.5 rounded-md text-xs font-bold ${statusStyle.color}`}
                                        >
                                            {statusStyle.label}
                                            {doc.status === "APPROVED" && doc.approvalSource === "PHYSICAL" && " · físico"}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700">
                                            <AlertTriangle className="w-3 h-3" /> Sin cargar
                                        </span>
                                    )}
                                </div>

                                {/* Valor */}
                                {hasValue && (
                                    <div className="text-sm">
                                        {doc.isUrl ? (
                                            <a
                                                href={doc.value!}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[#e60012] hover:underline inline-flex items-center gap-1 text-xs font-medium"
                                            >
                                                <Eye className="w-3 h-3" /> Ver documento
                                            </a>
                                        ) : (
                                            <span className="text-gray-900 font-mono text-xs break-all">
                                                {doc.value}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Motivo de rechazo */}
                                {doc.status === "REJECTED" && doc.rejectionReason && (
                                    <div className="mt-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
                                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide mb-0.5">
                                            Motivo de rechazo
                                        </p>
                                        <p className="text-xs text-red-700">
                                            {doc.rejectionReason}
                                        </p>
                                    </div>
                                )}

                                {/* Fecha de aprobación */}
                                {doc.status === "APPROVED" && doc.approvedAt && (
                                    <p className="text-[10px] text-green-700 mt-2 font-medium">
                                        Aprobado el{" "}
                                        {new Date(doc.approvedAt).toLocaleDateString(
                                            "es-AR",
                                            {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            }
                                        )}
                                        {doc.approvalSource === "PHYSICAL" && " — recibido en papel"}
                                    </p>
                                )}

                                {/* Nota de aprobación FÍSICA — visible para que el admin
                                    recuerde su propia decisión cuando vuelve a revisar el
                                    comercio meses después. Auditoría AAIP la usa también. */}
                                {doc.status === "APPROVED" && doc.approvalSource === "PHYSICAL" && doc.approvalNote && (
                                    <div className="mt-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                                        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-0.5">
                                            Aprobación física — nota del admin
                                        </p>
                                        <p className="text-xs text-amber-900 whitespace-pre-wrap">
                                            {doc.approvalNote}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Botones Aprobar/Rechazar.
                                APPROVE: visible aunque no haya valor cargado, porque el
                                admin puede aprobar como PHYSICAL (recibió el doc fuera del
                                sistema). El handler pregunta DIGITAL/PHYSICAL.
                                REJECT: visible sólo si hay valor para rechazar. */}
                            <div className="flex gap-2 flex-shrink-0">
                                {doc.status !== "APPROVED" && (
                                    <button
                                        onClick={() => onApprove(doc.field)}
                                        disabled={isThisProcessing}
                                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition inline-flex items-center gap-1.5"
                                    >
                                        {isThisProcessing ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <CheckCircle className="w-3 h-3" />
                                        )}
                                        Aprobar
                                    </button>
                                )}
                                {hasValue && doc.status !== "REJECTED" && (
                                    <button
                                        onClick={() => onReject(doc.field, doc.label)}
                                        disabled={isThisProcessing}
                                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition inline-flex items-center gap-1.5"
                                    >
                                        {isThisProcessing ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <XCircle className="w-3 h-3" />
                                        )}
                                        Rechazar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

interface ChangeRequestsAdminProps {
    requests: ChangeRequest[];
    processing: boolean;
    onResolve: (requestId: string, status: "APPROVED" | "REJECTED", label: string) => void;
}

/**
 * Sección que lista solicitudes de cambio de documento. Primero las PENDING
 * (accionables con Autorizar/Rechazar), después el histórico resuelto.
 */
function ChangeRequestsAdmin({
    requests,
    processing,
    onResolve,
}: ChangeRequestsAdminProps) {
    if (requests.length === 0) {
        return (
            <div className="text-sm text-gray-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                Sin solicitudes de cambio.
            </div>
        );
    }

    const pending = requests.filter((r) => r.status === "PENDING");
    const resolved = requests.filter((r) => r.status !== "PENDING");

    return (
        <div className="space-y-3">
            {pending.map((req) => {
                const label = DOC_LABELS[req.documentField] || req.documentField;
                return (
                    <div
                        key={req.id}
                        className="border border-amber-200 bg-amber-50 rounded-xl p-4"
                    >
                        <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-bold text-amber-900">
                                        {label}
                                    </p>
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-200 text-amber-900">
                                        PENDIENTE
                                    </span>
                                </div>
                                <p className="text-[10px] text-amber-700 mt-1">
                                    Solicitado el{" "}
                                    {new Date(req.createdAt).toLocaleDateString("es-AR", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <button
                                    onClick={() => onResolve(req.id, "APPROVED", label)}
                                    disabled={processing}
                                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition inline-flex items-center gap-1.5"
                                >
                                    <CheckCircle className="w-3 h-3" /> Autorizar
                                </button>
                                <button
                                    onClick={() => onResolve(req.id, "REJECTED", label)}
                                    disabled={processing}
                                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition inline-flex items-center gap-1.5"
                                >
                                    <XCircle className="w-3 h-3" /> Rechazar
                                </button>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg px-3 py-2 border border-amber-200">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-0.5">
                                Motivo del comercio
                            </p>
                            <p className="text-xs text-gray-800">{req.reason}</p>
                        </div>
                    </div>
                );
            })}

            {resolved.length > 0 && (
                <details className="group">
                    <summary className="cursor-pointer text-xs font-bold text-gray-600 hover:text-gray-900 py-1 select-none inline-flex items-center gap-1">
                        <ChevronDown className="w-3 h-3 group-open:hidden" />
                        <ChevronUp className="w-3 h-3 hidden group-open:inline-block" />
                        Histórico ({resolved.length})
                    </summary>
                    <div className="space-y-2 mt-2">
                        {resolved.map((req) => {
                            const label = DOC_LABELS[req.documentField] || req.documentField;
                            const isApproved = req.status === "APPROVED";
                            return (
                                <div
                                    key={req.id}
                                    className={`border rounded-xl p-3 ${
                                        isApproved
                                            ? "bg-green-50 border-green-200"
                                            : "bg-slate-50 border-slate-200"
                                    }`}
                                >
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <p className="text-xs font-bold text-gray-900">
                                            {label}
                                        </p>
                                        <span
                                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                isApproved
                                                    ? "bg-green-200 text-green-900"
                                                    : "bg-red-200 text-red-900"
                                            }`}
                                        >
                                            {isApproved ? "AUTORIZADA" : "RECHAZADA"}
                                        </span>
                                        {req.resolvedAt && (
                                            <span className="text-[10px] text-gray-500">
                                                {new Date(req.resolvedAt).toLocaleDateString(
                                                    "es-AR"
                                                )}
                                            </span>
                                        )}
                                        {req.resolvedByName && (
                                            <span className="text-[10px] text-gray-500">
                                                por {req.resolvedByName}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-gray-700 mb-1">
                                        <span className="font-bold">Motivo:</span> {req.reason}
                                    </p>
                                    {req.resolutionNote && (
                                        <p className="text-[11px] text-gray-700">
                                            <span className="font-bold">Nota OPS:</span>{" "}
                                            {req.resolutionNote}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </details>
            )}
        </div>
    );
}

// =====================================================================
// Sub-componentes de la sección Documentación del REPARTIDOR
// =====================================================================

/**
 * Helpers de expiración: dado un ISO string, devuelve días restantes.
 * Valores negativos significan ya vencido.
 */
function daysUntil(dateIso: string | null): number | null {
    if (!dateIso) return null;
    const target = new Date(dateIso).getTime();
    if (isNaN(target)) return null;
    const now = Date.now();
    const ms = target - now;
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/**
 * Renderiza un badge de vencimiento con color escalonado según
 * cercanía al vencimiento (alineado con STAGE_THRESHOLDS del cron
 * driver-docs-expiry: 7d amber, 3d orange, 1d red, vencido dark red).
 */
function ExpirationBadge({ dateIso }: { dateIso: string | null }) {
    const days = daysUntil(dateIso);
    if (days === null) return null;

    const formatted = dateIso
        ? new Date(dateIso).toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
          })
        : "";

    // Vencido
    if (days < 0) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-200 text-red-900">
                <AlertTriangle className="w-3 h-3" />
                Vencido {formatted}
            </span>
        );
    }
    // ≤ 1 día
    if (days <= 1) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-800">
                <Clock className="w-3 h-3" />
                Vence {formatted} ({days}d)
            </span>
        );
    }
    // ≤ 3 días
    if (days <= 3) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-100 text-orange-800">
                <Clock className="w-3 h-3" />
                Vence {formatted} ({days}d)
            </span>
        );
    }
    // ≤ 7 días
    if (days <= 7) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                <Clock className="w-3 h-3" />
                Vence {formatted} ({days}d)
            </span>
        );
    }
    // > 7 días: muestra fecha neutral
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700">
            <Clock className="w-3 h-3" />
            Vence {formatted}
        </span>
    );
}

interface DriverDocumentsAdminProps {
    driver: DriverData;
    docProcessing: string | null;
    onApprove: (field: string) => void;
    onReject: (field: string, label: string) => void;
}

/**
 * Lista de cards, uno por documento del repartidor, con status chip,
 * motivo de rechazo, fecha de vencimiento (para los 4 docs motorizados)
 * y botones Aprobar/Rechazar. Los docs motorizados sólo se muestran si
 * el vehículo del repartidor lo requiere (isMotorizedVehicleClient).
 */
function DriverDocumentsAdmin({
    driver,
    docProcessing,
    onApprove,
    onReject,
}: DriverDocumentsAdminProps) {
    const motorized = isMotorizedVehicleClient(driver.vehicleType);

    const docs: Array<{
        field: string;
        label: string;
        value: string | null;
        status: DocStatus;
        approvedAt: string | null;
        rejectionReason: string | null;
        isUrl: boolean;
        required: boolean;
        expiresAt: string | null;
        hasExpiration: boolean;
    }> = [
        {
            field: "cuit",
            label: DRIVER_DOC_LABELS.cuit,
            value: driver.cuit,
            status: driver.cuitStatus,
            approvedAt: driver.cuitApprovedAt,
            rejectionReason: driver.cuitRejectionReason,
            isUrl: false,
            required: true,
            expiresAt: null,
            hasExpiration: false,
        },
        {
            field: "constanciaCuitUrl",
            label: DRIVER_DOC_LABELS.constanciaCuitUrl,
            value: driver.constanciaCuitUrl,
            status: driver.constanciaCuitStatus,
            approvedAt: driver.constanciaCuitApprovedAt,
            rejectionReason: driver.constanciaCuitRejectionReason,
            isUrl: true,
            required: true,
            expiresAt: null,
            hasExpiration: false,
        },
        {
            field: "dniFrenteUrl",
            label: DRIVER_DOC_LABELS.dniFrenteUrl,
            value: driver.dniFrenteUrl,
            status: driver.dniFrenteStatus,
            approvedAt: driver.dniFrenteApprovedAt,
            rejectionReason: driver.dniFrenteRejectionReason,
            isUrl: true,
            required: true,
            expiresAt: null,
            hasExpiration: false,
        },
        {
            field: "dniDorsoUrl",
            label: DRIVER_DOC_LABELS.dniDorsoUrl,
            value: driver.dniDorsoUrl,
            status: driver.dniDorsoStatus,
            approvedAt: driver.dniDorsoApprovedAt,
            rejectionReason: driver.dniDorsoRejectionReason,
            isUrl: true,
            required: true,
            expiresAt: null,
            hasExpiration: false,
        },
        // ↓ Motorized-only
        {
            field: "licenciaUrl",
            label: DRIVER_DOC_LABELS.licenciaUrl,
            value: driver.licenciaUrl,
            status: driver.licenciaStatus,
            approvedAt: driver.licenciaApprovedAt,
            rejectionReason: driver.licenciaRejectionReason,
            isUrl: true,
            required: motorized,
            expiresAt: driver.licenciaExpiresAt,
            hasExpiration: true,
        },
        {
            field: "seguroUrl",
            label: DRIVER_DOC_LABELS.seguroUrl,
            value: driver.seguroUrl,
            status: driver.seguroStatus,
            approvedAt: driver.seguroApprovedAt,
            rejectionReason: driver.seguroRejectionReason,
            isUrl: true,
            required: motorized,
            expiresAt: driver.seguroExpiresAt,
            hasExpiration: true,
        },
        {
            field: "vtvUrl",
            label: DRIVER_DOC_LABELS.vtvUrl,
            value: driver.vtvUrl,
            status: driver.vtvStatus,
            approvedAt: driver.vtvApprovedAt,
            rejectionReason: driver.vtvRejectionReason,
            isUrl: true,
            required: motorized,
            expiresAt: driver.vtvExpiresAt,
            hasExpiration: true,
        },
        {
            field: "cedulaVerdeUrl",
            label: DRIVER_DOC_LABELS.cedulaVerdeUrl,
            value: driver.cedulaVerdeUrl,
            status: driver.cedulaVerdeStatus,
            approvedAt: driver.cedulaVerdeApprovedAt,
            rejectionReason: driver.cedulaVerdeRejectionReason,
            isUrl: true,
            required: motorized,
            expiresAt: driver.cedulaVerdeExpiresAt,
            hasExpiration: true,
        },
    ];

    // Para vehículos no motorizados (bici, patín, etc) ocultamos los 4 docs
    // motorizados — aparecerían como "Opcional + sin cargar" y confunden a OPS.
    const visibleDocs = motorized
        ? docs
        : docs.filter(
              (d) =>
                  ![
                      "licenciaUrl",
                      "seguroUrl",
                      "vtvUrl",
                      "cedulaVerdeUrl",
                  ].includes(d.field)
          );

    return (
        <div className="space-y-3">
            {visibleDocs.map((doc) => {
                const isThisProcessing = docProcessing === doc.field;
                const hasValue = doc.value !== null && doc.value !== "";
                const statusStyle = statusLabels[doc.status] || {
                    label: doc.status,
                    color: "bg-gray-100 text-gray-800",
                };

                return (
                    <div
                        key={doc.field}
                        className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 transition"
                    >
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                    <p className="text-sm font-bold text-gray-900">
                                        {doc.label}
                                    </p>
                                    {hasValue ? (
                                        <span
                                            className={`px-2 py-0.5 rounded-md text-xs font-bold ${statusStyle.color}`}
                                        >
                                            {statusStyle.label}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700">
                                            <AlertTriangle className="w-3 h-3" /> Sin cargar
                                        </span>
                                    )}
                                    {/* Badge de vencimiento sólo cuando tiene valor
                                        y el doc es de los 4 con fecha de expiración. */}
                                    {hasValue && doc.hasExpiration && (
                                        <ExpirationBadge dateIso={doc.expiresAt} />
                                    )}
                                </div>

                                {/* Valor */}
                                {hasValue && (
                                    <div className="text-sm">
                                        {doc.isUrl ? (
                                            <a
                                                href={doc.value!}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[#e60012] hover:underline inline-flex items-center gap-1 text-xs font-medium"
                                            >
                                                <Eye className="w-3 h-3" /> Ver documento
                                            </a>
                                        ) : (
                                            <span className="text-gray-900 font-mono text-xs break-all">
                                                {doc.value}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Motivo de rechazo */}
                                {doc.status === "REJECTED" && doc.rejectionReason && (
                                    <div className="mt-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
                                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide mb-0.5">
                                            Motivo de rechazo
                                        </p>
                                        <p className="text-xs text-red-700">
                                            {doc.rejectionReason}
                                        </p>
                                    </div>
                                )}

                                {/* Fecha de aprobación */}
                                {doc.status === "APPROVED" && doc.approvedAt && (
                                    <p className="text-[10px] text-green-700 mt-2 font-medium">
                                        Aprobado el{" "}
                                        {new Date(doc.approvedAt).toLocaleDateString(
                                            "es-AR",
                                            {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            }
                                        )}
                                    </p>
                                )}
                            </div>

                            {/* Botones Aprobar/Rechazar — mismo patrón que merchant */}
                            {hasValue && (
                                <div className="flex gap-2 flex-shrink-0">
                                    {doc.status !== "APPROVED" && (
                                        <button
                                            onClick={() => onApprove(doc.field)}
                                            disabled={isThisProcessing}
                                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition inline-flex items-center gap-1.5"
                                        >
                                            {isThisProcessing ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <CheckCircle className="w-3 h-3" />
                                            )}
                                            Aprobar
                                        </button>
                                    )}
                                    {doc.status !== "REJECTED" && (
                                        <button
                                            onClick={() => onReject(doc.field, doc.label)}
                                            disabled={isThisProcessing}
                                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition inline-flex items-center gap-1.5"
                                        >
                                            {isThisProcessing ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <XCircle className="w-3 h-3" />
                                            )}
                                            Rechazar
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

interface DriverChangeRequestsAdminProps {
    requests: ChangeRequest[];
    processing: boolean;
    onResolve: (requestId: string, status: "APPROVED" | "REJECTED", label: string) => void;
}

/**
 * Solicitudes de cambio del repartidor: mismo layout que el merchant pero
 * mapea los field names con DRIVER_DOC_LABELS para mostrar texto correcto.
 */
function DriverChangeRequestsAdmin({
    requests,
    processing,
    onResolve,
}: DriverChangeRequestsAdminProps) {
    if (requests.length === 0) {
        return (
            <div className="text-sm text-gray-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                Sin solicitudes de cambio.
            </div>
        );
    }

    const pending = requests.filter((r) => r.status === "PENDING");
    const resolved = requests.filter((r) => r.status !== "PENDING");

    return (
        <div className="space-y-3">
            {pending.map((req) => {
                const label = DRIVER_DOC_LABELS[req.documentField] || req.documentField;
                return (
                    <div
                        key={req.id}
                        className="border border-amber-200 bg-amber-50 rounded-xl p-4"
                    >
                        <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-bold text-amber-900">
                                        {label}
                                    </p>
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-200 text-amber-900">
                                        PENDIENTE
                                    </span>
                                </div>
                                <p className="text-[10px] text-amber-700 mt-1">
                                    Solicitado el{" "}
                                    {new Date(req.createdAt).toLocaleDateString("es-AR", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <button
                                    onClick={() => onResolve(req.id, "APPROVED", label)}
                                    disabled={processing}
                                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition inline-flex items-center gap-1.5"
                                >
                                    <CheckCircle className="w-3 h-3" /> Autorizar
                                </button>
                                <button
                                    onClick={() => onResolve(req.id, "REJECTED", label)}
                                    disabled={processing}
                                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition inline-flex items-center gap-1.5"
                                >
                                    <XCircle className="w-3 h-3" /> Rechazar
                                </button>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg px-3 py-2 border border-amber-200">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-0.5">
                                Motivo del repartidor
                            </p>
                            <p className="text-xs text-gray-800">{req.reason}</p>
                        </div>
                    </div>
                );
            })}

            {resolved.length > 0 && (
                <details className="group">
                    <summary className="cursor-pointer text-xs font-bold text-gray-600 hover:text-gray-900 py-1 select-none inline-flex items-center gap-1">
                        <ChevronDown className="w-3 h-3 group-open:hidden" />
                        <ChevronUp className="w-3 h-3 hidden group-open:inline-block" />
                        Histórico ({resolved.length})
                    </summary>
                    <div className="space-y-2 mt-2">
                        {resolved.map((req) => {
                            const label =
                                DRIVER_DOC_LABELS[req.documentField] || req.documentField;
                            const isApproved = req.status === "APPROVED";
                            return (
                                <div
                                    key={req.id}
                                    className={`border rounded-xl p-3 ${
                                        isApproved
                                            ? "bg-green-50 border-green-200"
                                            : "bg-slate-50 border-slate-200"
                                    }`}
                                >
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <p className="text-xs font-bold text-gray-900">
                                            {label}
                                        </p>
                                        <span
                                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                isApproved
                                                    ? "bg-green-200 text-green-900"
                                                    : "bg-red-200 text-red-900"
                                            }`}
                                        >
                                            {isApproved ? "AUTORIZADA" : "RECHAZADA"}
                                        </span>
                                        {req.resolvedAt && (
                                            <span className="text-[10px] text-gray-500">
                                                {new Date(req.resolvedAt).toLocaleDateString(
                                                    "es-AR"
                                                )}
                                            </span>
                                        )}
                                        {req.resolvedByName && (
                                            <span className="text-[10px] text-gray-500">
                                                por {req.resolvedByName}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-gray-700 mb-1">
                                        <span className="font-bold">Motivo:</span> {req.reason}
                                    </p>
                                    {req.resolutionNote && (
                                        <p className="text-[11px] text-gray-700">
                                            <span className="font-bold">Nota OPS:</span>{" "}
                                            {req.resolutionNote}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </details>
            )}
        </div>
    );
}


/* ───────────────────────────────────────────────────────────────────────────
 * MerchantLogoAdmin — sub-componente que el admin usa desde la ficha del
 * comercio para subir/reemplazar/quitar el logo del merchant en su nombre.
 *
 * Caso de uso: el comercio nuevo te trae el logo en USB/WhatsApp/email y vos
 * (admin) lo subís sin pedirle al merchant que se loguee y lo cargue. Sin esto,
 * la aprobación queda bloqueada por LOGO_MISSING desde la rama anterior.
 *
 * Internamente reusa <ImageUpload> que ya hace todo: comprime, sube a /api/upload,
 * devuelve URL final. Acá sólo persistimos la URL en Merchant.image vía PATCH
 * /api/admin/merchants/[id]/logo.
 * ───────────────────────────────────────────────────────────────────────────
 */
interface MerchantLogoAdminProps {
    merchantId: string;
    currentImage: string | null;
    onUpdated: () => void | Promise<void>;
}

function MerchantLogoAdmin({ merchantId, currentImage, onUpdated }: MerchantLogoAdminProps) {
    const [saving, setSaving] = useState(false);

    // ImageUpload llama onChange con la URL final (post-upload). Persistimos en DB.
    const handleImageChange = async (newUrl: string) => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/merchants/${merchantId}/logo`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrl: newUrl || null }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                if (newUrl) {
                    toast.success(currentImage ? "Logo reemplazado" : "Logo cargado — ya podés aprobar el comercio");
                } else {
                    toast.success("Logo eliminado");
                }
                await onUpdated();
            } else {
                toast.error(data.error || "Error al guardar el logo");
            }
        } catch (err) {
            console.error("[MerchantLogoAdmin] Error:", err);
            toast.error("Error de conexión");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-500 uppercase">
                    Logo del comercio
                </p>
                {!currentImage && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 uppercase">
                        Falta — bloquea aprobación
                    </span>
                )}
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-3">
                    Si el comercio te entregó el logo fuera del sistema (USB, WhatsApp,
                    email), subilo acá en su nombre. Se guarda en Merchant.image y queda
                    auditado en el historial admin.
                </p>
                <ImageUpload
                    value={currentImage ?? ""}
                    onChange={handleImageChange}
                    disabled={saving}
                    cropAspect={1}
                />
                {saving && (
                    <p className="text-xs text-gray-400 mt-2">Guardando...</p>
                )}
            </div>
        </div>
    );
}
