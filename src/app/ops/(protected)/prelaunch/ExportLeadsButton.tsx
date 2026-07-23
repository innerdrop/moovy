"use client";

// Botón de exportar a CSV los pre-registros. Rama: feat/landing-cortina-preregistro.
// Genera el CSV en el cliente desde los datos ya cargados (sin endpoint extra).

type Lead = {
    role: string;
    name: string | null;
    businessName: string | null;
    rubro: string | null;
    email: string;
    whatsapp: string | null;
    consentAt: string | null;
    createdAt: string;
};

// Mapa explícito (CLIENTE existía y caía como "Repartidor" en el ternario)
const ROLE_LABEL: Record<string, string> = {
    COMERCIO: "Comercio",
    DRIVER: "Repartidor",
    CLIENTE: "Cliente",
};

function csvCell(v: string | null): string {
    const s = (v ?? "").replace(/"/g, '""');
    return `"${s}"`;
}

export default function ExportLeadsButton({ leads }: { leads: Lead[] }) {
    const download = () => {
        const header = ["Rol", "Nombre", "Comercio", "Rubro", "Email", "WhatsApp", "Consentimiento", "Fecha alta"];
        const rows = leads.map((l) =>
            [
                ROLE_LABEL[l.role] ?? l.role,
                l.name,
                l.businessName,
                l.rubro,
                l.email,
                l.whatsapp,
                l.consentAt,
                l.createdAt,
            ]
                .map(csvCell)
                .join(";")
        );
        // BOM para que Excel respete tildes.
        const csv = "﻿" + [header.map(csvCell).join(";"), ...rows].join("\r\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `moovy-prelanzamiento-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <button
            onClick={download}
            disabled={leads.length === 0}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
            Exportar CSV ({leads.length})
        </button>
    );
}
