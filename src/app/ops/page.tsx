import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function OpsRootPage() {
    const session = await auth();

    if (!session) {
        redirect("/ops/login");
    }

    redirect("/ops/dashboard");
}
