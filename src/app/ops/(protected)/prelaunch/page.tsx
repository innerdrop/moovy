// Vista OPS: lista de pre-registros (lista de espera) de comercios y repartidores.
// Rama: feat/landing-cortina-preregistro
// Protegida por el layout de /ops/(protected).

import { prisma } from "@/lib/prisma";
import ExportLeadsButton from "./ExportLeadsButton";
import DeleteLeadButton from "./DeleteLeadButton";

export const dynamic = "force-dynamic";

export default async function PreLaunchLeadsPage() {
    const leads = await prisma.preLaunchLead.findMany({
        orderBy: { createdAt: "desc" },
    });

    const comercios = leads.filter((l) => l.role === "COMERCIO").length;
    const drivers = leads.filter((l) => l.role === "DRIVER").length;
    const clientes = leads.filter((l) => l.role === "CLIENTE").length;

    // Mapa explícito de roles (nunca ternario binario: CLIENTE se mostraba
    // como "Repartidor")
    const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
        COMERCIO: { label: "Comercio", cls: "bg-red-50 text-[#e60012]" },
        DRIVER: { label: "Repartidor", cls: "bg-green-50 text-green-700" },
        CLIENTE: { label: "Cliente", cls: "bg-amber-50 text-amber-700" },
    };

    const exportable = leads.map((l) => ({
        role: l.role,
        name: l.name,
        businessName: l.businessName,
        rubro: l.rubro,
        vehicle: l.vehicle,
        worksOtherApp: l.worksOtherApp,
        earningsRange: l.earningsRange,
        email: l.email,
        whatsapp: l.whatsapp,
        consentAt: l.consentAt ? l.consentAt.toISOString() : null,
        createdAt: l.createdAt.toISOString(),
    }));

    const VEHICLE_LABEL: Record<string, string> = { BICI: "Bici", MOTO: "Moto", AUTO: "Auto", FLETE: "Flete" };

    const fmt = (d: Date) =>
        d.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Lista de espera (pre-lanzamiento)</h1>
                    <p className="text-sm text-slate-500">
                        Comercios, repartidores y clientes que se anotaron desde la cortina para que los contactemos al lanzar.
                    </p>
                </div>
                <ExportLeadsButton leads={exportable} />
            </div>

            <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="rounded-xl border border-slate-100 bg-white p-4 text-center">
                    <p className="text-xs font-bold uppercase text-slate-400">Total</p>
                    <p className="text-2xl font-black text-slate-800">{leads.length}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-4 text-center">
                    <p className="text-xs font-bold uppercase text-slate-400">Comercios</p>
                    <p className="text-2xl font-black text-[#e60012]">{comercios}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-4 text-center">
                    <p className="text-xs font-bold uppercase text-slate-400">Repartidores</p>
                    <p className="text-2xl font-black text-green-600">{drivers}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-4 text-center">
                    <p className="text-xs font-bold uppercase text-slate-400">Clientes</p>
                    <p className="text-2xl font-black text-amber-600">{clientes}</p>
                </div>
            </div>

            {leads.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-400">
                    Todavía no se anotó nadie. Cuando alguien complete el formulario de la cortina, va a aparecer acá.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                                <th className="px-4 py-3">Rol</th>
                                <th className="px-4 py-3">Nombre</th>
                                <th className="px-4 py-3">Comercio / Rubro</th>
                                <th className="px-4 py-3">Vehículo</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">WhatsApp</th>
                                <th className="px-4 py-3">Fecha</th>
                                <th className="px-4 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.map((l) => (
                                <tr key={l.id} className="border-b border-slate-50 last:border-0">
                                    <td className="px-4 py-3">
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${(ROLE_BADGE[l.role] ?? { cls: "bg-slate-100 text-slate-600" }).cls}`}>
                                            {(ROLE_BADGE[l.role] ?? { label: l.role }).label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">{l.name || "—"}</td>
                                    <td className="px-4 py-3 text-slate-700">
                                        {l.businessName || l.rubro ? (
                                            <>
                                                {l.businessName || "—"}
                                                {l.rubro && <span className="block text-xs text-slate-400">{l.rubro}</span>}
                                            </>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">
                                        {l.vehicle ? (
                                            <>
                                                {VEHICLE_LABEL[l.vehicle] ?? l.vehicle}
                                                {l.worksOtherApp != null && (
                                                    <span className="block text-xs text-slate-400">
                                                        {l.worksOtherApp ? `Reparte en otra app${l.earningsRange && l.earningsRange !== "Prefiero no decirlo" ? ` · ${l.earningsRange}/viaje` : ""}` : "No reparte en otra app"}
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">{l.email}</td>
                                    <td className="px-4 py-3 text-slate-700">{l.whatsapp || "—"}</td>
                                    <td className="px-4 py-3 text-slate-500">{fmt(l.createdAt)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <DeleteLeadButton id={l.id} email={l.email} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
