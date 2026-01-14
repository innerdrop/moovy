
// Comex Layout - Panel de Comercios
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import {
    LayoutDashboard,
    UtensilsCrossed,
    ShoppingCart,
    Store,
    Settings,
    LogOut,
    Menu
} from "lucide-react";

async function ComexLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    console.log("PartnerLayout Session:", JSON.stringify(session, null, 2));

    // Redirect if not authenticated or not merchant
    if (!session || (session.user as any)?.role !== "MERCHANT") {
        redirect("/comex/login");
    }

    const navItems = [
        { href: "/comex", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/comex/productos", icon: UtensilsCrossed, label: "Mi Menú" },
        { href: "/comex/pedidos", icon: ShoppingCart, label: "Pedidos" },
        { href: "/comex/configuracion", icon: Settings, label: "Configuración" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200">
                {/* Logo */}
                <div className="p-6 border-b border-gray-100">
                    <Link href="/comex" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#e60012] rounded-lg flex items-center justify-center text-white">
                            <Store className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="font-bold text-xl text-gray-900">Moovy</h1>
                            <p className="text-xs text-gray-500 font-medium tracking-wide">COMEX</p>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4">
                    <ul className="space-y-1">
                        {navItems.map((item) => (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition text-gray-600 hover:text-[#e60012] font-medium"
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* User Info */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                            {session.user?.name?.charAt(0) || "P"}
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-semibold text-sm text-gray-900 truncate">{session.user?.name}</p>
                            <p className="text-xs text-gray-500">Comerciante</p>
                        </div>
                    </div>
                    <Link
                        href="/logout"
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition px-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Top Bar - Mobile */}
                <header className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#e60012] rounded-md flex items-center justify-center text-white">
                            <Store className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-lg text-gray-900">Moovy Comex</span>
                    </div>
                    <button className="p-2 text-gray-600">
                        <Menu className="w-6 h-6" />
                    </button>
                    {/* Note: Mobile menu logic to be implemented or rely on simple header for now */}
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default ComexLayout;
