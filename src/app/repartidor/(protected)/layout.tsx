import { auth } from "@/lib/auth";
import { requireDriverAccess } from "@/lib/roles";
import MobileOnlyGuard from "@/components/ui/MobileOnlyGuard";

export default async function RepartidorProtectedLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;

    // Gate canónico: verifica sesión → no archivado → no suspendido →
    // driver registrado → aprobado → no suspendido. Admin bypass incluido.
    // Ver src/lib/roles.ts.
    await requireDriverAccess(userId);

    return (
        <MobileOnlyGuard mode="block" portalName="Repartidor">
            {children}
        </MobileOnlyGuard>
    );
}
