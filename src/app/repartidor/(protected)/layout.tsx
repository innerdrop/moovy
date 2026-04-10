import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { getDriverAccess } from "@/lib/role-access";
import MobileOnlyGuard from "@/components/ui/MobileOnlyGuard";

export default async function RepartidorProtectedLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    // Must be logged in
    if (!session?.user) {
        redirect("/repartidor/login");
    }

    // Must have DRIVER or ADMIN role
    if (!hasAnyRole(session, ["DRIVER", "ADMIN"])) {
        redirect("/repartidor/login");
    }

    // Check user-level suspension and archive status
    if ((session.user as any).isSuspended) {
        redirect("/cuenta-suspendida");
    }
    if ((session.user as any).isArchived) {
        redirect("/cuenta-archivada");
    }

    // Verify driver is registered, approved and not suspended.
    // Admins bypass this check (they may not have a driver row).
    if (!hasAnyRole(session, ["ADMIN"])) {
        const access = await getDriverAccess((session.user as any).id);
        if (!access.canAccess) {
            redirect(access.redirectTo!);
        }
    }

    return (
        <MobileOnlyGuard mode="block" portalName="Repartidor">
            {children}
        </MobileOnlyGuard>
    );
}
