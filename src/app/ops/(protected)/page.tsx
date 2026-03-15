// Redirect to dashboard (the actual dashboard lives at /ops/dashboard)
import { redirect } from "next/navigation";

export default function OpsProtectedRoot() {
    redirect("/ops/dashboard");
}
