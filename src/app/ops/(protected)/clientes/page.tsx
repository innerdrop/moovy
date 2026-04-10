import { redirect } from "next/navigation";

export default function ClientesRedirect() {
    redirect("/ops/usuarios?tab=clientes");
}
