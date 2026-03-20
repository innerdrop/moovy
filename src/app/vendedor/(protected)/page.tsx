import { redirect } from "next/navigation";

export default function VendedorProtectedRoot() {
    redirect("/vendedor/dashboard");
}
