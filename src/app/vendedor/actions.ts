"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const timeRangeSchema = z.object({
    open: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM requerido"),
    close: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM requerido"),
}).refine(
    (r) => r.open < r.close,
    { message: "La hora de apertura debe ser anterior a la de cierre" }
);

const scheduleJsonSchema = z.record(
    z.string().regex(/^[1-7]$/),
    z.union([
        z.array(timeRangeSchema).min(1).max(3),
        z.null(),
    ])
).refine(
    (schedule) => {
        for (const key of Object.keys(schedule)) {
            const ranges = schedule[key];
            if (!ranges || ranges.length <= 1) continue;
            const sorted = [...ranges].sort((a, b) => a.open.localeCompare(b.open));
            for (let i = 1; i < sorted.length; i++) {
                if (sorted[i].open < sorted[i - 1].close) {
                    return false;
                }
            }
        }
        return true;
    },
    { message: "Los turnos de un mismo día no pueden solaparse" }
);

export async function updateSellerSchedule(scheduleEnabled: boolean, scheduleJson: string | null) {
    const session = await auth();
    if (!session?.user?.id || !hasAnyRole(session, ["SELLER", "ADMIN"])) {
        return { error: "No autorizado" };
    }

    try {
        // Validar scheduleJson si viene
        if (scheduleJson) {
            const parsed = JSON.parse(scheduleJson);
            const validation = scheduleJsonSchema.safeParse(parsed);
            if (!validation.success) {
                return { error: validation.error.issues[0]?.message || "Horarios inválidos" };
            }
        }

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
