import { redirect } from "next/navigation";

export default function ComerciosRedirect() {
    redirect("/ops/usuarios?tab=comercios");
}
