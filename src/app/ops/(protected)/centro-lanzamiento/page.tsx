// feat/centro-lanzamiento: pantalla única de OPS que consolida todo lo que hay que
// hacer (o no) al lanzar. Reemplaza los "recordatorios manuales" del seed: te muestra
// el estado en vivo así no dependés de tu memoria ni de un calendario.
//
// Protegida por el layout de /ops/(protected). El trabajo real vive en el client.

import CentroLanzamientoClient from "./CentroLanzamientoClient";

export const dynamic = "force-dynamic";

export default function CentroLanzamientoPage() {
    return <CentroLanzamientoClient />;
}
