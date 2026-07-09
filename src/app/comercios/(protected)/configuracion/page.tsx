import { redirect } from "next/navigation";

// feat/reorg-mi-comercio: "Ajustes" se fusionó dentro de "Mi Comercio".
// Esta ruta queda como redirect para no romper links viejos ni marcadores.
export default function ConfiguracionRedirect() {
    redirect("/comercios/mi-comercio");
}
