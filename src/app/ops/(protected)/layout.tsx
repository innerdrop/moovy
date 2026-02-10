// Ops Layout - Panel de Operaciones Moovy
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import OpsSidebar from "@/components/ops/OpsSidebar";

async function OpsLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    // Redirect if not authenticated or not admin
    if (!session || (session.user as any)?.role !== "ADMIN") {
        redirect("/ops/login");
    }

    return (
        <div className="min-h-screen bg-gray-100 flex overflow-x-hidden">
            {/* Sidebar - handles both desktop and mobile */}
            <OpsSidebar userName={session.user?.name || undefined} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:ml-0">
                {/* Spacer for mobile menu button */}
                <div className="lg:hidden h-16" />

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-6 pb-24 lg:pb-6 overflow-x-hidden overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default OpsLayout;
