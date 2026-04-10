import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import MobileOnlyGuard from "@/components/ui/MobileOnlyGuard";

export default async function RepartidorProtectedLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    // Check user-level suspension and archive status
    if (session) {
        if ((session.user as any).isSuspended) {
            redirect("/cuenta-suspendida");
        }
        if ((session.user as any).isArchived) {
            redirect("/cuenta-archivada");
        }

        // Check if driver role is suspended
        const { prisma } = await import("@/lib/prisma");
        const driver = await prisma.driver.findFirst({
            where: { userId: (session.user as any).id },
            select: { isSuspended: true },
        });

        if (driver?.isSuspended) {
            redirect("/cuenta-suspendida?role=driver");
        }
    }

    return (
        <MobileOnlyGuard mode="block" portalName="Repartidor">
            {children}
        </MobileOnlyGuard>
    );
}
