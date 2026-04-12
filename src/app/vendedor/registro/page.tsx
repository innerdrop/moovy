/**
 * src/app/vendedor/registro/page.tsx
 *
 * Server Component wrapper del registro de vendedor marketplace.
 *
 * Propósito: hacer el gate de "este user ya tiene perfil de vendedor?"
 * SERVER-SIDE usando computeUserAccess() (fuente de verdad del dominio),
 * en vez de confiar en el JWT `roles[]` cacheado (que puede estar stale
 * y generaba un loop /registro <-> /dashboard).
 *
 * Reglas del gate:
 *   - Sin sesión: renderiza el form (signup flow normal)
 *   - Admin: renderiza el form (admin bypass)
 *   - seller.status === "none":     renderiza el form
 *   - seller.status === "approved": redirect al dashboard
 *   - seller.status === "pending":  redirect a /vendedor/pendiente-aprobacion
 *     (Fase 1 no tiene pending para sellers pero cubrimos el caso por si Fase 2 lo agrega)
 *   - seller.status === "rejected": redirect a /mi-perfil?error=seller_inactive
 *   - seller.status === "suspended": redirect a /cuenta-suspendida?role=vendedor
 *
 * NOTA: no usamos requireSellerAccess() porque ese helper redirige "none" a
 * /vendedor/registro — causaría recursión infinita en esta misma ruta.
 * Implementamos el switch manualmente para que "none" caiga al render del form.
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { computeUserAccess } from "@/lib/roles";
import VendedorRegistroClient from "./VendedorRegistroClient";

export default async function VendedorRegistroPage() {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;

    if (userId) {
        const access = await computeUserAccess(userId);

        if (access?.isArchived) {
            redirect("/cuenta-archivada");
        }

        // Admin bypass
        if (access?.isAdmin) {
            return <VendedorRegistroClient />;
        }

        if (access) {
            switch (access.seller.status) {
                case "none":
                    // Sin perfil de seller: el user puede completar el registro.
                    break;
                case "approved":
                    redirect("/vendedor/dashboard");
                case "pending":
                    // Fase 1 no genera este estado, pero cubrimos por si Fase 2 lo agrega.
                    redirect("/vendedor/pendiente-aprobacion");
                case "rejected":
                    redirect("/mi-perfil?error=seller_inactive");
                case "suspended":
                    redirect("/cuenta-suspendida?role=vendedor");
                default: {
                    const _never: never = access.seller.status;
                    throw new Error(`Unhandled seller status: ${String(_never)}`);
                }
            }
        }
    }

    return <VendedorRegistroClient />;
}
