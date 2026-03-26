// Página: Todos los comercios
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import MerchantCard from "@/components/store/MerchantCard";
import { Store } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Comercios en Ushuaia — MOOVY",
    description: "Todos los comercios disponibles en MOOVY. Pedí delivery en Ushuaia de tus locales favoritos.",
};

async function getAllMerchants() {
    try {
        return await prisma.merchant.findMany({
            where: { isActive: true },
            orderBy: [
                { isOpen: "desc" },
                { isPremium: "desc" },
                { rating: "desc" },
                { name: "asc" },
            ],
        });
    } catch {
        return [];
    }
}

export default async function TiendasPage() {
    const merchants = await getAllMerchants();
    const openCount = merchants.filter((m) => m.isOpen).length;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="mx-auto max-w-7xl px-4 lg:px-6 xl:px-8 py-6 lg:py-8">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900">
                        Comercios en Ushuaia
                    </h1>
                    <p className="text-sm lg:text-base text-gray-500 mt-1">
                        {merchants.length} {merchants.length === 1 ? "comercio" : "comercios"} disponibles
                        {openCount > 0 && (
                            <span className="text-green-600 font-semibold"> · {openCount} {openCount === 1 ? "abierto" : "abiertos"} ahora</span>
                        )}
                    </p>
                </div>
            </div>

            {/* Grid */}
            <div className="mx-auto max-w-7xl px-4 lg:px-6 xl:px-8 py-6 lg:py-8">
                {merchants.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6">
                        {merchants.map((merchant) => (
                            <MerchantCard key={merchant.id} merchant={merchant} />
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <Store className="w-10 h-10 text-gray-300" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-700 mb-1">Estamos sumando comercios</h2>
                        <p className="text-sm text-gray-500 mb-4">Pronto vas a encontrar tu favorito</p>
                        <Link href="/comercio/registro" className="text-sm font-semibold text-[#e60012] hover:underline">
                            ¿Tenés un comercio? Sumate a MOOVY
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
