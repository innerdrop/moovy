// Conductores Layout - Panel de Conductor
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import {
    LayoutDashboard,
    MapPin,
    History,
    User,
    Truck
} from "lucide-react";

export default async function ConductoresLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    const role = (session?.user as any)?.role;

    // Security Check
    if (!session || !["DRIVER", "ADMIN"].includes(role)) {
        redirect("/conductores/login");
    }

    const navItems = [
        { href: "/conductores", icon: LayoutDashboard, label: "Tablero" },
        { href: "/conductores/entregas", icon: MapPin, label: "Entregas" },
        { href: "/conductores/historial", icon: History, label: "Historial" },
        { href: "/conductores/perfil", icon: User, label: "Perfil" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white">
                            <Truck className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900">Conductor</h1>
                            <p className="text-xs text-gray-500">App Repartidor</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4">
                    <ul className="space-y-1">
                        {navItems.map((item) => (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-green-50 hover:text-green-600 transition font-medium"
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                            {session.user?.name?.charAt(0) || "D"}
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-medium text-sm truncate">{session.user?.name}</p>
                            <p className="text-xs text-gray-400">En servicio</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white">
                        <Truck className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-gray-900">Conductor</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                    {session.user?.name?.charAt(0) || "D"}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 pb-24 lg:p-8 overflow-y-auto">
                {children}
            </main>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 z-30 pb-safe">
                <nav className="flex items-center justify-between">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center gap-1 p-2 text-gray-400 hover:text-green-600 active:text-green-700 transition"
                        >
                            <item.icon className="w-6 h-6" />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </div>
        </div>
    );
}
