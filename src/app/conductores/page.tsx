// Conductores Portal - Root redirect to dashboard
import { redirect } from "next/navigation";

export default function ConductoresRootPage() {
    redirect("/dashboard");
}
