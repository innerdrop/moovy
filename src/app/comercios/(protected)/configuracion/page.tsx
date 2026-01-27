import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import SettingsForm from "@/components/comercios/SettingsForm";

export default async function ConfiguracionPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/comercios/login");
    }

    // Get merchant for this user
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
                <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
                <p className="text-gray-500">Gestiona la información de tu comercio</p>
            </div>

            <SettingsForm
                merchant={{
                    id: merchant.id,
                    name: merchant.name,
                    description: merchant.description || "",
                    image: merchant.image || "",
                    email: merchant.email || "",
                    phone: merchant.phone || "",
                    address: merchant.address || "",
                    category: merchant.category || "Otro",
                    isOpen: merchant.isOpen,
                    deliveryTimeMin: merchant.deliveryTimeMin,
                    deliveryTimeMax: merchant.deliveryTimeMax,
                    deliveryFee: merchant.deliveryFee,
                    minOrderAmount: merchant.minOrderAmount,
                    latitude: merchant.latitude,
                    longitude: merchant.longitude,
                }}
            />
        </div>
    );
}
