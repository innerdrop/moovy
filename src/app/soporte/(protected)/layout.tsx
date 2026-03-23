import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = {
    title: "Portal de Soporte",
    description: "Portal de operadores de soporte MOOVY"
};

export default async function SoporteProtectedLayout({
    children
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect("/soporte/login");
    }

    // Check if user is an active support operator
    const userId = (session.user as any).id;
    const operator = await (prisma as any).supportOperator.findUnique({
        where: { userId }
    });

    if (!operator || !operator.isActive) {
        redirect("/soporte/login");
    }

    return <>{children}</>;
}
