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

    return (
        <div className="min-h-screen bg-gray-100 flex overflow-x-hidden w-full max-w-[100vw]">
            {/* Sidebar - handles both desktop and mobile */}
            <OpsSidebar userName={session.user?.name || undefined} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:ml-0 min-w-0 max-w-full">
                {/* Spacer for mobile menu button */}
                <div className="lg:hidden h-16" />

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-6 pb-24 lg:pb-6 overflow-x-hidden overflow-y-auto min-w-0 max-w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default OpsLayout;
