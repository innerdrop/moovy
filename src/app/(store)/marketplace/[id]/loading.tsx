export default function ListingDetailLoading() {
    return (
        <div className="mp-page min-h-screen">
            <div className="mx-auto max-w-5xl px-4 py-4 lg:py-6">
                {/* Breadcrumb skeleton */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-3.5 w-24 rounded mp-skeleton" />
                    <div className="h-3.5 w-2 rounded mp-skeleton" />
                    <div className="h-3.5 w-20 rounded mp-skeleton" />
                </div>

                <div className="grid lg:grid-cols-2 gap-6 lg:gap-10">
                    {/* Gallery skeleton */}
                    <div className="space-y-2.5">
                        <div className="aspect-square rounded-2xl mp-skeleton" />
                        <div className="flex gap-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="w-16 h-16 rounded-xl mp-skeleton flex-shrink-0" />
                            ))}
                        </div>
                    </div>

                    {/* Details skeleton */}
                    <div className="flex flex-col gap-4">
                        {/* Category */}
                        <div className="h-6 w-24 rounded-full mp-skeleton" />
                        {/* Title */}
                        <div className="h-7 w-3/4 rounded mp-skeleton" />
                        <div className="h-7 w-1/2 rounded mp-skeleton" />
                        {/* Price + share */}
                        <div className="flex items-center justify-between">
                            <div className="h-9 w-32 rounded mp-skeleton" />
                            <div className="h-8 w-24 rounded-xl mp-skeleton" />
                        </div>
                        {/* Badges */}
                        <div className="flex gap-3">
                            <div className="h-6 w-16 rounded-full mp-skeleton" />
                            <div className="h-6 w-20 rounded mp-skeleton" />
                        </div>
                        {/* CTA button */}
                        <div className="h-14 w-full rounded-2xl mp-skeleton" />
                        {/* Trust signals */}
                        <div className="flex gap-4">
                            <div className="h-4 w-32 rounded mp-skeleton" />
                            <div className="h-4 w-28 rounded mp-skeleton" />
                        </div>
                        {/* Description */}
                        <div className="rounded-2xl border border-purple-100/40 bg-white/50 p-4 space-y-2">
                            <div className="h-4 w-24 rounded mp-skeleton" />
                            <div className="h-3 w-full rounded mp-skeleton" />
                            <div className="h-3 w-5/6 rounded mp-skeleton" />
                            <div className="h-3 w-3/4 rounded mp-skeleton" />
                        </div>
                        {/* Seller card */}
                        <div className="mp-glass rounded-2xl border border-purple-100/40 p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl mp-skeleton" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-32 rounded mp-skeleton" />
                                    <div className="h-3 w-24 rounded mp-skeleton" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related skeleton */}
                <div className="mt-10">
                    <div className="h-5 w-44 rounded mp-skeleton mb-3" />
                    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="overflow-hidden rounded-2xl border border-purple-100/40 bg-white/70">
                                <div className="aspect-square mp-skeleton" />
                                <div className="space-y-2 p-3">
                                    <div className="h-4 w-3/4 rounded mp-skeleton" />
                                    <div className="h-3 w-1/2 rounded mp-skeleton" />
                                    <div className="h-5 w-20 rounded mp-skeleton" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
