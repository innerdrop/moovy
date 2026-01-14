"use client";

// Header Component - For non-logged-in users
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import {
    ShoppingCart,
    User,
    Menu,
    X,
    Search,
    LogOut,
    LogIn,
    Settings,
    ChevronDown,
    Home,
    Package,
    UserPlus,
    Phone,
    ClipboardList,
} from "lucide-react";
import { useCartStore } from "@/store/cart";

export default function Header() {
    const { data: session } = useSession();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const cartItems = useCartStore((state) => state.getTotalItems());
    const openCart = useCartStore((state) => state.openCart);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = `/productos?buscar=${encodeURIComponent(searchQuery)}`;
        }
    };

    const handleSignOut = async () => {
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
        await signOut({ callbackUrl: "/" });
    };

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <header className="sticky top-0 z-50 bg-white shadow-sm">
            {/* Solid Red Top Bar */}
            <div className="h-2 bg-[#e60012]"></div>

            {/* Main Header */}
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-14 sm:h-16">
                    {/* Left Side */}
                    <div className="flex items-center gap-2">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-gray-700 hover:text-[#e60012] transition"
                            aria-label="Menu"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        {/* Logo - Desktop */}
                        <Link href="/" className="hidden lg:flex items-center gap-3">
                            <Image
                                src="/logo-moovy.png"
                                alt="Moovy"
                                width={100}
                                height={32}
                                className="h-8 w-auto"
                                priority
                            />
                            <span className="font-[var(--font-poppins)] text-gray-600 text-sm">
                                Tu Antojo Manda!
                            </span>
                        </Link>
                    </div>

                    {/* Center - Logo Mobile Only */}
                    <Link href="/" className="lg:hidden absolute left-1/2 -translate-x-1/2">
                        <Image
                            src="/logo-moovy.png"
                            alt="Moovy"
                            width={80}
                            height={26}
                            className="h-7 w-auto"
                            priority
                        />
                    </Link>

                    {/* Search Bar - Desktop */}
                    <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-8">
                        <div className="relative w-full">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="¿Qué estás buscando?"
                                className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-full focus:border-[#e60012] focus:outline-none focus:ring-2 focus:ring-[#e60012]/10 transition"
                            />
                            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#e60012] transition">
                                <Search className="w-5 h-5" />
                            </button>
                        </div>
                    </form>

                    {/* Right Actions */}
                    <div className="flex items-center gap-1 sm:gap-3">
                        {/* Mobile: User Icon */}
                        {!session ? (
                            <Link
                                href="/login"
                                className="lg:hidden p-2 text-gray-700 hover:text-[#e60012] transition"
                                aria-label="Iniciar sesión"
                            >
                                <User className="w-6 h-6" />
                            </Link>
                        ) : (
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="lg:hidden p-2 text-gray-700 hover:text-[#e60012] transition relative"
                                aria-label="Mi cuenta"
                            >
                                <User className="w-6 h-6" />
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#e60012] rounded-full"></span>
                            </button>
                        )}

                        {/* Cart Button */}
                        <button
                            onClick={openCart}
                            className="relative p-2 text-gray-700 hover:text-[#e60012] transition"
                            aria-label="Carrito"
                        >
                            <ShoppingCart className="w-6 h-6" />
                            {cartItems > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#e60012] text-white text-xs rounded-full flex items-center justify-center font-bold">
                                    {cartItems > 99 ? "99+" : cartItems}
                                </span>
                            )}
                        </button>

                        {/* Desktop: User Menu or Login/Register */}
                        {session ? (
                            <div className="relative hidden lg:block">
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center gap-2 p-2 text-gray-700 hover:text-[#e60012] transition"
                                >
                                    <User className="w-6 h-6" />
                                    <span className="text-sm font-medium">
                                        {session.user?.name?.split(" ")[0]}
                                    </span>
                                    <ChevronDown className="w-4 h-4" />
                                </button>

                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border">
                                        <div className="px-4 py-2 border-b">
                                            <p className="font-medium text-gray-900">{session.user?.name}</p>
                                            <p className="text-xs text-gray-500">{session.user?.email}</p>
                                        </div>
                                        <Link
                                            href="/mi-perfil"
                                            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                                            onClick={() => setIsUserMenuOpen(false)}
                                        >
                                            <Settings className="w-4 h-4" />
                                            Mi Perfil
                                        </Link>
                                        <Link
                                            href="/mis-pedidos"
                                            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                                            onClick={() => setIsUserMenuOpen(false)}
                                        >
                                            <ClipboardList className="w-4 h-4" />
                                            Mis Pedidos
                                        </Link>
                                        <button
                                            onClick={handleSignOut}
                                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Cerrar Sesión
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="hidden lg:flex items-center gap-2">
                                <Link
                                    href="/login"
                                    className="btn-outline text-sm py-2 px-4 flex items-center gap-2"
                                >
                                    <LogIn className="w-4 h-4" />
                                    Ingresar
                                </Link>
                                <Link
                                    href="/registro"
                                    className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    Registrarse
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Search */}
                <form onSubmit={handleSearch} className="lg:hidden pb-3">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="¿Qué estás buscando?"
                            className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-full focus:border-[#e60012] focus:outline-none transition text-sm"
                        />
                        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#e60012] transition">
                            <Search className="w-5 h-5" />
                        </button>
                    </div>
                </form>
            </div>

            {/* Category Nav - Desktop */}
            <nav className="hidden lg:block bg-gray-50 border-t">
                <div className="container mx-auto px-4">
                    <ul className="flex items-center justify-center gap-6 py-2 text-sm">
                        <li>
                            <Link href="/" className="text-gray-700 hover:text-[#e60012] transition font-medium">
                                Inicio
                            </Link>
                        </li>
                        <li>
                            <Link href="/productos" className="text-[#e60012] font-semibold">
                                Ver todos los productos
                            </Link>
                        </li>
                        <li>
                            <Link href="/contacto" className="text-gray-700 hover:text-[#e60012] transition font-medium">
                                Contacto
                            </Link>
                        </li>
                    </ul>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <div
                className={`lg:hidden fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                onClick={closeMobileMenu}
            />

            {/* Mobile Slide Menu */}
            <div
                className={`lg:hidden fixed top-0 left-0 h-full w-[280px] sm:w-[320px] bg-white z-50 transform transition-transform duration-300 ease-out shadow-2xl ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                {/* Menu Header */}
                <div className="bg-[#e60012] p-4 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <Image
                            src="/logo-moovy.png"
                            alt="Moovy"
                            width={80}
                            height={26}
                            className="h-7 w-auto brightness-0 invert"
                        />
                        <button
                            onClick={closeMobileMenu}
                            className="p-1.5 bg-white/20 rounded-full hover:bg-white/30 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {session ? (
                        <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{session.user?.name}</p>
                                <p className="text-xs opacity-80 truncate">{session.user?.email}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Link
                                href="/login"
                                className="flex-1 flex items-center justify-center gap-2 bg-white text-[#e60012] py-2 rounded-lg font-medium text-sm"
                                onClick={closeMobileMenu}
                            >
                                <LogIn className="w-4 h-4" />
                                Ingresar
                            </Link>
                            <Link
                                href="/registro"
                                className="flex-1 flex items-center justify-center gap-2 bg-white/20 text-white py-2 rounded-lg font-medium text-sm"
                                onClick={closeMobileMenu}
                            >
                                <UserPlus className="w-4 h-4" />
                                Registrarse
                            </Link>
                        </div>
                    )}
                </div>

                {/* Menu Content */}
                <div className="overflow-y-auto h-[calc(100%-180px)]">
                    <div className="py-2">
                        <Link
                            href="/"
                            className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-50 transition"
                            onClick={closeMobileMenu}
                        >
                            <Home className="w-5 h-5 text-[#e60012]" />
                            <span className="font-medium">Inicio</span>
                        </Link>
                        <Link
                            href="/productos"
                            className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-50 transition"
                            onClick={closeMobileMenu}
                        >
                            <Package className="w-5 h-5 text-[#e60012]" />
                            <span className="font-medium">Todos los productos</span>
                        </Link>
                        <Link
                            href="/contacto"
                            className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-50 transition"
                            onClick={closeMobileMenu}
                        >
                            <Phone className="w-5 h-5 text-[#e60012]" />
                            <span className="font-medium">Contacto</span>
                        </Link>
                    </div>

                    {session && (
                        <div className="border-t py-2">
                            <Link
                                href="/mi-perfil"
                                className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-50 transition"
                                onClick={closeMobileMenu}
                            >
                                <Settings className="w-5 h-5" />
                                <span>Mi perfil</span>
                            </Link>
                            <Link
                                href="/mis-pedidos"
                                className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-50 transition"
                                onClick={closeMobileMenu}
                            >
                                <ClipboardList className="w-5 h-5" />
                                <span>Mis pedidos</span>
                            </Link>
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-4 px-4 py-3 text-red-600 hover:bg-red-50 w-full transition"
                            >
                                <LogOut className="w-5 h-5" />
                                <span>Cerrar sesión</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

