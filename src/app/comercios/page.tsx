// Comercios Portal - Root redirect to dashboard
import { redirect } from "next/navigation";

export default function ComerciosRootPage() {
    redirect("/dashboard");
}
