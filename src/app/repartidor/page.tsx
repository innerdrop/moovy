import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function RepartidorRootPage() {
    const session = await auth();

    if (!session) {
        redirect("/repartidor/login");
    }

    redirect("/repartidor/dashboard");
}
