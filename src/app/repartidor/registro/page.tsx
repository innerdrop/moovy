/**
 * src/app/repartidor/registro/page.tsx
 *
 * Server Component wrapper del registro de repartidor.
 *
 * Propósito: hacer el gate de "este user ya tiene perfil de repartidor?"
 * SERVER-SIDE usando computeUserAccess() (fuente de verdad del dominio),
 * en vez de confiar en el JWT `roles[]` cacheado (que puede estar stale
 * y generaba un loop /registro <-> /dashboard).
 *
 * Reglas del gate:
 *   - Sin sesión: renderiza el form (signup flow normal)
 *   - Admin: renderiza el form (admin bypass — puede entrar donde quiera)
 *   - driver.status === "none":    renderiza el form
 *   - driver.status === "approved": redirect al dashboard
 *   - driver.status === "pending":  redirect a /repartidor/pendiente-aprobacion
 *   - driver.status === "rejected": redirect a /repartidor/pendiente-aprobacion?rejected=1
 *   - driver.status === "suspended": redirect a /cuenta-suspendida?role=repartidor
 *
 * NOTA: este Server Component NO usa requireDriverAccess() porque ese helper
 * redirige "none" a /repartidor/registro — lo cual causaría recursión infinita
 * en esta misma ruta. Implementamos el switch manualmente para que "none"
 * caiga al render del form.
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { computeUserAccess } from "@/lib/roles";
import RepartidorRegistroClient from "./RepartidorRegistroClient";

export default async function RepartidorRegistroPage() {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;

    if (userId) {
        const access = await computeUserAccess(userId);

        if (access?.isArchived) {
            redirect("/cuenta-archivada");
        }

        // Admin bypass: admin puede entrar a /registro sin redirects.
        // (Aunque normalmente no tiene sentido que admin se registre como driver,
        // no lo bloqueamos para no romper flujos de testing / soporte.)
        if (access?.isAdmin) {
            return <RepartidorRegistroClient />;
        }

        if (access) {
            switch (access.driver.status) {
                case "none":
                    // Sin perfil de driver: el user puede completar el registro.
                    break;
                case "approved":
                    redirect("/repartidor/dashboard");
                case "pending":
                    redirect("/repartidor/pendiente-aprobacion");
                case "rejected":
                    redirect("/repartidor/pendiente-aprobacion?rejected=1");
                case "suspended":
                    redirect("/cuenta-suspendida?role=repartidor");
                default: {
                    const _never: never = access.driver.status;
                    throw new Error(`Unhandled driver status: ${String(_never)}`);
                }
            }
        }
    }

    return <RepartidorRegistroClient />;
}
