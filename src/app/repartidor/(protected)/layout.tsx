import { auth } from "@/lib/auth";
import { requireDriverAccess } from "@/lib/roles";
import MobileOnlyGuard from "@/components/ui/MobileOnlyGuard";
import RiderPrefsInitializer from "@/components/rider/RiderPrefsInitializer";
import PWAInstallPrompt from "@/components/onboarding/PWAInstallPrompt";

export default async function RepartidorProtectedLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;

    // Gate canónico: verifica sesión → no archivado → no suspendido →
    // driver registrado → aprobado → no suspendido. Admin bypass incluido.
    // Ver src/lib/roles.ts.
    await requireDriverAccess(userId);

    return (
        <MobileOnlyGuard mode="block" portalName="Repartidor">
            {/* Aplica el tema del driver al montarse (fix persistencia 2026-04-24). */}
            <RiderPrefsInitializer />
            {/* data-moovy-zone: tokens de la barra inferior del repartidor
                (globals.css). Hoy el repartidor no tiene barras de acción flotantes,
                pero queda definido para que la próxima nazca bien en vez de
                heredar el offset del comprador, que es más alto. */}
            <div data-moovy-zone="repartidor" className="contents">
                {children}
            </div>
            {/* PWA install tutorial — crítico en iOS porque sin instalar la app no hay push. */}
            <PWAInstallPrompt />
        </MobileOnlyGuard>
    );
}
