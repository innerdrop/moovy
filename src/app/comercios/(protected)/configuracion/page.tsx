import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AlertCircle, Settings } from "lucide-react";
import SettingsForm from "@/components/comercios/SettingsForm";

export default async function ConfiguracionPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/comercios/login");
    }

    const merchant = await prisma.merchant.findFirst({
        where: { ownerId: session.user.id },
    });

    if (!merchant) {
        return (
            <div className="text-center py-20">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-800">Error de Cuenta</h2>
                <p className="text-gray-500">No tienes un comercio asociado a tu cuenta.</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Settings className="w-6 h-6" style={{ color: "#e60012" }} />
                    Ajustes
                </h1>
                <p className="text-gray-500">Configuración operativa de tu tienda</p>
            </div>

            <SettingsForm
                merchant={{
                    id: merchant.id,
                    name: merchant.name,
                    image: merchant.image || "",
                    isOpen: merchant.isOpen,
                    deliveryTimeMin: merchant.deliveryTimeMin,
                    deliveryTimeMax: merchant.deliveryTimeMax,
                    deliveryFee: merchant.deliveryFee,
                    minOrderAmount: merchant.minOrderAmount,
                    deliveryRadiusKm: merchant.deliveryRadiusKm,
                    allowPickup: merchant.allowPickup,
                    commissionRate: merchant.commissionRate,
                    mpEmail: merchant.mpEmail,
                    mpLinkedAt: merchant.mpLinkedAt?.toISOString() || null,
                    mpUserId: merchant.mpUserId,
                    constanciaAfipUrl: merchant.constanciaAfipUrl,
                    habilitacionMunicipalUrl: merchant.habilitacionMunicipalUrl,
                    registroSanitarioUrl: merchant.registroSanitarioUrl,
                    approvalStatus: merchant.approvalStatus,
                    hasCuit: Boolean(merchant.cuit),
                    hasBankAccount: Boolean(merchant.bankAccount),
                    category: merchant.category,
                }}
            />
        </div>
    );
}