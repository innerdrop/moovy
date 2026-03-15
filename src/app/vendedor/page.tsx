import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function VendedorRootPage() {
    const session = await auth();

    if (!session) {
        redirect("/vendedor/registro");
    }

    redirect("/vendedor/dashboard");
}
