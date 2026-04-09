import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import MobileOnlyGuard from "@/components/ui/MobileOnlyGuard";

export default async function RepartidorProtectedLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    // Check suspension and archive status
    if (session) {
        if ((session.user as any).isSuspended) {
            redirect("/cuenta-suspendida");
        }
        if ((session.user as any).isArchived) {
            redirect("/cuenta-archivada");
        }
    }

    return (
        <MobileOnlyGuard mode="block" portalName="Repartidor">
            {children}
        </MobileOnlyGuard>
    );
}
