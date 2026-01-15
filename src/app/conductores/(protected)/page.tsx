// Conductores Portal - Dashboard Page
import { auth } from "@/lib/auth";
import { Package, Clock, CheckCircle, XCircle, MapPin, Truck } from "lucide-react";

export default async function ConductoresDashboardPage() {
    const session = await auth();
    const userName = session?.user?.name || "Conductor";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {userName}</h1>
                <p className="text-gray-500">Resumen de tu actividad de hoy</p>
            </div>

            {/* Today's Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Pendientes</p>
                            <p className="text-xl font-bold">--</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">En Curso</p>
                            <p className="text-xl font-bold">--</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Entregados</p>
                            <p className="text-xl font-bold">--</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <XCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Cancelados</p>
                            <p className="text-xl font-bold">--</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Deliveries */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-green-600" />
                        Entregas Activas
                    </h2>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        En línea
                    </span>
                </div>

                <div className="p-8 text-center text-gray-400">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Truck className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="font-medium text-gray-900">No tienes entregas activas</p>
                    <p className="text-sm mt-1">Las nuevas asignaciones aparecerán aquí automáticamente.</p>
                </div>
            </div>
        </div>
    );
}
