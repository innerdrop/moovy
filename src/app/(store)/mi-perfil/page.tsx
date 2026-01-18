"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import {
    User,
    MapPin,
    Heart,
    Settings,
    Bell,
    Shield,
    LogOut,
    ChevronRight,
    Store,
    Car,
    HelpCircle,
    FileText,
    Star,
    Award
} from "lucide-react";
import { useUserPoints } from "@/hooks/useUserPoints";

export default function ProfilePage() {
    const { data: session } = useSession();
    const { points, level, nextLevelPoints } = useUserPoints();

    const firstName = session?.user?.name?.split(" ")[0] || "Usuario";

    // Calculate progress to next level
    const progress = Math.min(100, (points / nextLevelPoints) * 100);

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header / Profile Summary */}
            <div className="bg-white border-b border-gray-100 pt-8 pb-6 px-4">
                <div className="max-w-md mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#e60012] to-red-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                            {session?.user?.name?.charAt(0).toUpperCase() || <User />}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{session?.user?.name}</h1>
                            <p className="text-gray-500 text-sm">{session?.user?.email}</p>
                            <div className="flex items-center gap-1 mt-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                Miembro Activo
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Card */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-amber-700 font-medium mb-1 flex items-center gap-1">
                                <Award className="w-3 h-3" /> Nivel {level.name}
                            </p>
                            <p className="text-2xl font-bold text-gray-900">{points.toLocaleString()}</p>
                            <p className="text-[10px] text-gray-400">Puntos MOOVER</p>
                        </div>
                        <div className="w-24">
                            {/* Circular progress or simple link */}
                            <Link href="/puntos" className="text-xs bg-white text-amber-600 px-3 py-1.5 rounded-full shadow-sm font-semibold border border-amber-100 block text-center">
                                Ver canjes
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 mt-6 space-y-6">

                {/* 1. My Account Section */}
                <section>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Mi Cuenta</h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <Link href="/mi-perfil/datos" className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                    <User className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">Datos Personales</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                        </Link>
                        <Link href="/mi-perfil/direcciones" className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">Mis Direcciones</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                        </Link>
                        <Link href="/mi-perfil/favoritos" className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-600">
                                    <Heart className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">Favoritos</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                        </Link>
                    </div>
                </section>

                {/* 2. Opportunities Section (Integrated) */}
                <section>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Oportunidades MOOVY</h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <Link href="/comercio/registro?from=profile" className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-50 group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                    <Store className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-900 block">Registrar mi Comercio</span>
                                    <span className="text-[10px] text-gray-400">Vendé tus productos en Moovy</span>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                        </Link>
                        <Link href="/repartidor/registro?from=profile" className="flex items-center justify-between p-4 hover:bg-gray-50 transition group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                                    <Car className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-900 block">Quiero ser Repartidor</span>
                                    <span className="text-[10px] text-gray-400">Generá ingresos con tu vehículo</span>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                        </Link>
                    </div>
                </section>

                {/* 3. Settings & Support */}
                <section>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Configuración y Ayuda</h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <Link href="/ayuda" className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                                    <HelpCircle className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">Centro de Ayuda</span>
                            </div>
                        </Link>
                        <Link href="/terminos" className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">Términos y Condiciones</span>
                            </div>
                        </Link>
                    </div>
                </section>

                {/* Logout Button */}
                <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full bg-white border border-red-100 text-red-600 font-medium py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 hover:bg-red-50 transition"
                >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                </button>

                <p className="text-center text-[10px] text-gray-400 pb-4">
                    Versión 1.0.0 • Hecho con ❤️ en Ushuaia
                </p>
            </div>
        </div>
    );
}
