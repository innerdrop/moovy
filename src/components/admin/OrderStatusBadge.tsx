import {
    Clock,
    CheckCircle,
    Package,
    Truck,
    XCircle,
    AlertCircle
} from "lucide-react";

export default function OrderStatusBadge({ status }: { status: string }) {
    const config: any = {
        PENDING: {
            label: "Pendiente",
            cls: "bg-yellow-100 text-yellow-700 border-yellow-200",
            icon: Clock
        },
        CONFIRMED: {
            label: "Confirmado",
            cls: "bg-blue-100 text-blue-700 border-blue-200",
            icon: CheckCircle
        },
        PREPARING: {
            label: "Preparando",
            cls: "bg-purple-100 text-purple-700 border-purple-200",
            icon: Package
        },
        READY: {
            label: "Listo",
            cls: "bg-indigo-100 text-indigo-700 border-indigo-200",
            icon: Package
        },
        IN_DELIVERY: {
            label: "En Camino",
            cls: "bg-orange-100 text-orange-700 border-orange-200",
            icon: Truck
        },
        DELIVERED: {
            label: "Entregado",
            cls: "bg-green-100 text-green-700 border-green-200",
            icon: CheckCircle
        },
        CANCELLED: {
            label: "Cancelado",
            cls: "bg-red-100 text-red-700 border-red-200",
            icon: XCircle
        },
    };

    const conf = config[status] || {
        label: status,
        cls: "bg-gray-100 text-gray-700 border-gray-200",
        icon: AlertCircle
    };

    const Icon = conf.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${conf.cls}`}>
            <Icon className="w-3.5 h-3.5" />
            {conf.label}
        </span>
    );
}
