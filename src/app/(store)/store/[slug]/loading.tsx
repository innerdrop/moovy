// perf/skeletons-y-optimizacion-imagenes (2026-07-26): esqueleto del perfil
// de comercio (la página más pesada del comprador: portada full-bleed + tarjeta
// de datos + grilla de productos). /tienda/[slug] redirige acá, así que este
// loading cubre los dos caminos.
export default function StoreProfileLoading() {
    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            {/* Portada full-bleed */}
            <div className="h-44 sm:h-56 sk-skeleton !rounded-none" />

            <div className="container mx-auto px-4 -mt-10">
                {/* Tarjeta de datos del comercio */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-2xl sk-skeleton flex-shrink-0" />
                        <div className="flex-1 space-y-2.5">
                            <div className="h-5 w-1/2 rounded sk-skeleton" />
                            <div className="h-3.5 w-1/3 rounded sk-skeleton" />
                            <div className="h-3.5 w-2/3 rounded sk-skeleton" />
                        </div>
                    </div>
                </div>

                {/* Chips de categorías del catálogo */}
                <div className="flex gap-2 mt-6 overflow-hidden">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-8 w-24 rounded-full sk-skeleton flex-shrink-0" />
                    ))}
                </div>

                {/* Grilla de productos */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-5">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
                            <div className="aspect-[3/2] sk-skeleton !rounded-none" />
                            <div className="p-3 space-y-2">
                                <div className="h-4 w-3/4 rounded sk-skeleton" />
                                <div className="flex items-center justify-between">
                                    <div className="h-5 w-16 rounded sk-skeleton" />
                                    <div className="h-5 w-5 rounded-full sk-skeleton" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
