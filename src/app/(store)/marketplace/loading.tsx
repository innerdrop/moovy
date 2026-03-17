export default function MarketplaceLoading() {
    return (
        <div className="min-h-screen mp-page">
            {/* ── Hero Skeleton ── */}
            <div className="relative overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED] via-[#6D28D9] to-[#5B21B6]" />
                {/* Decorative orbs */}
                <div className="absolute top-10 right-10 w-40 h-40 rounded-full bg-purple-400/20 blur-3xl mp-orb-1" />
                <div className="absolute bottom-0 left-10 w-32 h-32 rounded-full bg-violet-300/15 blur-2xl mp-orb-2" />

                <div className="relative z-10 px-4 pb-14 pt-12">
                    <div className="mx-auto max-w-5xl">
                        {/* Badge */}
                        <div className="mb-4 h-7 w-44 rounded-full mp-skeleton !bg-white/15" />
                        {/* Title */}
                        <div className="mb-2 h-10 w-64 rounded-lg mp-skeleton !bg-white/15" />
                        <div className="mb-1 h-10 w-48 rounded-lg mp-skeleton !bg-white/12" />
                        {/* Subtitle */}
                        <div className="mb-8 h-5 w-72 rounded-lg mp-skeleton !bg-white/10" />
                        {/* Search bar */}
                        <div className="h-14 max-w-xl rounded-2xl mp-skeleton !bg-white/20" />
                        {/* Stats */}
                        <div className="mt-6 flex gap-8">
                            <div className="h-4 w-28 rounded mp-skeleton !bg-white/10" />
                            <div className="h-4 w-24 rounded mp-skeleton !bg-white/10" />
                            <div className="hidden sm:block h-4 w-32 rounded mp-skeleton !bg-white/10" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-5xl px-4">
                {/* ── Category Chips Skeleton ── */}
                <div className="flex gap-2.5 pb-2 pt-5 overflow-x-auto">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-10 flex-shrink-0 rounded-full mp-skeleton"
                            style={{ width: `${70 + (i % 3) * 20}px` }}
                        />
                    ))}
                </div>

                {/* ── Filter Bar Skeleton ── */}
                <div className="flex items-center justify-between border-b border-purple-100/40 py-3 mt-1">
                    <div className="flex gap-2 items-center">
                        <div className="h-5 w-32 rounded mp-skeleton" />
                        <div className="h-7 w-20 rounded-lg mp-skeleton" />
                    </div>
                    <div className="h-7 w-28 rounded-lg mp-skeleton" />
                </div>

                {/* ── Featured Section Skeleton ── */}
                <div className="mt-8 mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-6 w-6 rounded mp-skeleton" />
                        <div className="h-6 w-40 rounded mp-skeleton" />
                    </div>
                    <div className="flex gap-4 overflow-hidden">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="w-[280px] flex-shrink-0 overflow-hidden rounded-2xl border border-purple-100/40 bg-white/70"
                            >
                                <div className="aspect-square mp-skeleton" />
                                <div className="space-y-2.5 p-3">
                                    <div className="h-4 w-3/4 rounded mp-skeleton" />
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded-full mp-skeleton" />
                                        <div className="h-3 w-1/3 rounded mp-skeleton" />
                                    </div>
                                    <div className="flex items-center justify-between pt-1">
                                        <div className="h-6 w-24 rounded mp-skeleton" />
                                        <div className="h-9 w-9 rounded-xl mp-skeleton" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Section Title Skeleton ── */}
                <div className="mb-5 flex items-center gap-2">
                    <div className="h-5 w-48 rounded mp-skeleton" />
                </div>

                {/* ── Grid Skeleton ── */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className="overflow-hidden rounded-2xl border border-purple-100/40 bg-white/70"
                        >
                            <div className="aspect-square mp-skeleton" />
                            <div className="space-y-2 p-3">
                                <div className="h-4 w-3/4 rounded mp-skeleton" />
                                <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded-full mp-skeleton" />
                                    <div className="h-3 w-1/3 rounded mp-skeleton" />
                                </div>
                                <div className="h-3 w-20 rounded-full mp-skeleton" />
                                <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-purple-50">
                                    <div className="h-5 w-20 rounded mp-skeleton" />
                                    <div className="h-9 w-9 rounded-xl mp-skeleton" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom spacer */}
                <div className="h-8" />
            </div>
        </div>
    );
}
