// Ops Layout - Panel de Operaciones Moovy
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
    Store,
    Tag,
    Gift,
    Activity
} from "lucide-react";

async function OpsLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    // Redirect if not authenticated or not admin
    if (!session || (session.user as any)?.role !== "ADMIN") {
        redirect("/ops/login");
    }

    const navItems = [
        { href: "/ops", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/ops/live", icon: Activity, label: "🔴 En Vivo" },
        { href: "/ops/productos", icon: Package, label: "Productos" },
        { href: "/ops/categorias", icon: Tag, label: "Categorías" },
        { href: "/ops/pedidos", icon: ShoppingCart, label: "Pedidos" },
        { href: "/ops/repartidores", icon: Truck, label: "Repartidores" },
        { href: "/ops/clientes", icon: Users, label: "Clientes" },
        { href: "/ops/analytics", icon: BarChart3, label: "Analytics" },
        { href: "/ops/puntos", icon: Gift, label: "Sistema Puntos" },
        { href: "/ops/configuracion", icon: Settings, label: "Configuración" },
    ];


    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:flex flex-col w-64 bg-navy text-white">
                {/* Logo */}
                <div className="p-6 border-b border-white/10">
                    <Link href="/admin" className="flex items-center gap-3">
                        <Store className="w-8 h-8 text-moovy" />
                        <div>
                            <h1 className="font-script text-xl text-moovy">Moovy</h1>
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
                        <div className="w-10 h-10 rounded-full bg-moovy flex items-center justify-center">
                            <span className="font-bold text-navy">
                                {session.user?.name?.charAt(0) || "A"}
                            </span>
                        </div>
                        <div>
                            <p className="font-medium text-sm">{session.user?.name}</p>
                            <p className="text-xs text-gray-400">Administrador</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
                        >
                            <Store className="w-4 h-4" />
                            Ir a la Tienda
                        </Link>
                        <Link
                            href="/api/auth/signout"
                            className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition"
                        >
                            <LogOut className="w-4 h-4" />
                            Cerrar Sesión
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Top Bar - Mobile */}
                <header className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between">
                    <Link href="/ops" className="font-script text-xl text-moovy">
                        Moovy Ops
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

export default OpsLayout;

