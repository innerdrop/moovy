export default function ProductosLoading() {
    return (
        <div className="container mx-auto px-4 py-6">
            {/* Search bar skeleton */}
            <div className="h-12 bg-gray-100 rounded-xl animate-pulse mb-6" />

            {/* Category pills skeleton */}
            <div className="flex gap-2 overflow-hidden mb-8">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-9 w-24 bg-gray-100 rounded-full animate-pulse flex-shrink-0" />
                ))}
            </div>

            {/* Product grid skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                        <div className="aspect-square bg-gray-100 animate-pulse" />
                        <div className="p-3 space-y-2">
                            <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                            <div className="h-5 bg-gray-100 rounded animate-pulse w-1/2" />
                            <div className="h-3 bg-gray-100 rounded animate-pulse w-1/3" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
