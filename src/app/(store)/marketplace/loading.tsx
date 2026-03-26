export default function MarketplaceLoading() {
    return (
        <div className="min-h-screen mp-page">
            {/* ── Hero Compacto Skeleton ── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#7C3AED] via-[#6D28D9] to-[#5B21B6]">
                <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-purple-400/10 blur-3xl mp-orb-1" />
                <div className="relative z-10 mx-auto max-w-5xl px-4 pb-5 pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="h-7 w-56 rounded-lg mp-skeleton !bg-white/15 mb-2" />
                            <div className="h-4 w-72 rounded mp-skeleton !bg-white/10" />
                        </div>
                        <div className="hidden sm:block h-9 w-20 rounded-xl mp-skeleton !bg-white/12" />
                    </div>
                    <div className="mt-3 flex gap-6">
                        <div className="h-3.5 w-28 rounded mp-skeleton !bg-white/10" />
                        <div className="h-3.5 w-24 rounded mp-skeleton !bg-white/10" />
                        <div className="h-3.5 w-28 rounded mp-skeleton !bg-white/10" />
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-5xl px-4">
                {/* ── Search bar skeleton ── */}
                <div className="pt-3 pb-1">
                    <div className="h-12 rounded-2xl mp-skeleton mb-2" />
                </div>

                {/* ── Category Chips Skeleton ── */}
                <div className="flex gap-2 pb-2 overflow-x-auto">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-8 flex-shrink-0 rounded-full mp-skeleton"
                            style={{ width: `${65 + (i % 3) * 18}px` }}
                        />
                    ))}
                </div>

                {/* ── Filter Bar Skeleton ── */}
                <div className="flex items-center justify-between border-b border-purple-100/40 py-2.5">
                    <div className="flex gap-2 items-center">
                        <div className="h-4 w-20 rounded mp-skeleton" />
                        <div className="h-7 w-18 rounded-lg mp-skeleton" />
                    </div>
                    <div className="h-7 w-28 rounded-lg mp-skeleton" />
                </div>

                {/* ── Featured Section Skeleton ── */}
                <div className="mt-4 mb-4">
                    <div className="flex items-center gap-2 mb-2.5">
                        <div className="h-6 w-6 rounded-lg mp-skeleton" />
                        <div className="h-5 w-24 rounded mp-skeleton" />
                        <div className="h-5 w-28 rounded-full mp-skeleton" />
                    </div>
                    <div className="flex gap-2.5 overflow-hidden">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className="w-[200px] flex-shrink-0 overflow-hidden rounded-2xl border border-purple-100/40 bg-white/70"
                            >
                                <div className="aspect-square mp-skeleton" />
                                <div className="space-y-2 p-3">
                                    <div className="h-4 w-3/4 rounded mp-skeleton" />
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-4.5 h-4.5 rounded-full mp-skeleton" />
                                        <div className="h-3 w-1/3 rounded mp-skeleton" />
                                    </div>
                                    <div className="flex items-center justify-between pt-1">
                                        <div className="h-5 w-20 rounded mp-skeleton" />
                                        <div className="h-8 w-8 rounded-xl mp-skeleton" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Section Title ── */}
                <div className="mb-3 h-4 w-40 rounded mp-skeleton" />

                {/* ── Grid Skeleton ── */}
                <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className="overflow-hidden rounded-2xl border border-purple-100/40 bg-white/70"
                        >
                            <div className="aspect-square mp-skeleton" />
                            <div className="space-y-2 p-3">
                                <div className="h-4 w-3/4 rounded mp-skeleton" />
                                <div className="flex items-center gap-1.5">
                                    <div className="w-4.5 h-4.5 rounded-full mp-skeleton" />
                                    <div className="h-3 w-1/3 rounded mp-skeleton" />
                                </div>
                                <div className="flex items-center justify-between pt-1.5 border-t border-purple-50">
                                    <div className="h-5 w-20 rounded mp-skeleton" />
                                    <div className="h-8 w-8 rounded-xl mp-skeleton" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="h-8" />
            </div>
        </div>
    );
}
