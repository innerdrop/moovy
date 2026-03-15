export default function MarketplaceLoading() {
    return (
        <div className="container mx-auto px-4 py-6">
            {/* Header skeleton */}
            <div className="h-8 bg-gray-100 rounded animate-pulse w-48 mb-2" />
            <div className="h-4 bg-gray-100 rounded animate-pulse w-72 mb-6" />

            {/* Search + filters skeleton */}
            <div className="h-12 bg-gray-100 rounded-xl animate-pulse mb-4" />
            <div className="flex gap-2 mb-8">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-9 w-28 bg-gray-100 rounded-full animate-pulse flex-shrink-0" />
                ))}
            </div>

            {/* Listings grid skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                        <div className="aspect-square bg-gray-100 animate-pulse" />
                        <div className="p-3 space-y-2">
                            <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                            <div className="h-5 bg-gray-100 rounded animate-pulse w-1/2" />
                            <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
