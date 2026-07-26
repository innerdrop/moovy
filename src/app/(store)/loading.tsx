// perf/skeletons-y-optimizacion-imagenes (2026-07-26): esqueleto de carga del
// grupo (store). Aplica al HOME y a cualquier ruta del grupo sin loading.tsx
// propio — por eso es NEUTRO (bloques grises genéricos): hero + circulitos de
// categorías + filas de tarjetas. El AppHeader vive en el layout, así que ya
// se ve mientras esto se muestra. Nunca más una pantalla en blanco.
export default function StoreGroupLoading() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-7xl px-4 lg:px-6 py-5 space-y-6">
                {/* Hero */}
                <div className="h-40 sm:h-52 rounded-3xl sk-skeleton" />

                {/* Categorías (circulitos) */}
                <div className="flex gap-4 overflow-hidden">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
                            <div className="w-16 h-16 rounded-[22px] sk-skeleton" />
                            <div className="h-2.5 w-12 rounded sk-skeleton" />
                        </div>
                    ))}
                </div>

                {/* Fila de tarjetas */}
                <div className="space-y-3">
                    <div className="h-5 w-44 rounded sk-skeleton" />
                    <div className="flex gap-4 overflow-hidden">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="w-64 flex-shrink-0 rounded-2xl bg-white border border-gray-100 overflow-hidden">
                                <div className="aspect-[16/10] sk-skeleton !rounded-none" />
                                <div className="p-3 space-y-2">
                                    <div className="h-4 w-3/4 rounded sk-skeleton" />
                                    <div className="h-3 w-1/2 rounded sk-skeleton" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Grilla de tarjetas */}
                <div className="space-y-3">
                    <div className="h-5 w-52 rounded sk-skeleton" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
                                <div className="aspect-video sk-skeleton !rounded-none" />
                                <div className="p-3 space-y-2">
                                    <div className="h-4 w-2/3 rounded sk-skeleton" />
                                    <div className="h-3 w-1/3 rounded sk-skeleton" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
