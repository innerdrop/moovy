import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AlertCircle, Store } from "lucide-react";
import MiComercioForm from "@/components/comercios/MiComercioForm";

export default async function MiComercioPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/comercios/login");
    }

    const merchant = await prisma.merchant.findFirst({
        where: { ownerId: session.user.id },
        include: { owner: true }
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
                    <Store className="w-6 h-6" style={{ color: "#e60012" }} />
                    Mi Comercio
                </h1>
                <p className="text-gray-500">Tu perfil público, horarios y redes sociales</p>
            </div>

            <MiComercioForm
                merchant={{
                    id: merchant.id,
                    name: merchant.name,
                    description: merchant.description || "",
                    image: merchant.image || "",
                    email: merchant.email || "",
                    phone: merchant.phone || "",
                    address: merchant.address || "",
                    category: merchant.category || "Otro",
                    deliveryFee: merchant.deliveryFee,
                    latitude: merchant.latitude,
                    longitude: merchant.longitude,
                    firstName: merchant.owner.firstName || "",
                    lastName: merchant.owner.lastName || "",
                    ownerPhone: merchant.owner.phone || "",
                    scheduleEnabled: merchant.scheduleEnabled,
                    scheduleJson: merchant.scheduleJson,
                    instagramUrl: merchant.instagramUrl,
                    facebookUrl: merchant.facebookUrl,
                    whatsappNumber: merchant.whatsappNumber,
                }}
            />
        </div>
    );
}