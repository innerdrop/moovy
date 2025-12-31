// Admin Layout - Panel de Administración
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    Truck,
    Settings,
    BarChart3,
    LogOut,
    Menu,
    Store
} from "lucide-react";

async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    // Redirect if not authenticated or not admin
    if (!session || (session.user as any)?.role !== "ADMIN") {
        redirect("/login");
    }

    const navItems = [
        { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/admin/productos", icon: Package, label: "Productos" },
        { href: "/admin/pedidos", icon: ShoppingCart, label: "Pedidos" },
        { href: "/admin/repartidores", icon: Truck, label: "Repartidores" },
        { href: "/admin/clientes", icon: Users, label: "Clientes" },
        { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
        { href: "/admin/configuracion", icon: Settings, label: "Configuración" },
    ];

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:flex flex-col w-64 bg-navy text-white">
                {/* Logo */}
                <div className="p-6 border-b border-white/10">
                    <Link href="/admin" className="flex items-center gap-3">
                        <Store className="w-8 h-8 text-turquoise" />
                        <div>
                            <h1 className="font-script text-xl text-turquoise">Polirrubro</h1>
                            <p className="text-xs text-gray-400">Panel Admin</p>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4">
                    <ul className="space-y-2">
                        {navItems.map((item) => (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition text-gray-300 hover:text-white"
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* User Info */}
                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-turquoise flex items-center justify-center">
                            <span className="font-bold text-navy">
                                {session.user?.name?.charAt(0) || "A"}
                            </span>
                        </div>
                        <div>
                            <p className="font-medium text-sm">{session.user?.name}</p>
                            <p className="text-xs text-gray-400">Administrador</p>
                        </div>
                    </div>
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
                    >
                        <LogOut className="w-4 h-4" />
                        Ir a la Tienda
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Top Bar - Mobile */}
                <header className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between">
                    <Link href="/admin" className="font-script text-xl text-turquoise">
                        Polirrubro Admin
                    </Link>
                    <button className="p-2">
                        <Menu className="w-6 h-6 text-navy" />
                    </button>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;
