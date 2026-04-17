import { redirect } from "next/navigation";

export default function RepartidoresRedirect() {
    redirect("/ops/usuarios?tab=repartidores");
}
