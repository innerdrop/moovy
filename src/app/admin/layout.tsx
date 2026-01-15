import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    // Check if user is logged in and has admin or merchant role
    const role = (session?.user as any)?.role;
    if (!session || !["ADMIN", "MERCHANT"].includes(role)) {
        redirect("/login?callbackUrl=/admin");
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <AdminSidebar />
            {/* Main content - responsive margin */}
            <main className="lg:ml-64 p-4 lg:p-8 pt-16 lg:pt-8 animate-fade-in">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
