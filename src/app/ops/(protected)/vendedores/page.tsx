import { redirect } from "next/navigation";

export default function VendedoresRedirect() {
    redirect("/ops/usuarios?tab=vendedores");
}
