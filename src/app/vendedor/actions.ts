"use server";

import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateSellerSchedule(scheduleEnabled: boolean, scheduleJson: string | null) {
    const session = await auth();
    if (!session?.user?.id || !hasAnyRole(session, ["SELLER", "ADMIN"])) {
        return { error: "No autorizado" };
    }

    try {
        const seller = await prisma.sellerProfile.findUnique({
            where: { userId: session.user.id },
        });

        if (!seller) {
            return { error: "No tenés perfil de vendedor. Activalo primero." };
        }

        await prisma.sellerProfile.update({
            where: { id: seller.id },
            data: { scheduleEnabled, scheduleJson },
        });

        revalidatePath("/vendedor/configuracion");
        return { success: true };
    } catch (error) {
        console.error("Error updating schedule:", error);
        return { error: "Error al actualizar los horarios." };
    }
}
