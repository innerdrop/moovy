// Conductores Portal - Dashboard Page
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Truck, Package, Clock, MapPin, CheckCircle, XCircle } from "lucide-react";

export default async function ConductoresDashboardPage() {
    const session = await auth();
    const role = (session?.user as any)?.role;

    if (!session || !["DRIVER", "ADMIN"].includes(role)) {
        redirect("/login");
    }

    const userName = session.user?.name || "Conductor";

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <Truck className="w-8 h-8" />
                        Panel de Conductor
                    </h1>
                    <p className="text-green-100 mt-1">Hola, {userName}</p>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto p-6">
                {/* Today's Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <Package className="w-8 h-8 text-green-600" />
                            <div>
                                <p className="text-xs text-gray-500">Pendientes</p>
                                <p className="text-xl font-bold">--</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <Clock className="w-8 h-8 text-yellow-500" />
                            <div>
                                <p className="text-xs text-gray-500">En Camino</p>
                                <p className="text-xl font-bold">--</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                            <div>
                                <p className="text-xs text-gray-500">Entregados</p>
                                <p className="text-xl font-bold">--</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <XCircle className="w-8 h-8 text-red-500" />
                            <div>
                                <p className="text-xs text-gray-500">Cancelados</p>
                                <p className="text-xl font-bold">--</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Deliveries */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-green-600" />
                        Entregas Activas
                    </h2>
                    <div className="text-center py-12 text-gray-400">
                        <Truck className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>No hay entregas pendientes</p>
                        <p className="text-sm">Las nuevas entregas aparecerán aquí</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
