"use client";

// Global App Header - Shown when logged in
import Link from "next/link";
import Image from "next/image";
import { Bell, Search } from "lucide-react";

export default function GlobalAppHeader() {
    return (
        <header className="fixed top-0 left-0 right-0 z-40 safe-area-top">
            {/* Solid Red Top Bar */}
            <div className="h-2 bg-[#e60012]"></div>

            {/* Main Header */}
            <div className="bg-white flex items-center justify-between h-14 px-4 border-b border-gray-100 shadow-sm">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3">
                    <Image
                        src="/logo-moovy.png"
                        alt="Moovy"
                        width={100}
                        height={32}
                        className="h-8 w-auto"
                        priority
                    />
                    <span className="hidden sm:block font-[var(--font-poppins)] text-gray-600 text-sm">
                        Tu Antojo Manda!
                    </span>
                </Link>

                {/* Search Bar (Desktop) */}
                <div className="hidden md:flex flex-1 max-w-md mx-8">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#e60012]/20 focus:bg-white transition"
                        />
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1">
                    <Link
                        href="/productos"
                        className="md:hidden w-10 h-10 flex items-center justify-center text-gray-500 hover:text-[#e60012] transition rounded-full hover:bg-gray-50"
                    >
                        <Search className="w-5 h-5" />
                    </Link>
                    <button className="relative w-10 h-10 flex items-center justify-center text-gray-500 hover:text-[#e60012] transition rounded-full hover:bg-gray-50">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#e60012] rounded-full"></span>
                    </button>
                </div>
            </div>
        </header>
    );
}

