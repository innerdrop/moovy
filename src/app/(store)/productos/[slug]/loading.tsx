export default function ProductDetailLoading() {
    return (
        <div className="container mx-auto px-4 py-6 lg:py-10">
            {/* Breadcrumb skeleton */}
            <div className="flex gap-2 mb-6">
                <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-4 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-4 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
            </div>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Image skeleton */}
                <div className="aspect-square bg-gray-100 rounded-2xl animate-pulse" />

                {/* Info skeleton */}
                <div className="space-y-4">
                    <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                    <div className="h-10 w-3/4 bg-gray-100 rounded animate-pulse" />
                    <div className="h-10 w-1/3 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
                    <div className="h-12 w-full bg-gray-100 rounded-xl animate-pulse mt-6" />
                </div>
            </div>
        </div>
    );
}
