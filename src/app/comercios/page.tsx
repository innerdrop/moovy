import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function ComerciosRootPage() {
    const session = await auth();

    if (!session) {
        redirect("/comercios/login");
    }

    redirect("/comercios/dashboard");
}
