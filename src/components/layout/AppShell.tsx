"use client";

// App Shell Component - Contenedor estilo app móvil
import BottomNav from "./BottomNav";
import { useCartStore } from "@/store/cart";

interface AppShellProps {
    children: React.ReactNode;
    hideBottomNav?: boolean;
}

export default function AppShell({ children, hideBottomNav = false }: AppShellProps) {
    const cartCount = useCartStore((state) => state.getTotalItems());

    return (
        <div className="lg:hidden flex flex-col min-h-screen bg-gray-50">
            {/* Main Content - with padding for bottom nav */}
            <main className={`flex-1 ${!hideBottomNav ? "pb-20" : ""}`}>
                {children}
            </main>

            {/* Bottom Navigation */}
            {!hideBottomNav && <BottomNav cartCount={cartCount} />}
        </div>
    );
}

