export default function MisPedidosLoading() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 pt-6 pb-24">
                {/* Title */}
                <div className="flex items-center justify-between mb-5">
                    <div className="h-7 w-36 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-5">
                    <div className="flex-1 h-11 bg-gray-200 rounded-full animate-pulse" />
                    <div className="flex-1 h-11 bg-gray-100 rounded-full animate-pulse" />
                </div>

                {/* Cards */}
                <div className="space-y-3">
                    {[0, 1, 2].map(i => (
                        <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-4">
                                <div className="flex gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
                                    <div className="flex-1">
                                        <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-1.5" />
                                        <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
                                    </div>
                                    <div className="h-5 w-16 bg-gray-200 rounded animate-pulse flex-shrink-0" />
                                </div>
                                <div className="flex gap-4 mb-3">
                                    <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                                    <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                                </div>
                                <div className="flex gap-1.5 mb-3">
                                    <div className="h-6 w-20 bg-gray-50 rounded-md animate-pulse" />
                                    <div className="h-6 w-24 bg-gray-50 rounded-md animate-pulse" />
                                </div>
                                {i === 0 && (
                                    <div className="flex gap-0.5 h-1">
                                        {[0, 1, 2, 3, 4, 5, 6].map(j => (
                                            <div key={j} className={`flex-1 rounded-full animate-pulse ${j < 3 ? "bg-gray-200" : "bg-gray-100"}`} />
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="px-4 py-3 bg-gray-50/60 border-t border-gray-100 flex justify-between">
                                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                                <div className="w-4 h-4 bg-gray-100 rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
