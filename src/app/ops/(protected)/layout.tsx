// Ops Layout - Panel de Operaciones Moovy
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { requireAdminAccess } from "@/lib/roles";
import OpsSidebar from "@/components/ops/OpsSidebar";

async function OpsLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/ops/login");
    }

    // C-1: gate contra la DB (no el JWT). Bloquea admin degradado/suspendido/
    // archivado de inmediato. requireAdminAccess redirige según el caso.
    await requireAdminAccess(session.user.id);

    // style/ops-sidebar-fijo — patrón APP-SHELL: la página NO scrollea nunca
    // (root = h-screen + overflow-hidden). Son dos columnas de altura completa:
    // el sidebar (columna estática en desktop, drawer en mobile) scrollea su nav
    // por adentro, y el contenido scrollea en SU propia columna (overflow-y-auto).
    // Sin fixed/sticky ni compensaciones de margen: el sidebar ocupa su espacio
    // real en el flujo, así que el contenido jamás puede quedar tapado.
    return (
        <div className="h-screen overflow-hidden bg-gray-100 flex w-full">
            {/* Sidebar - handles both desktop and mobile */}
            <OpsSidebar userName={session.user?.name || undefined} />

            {/* Main Content — columna con scroll propio */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto overflow-x-hidden">
                {/* Spacer for mobile menu button */}
                <div className="lg:hidden h-16" />

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-6 pb-24 lg:pb-6 min-w-0 max-w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default OpsLayout;
