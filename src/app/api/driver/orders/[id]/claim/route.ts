// ⚠️ fix/asignacion-y-logistica (2026-06-05): RUTA ELIMINADA (claim / pull manual).
//
// El flujo de "pedidos disponibles para agarrar" (self-claim) fue retirado: ahora
// la asignación es 100% por OFERTA automática (push) + accept/reject. Esta ruta ya
// no tiene callers en el frontend (el dashboard del repartidor usa /accept y /reject).
//
// NO se pudo borrar físicamente el archivo desde el entorno de la tarea (el mount es
// read-only para unlink). Quedó como stub 410 Gone para mantener el build válido y
// cualquier llamada legacy responde "ya no existe". BORRAR FÍSICAMENTE con:
//   Remove-Item "src/app/api/driver/orders/[id]/claim" -Recurse -Force
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
    return NextResponse.json(
        { error: "Esta función ya no está disponible. Los pedidos se asignan automáticamente." },
        { status: 410 }
    );
}
