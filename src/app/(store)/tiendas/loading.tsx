// perf/skeletons-y-optimizacion-imagenes (2026-07-26): esqueleto de /tiendas
// con la MISMA forma que la página real (header blanco con título + grilla de
// tarjetas de comercio 1/2/3/4/5 columnas) — el contenido "aparece" en su
// lugar sin saltos de layout.
export default function TiendasLoading() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-100">
                <div className="mx-auto max-w-7xl px-4 lg:px-6 xl:px-8 py-6 lg:py-8">
                    <div className="h-8 sm:h-9 w-64 rounded-lg sk-skeleton mb-2" />
                    <div className="h-4 w-80 max-w-full rounded sk-skeleton" />
                </div>
            </div>
            <div className="mx-auto max-w-7xl px-4 lg:px-6 xl:px-8 py-6 lg:py-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="rounded-xl bg-white border border-gray-100 overflow-hidden shadow-sm">
                            <div className="aspect-video sk-skeleton !rounded-none" />
                            <div className="p-3 space-y-2">
                                <div className="h-4 w-3/4 rounded sk-skeleton" />
                                <div className="h-3 w-1/2 rounded sk-skeleton" />
                                <div className="h-3 w-2/3 rounded sk-skeleton" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
