export default function OrderDetailLoading() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-full animate-pulse" />
                <div className="flex-1">
                    <div className="h-4 w-36 bg-gray-200 rounded animate-pulse mb-1.5" />
                    <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="w-9 h-9 bg-gray-100 rounded-full animate-pulse" />
            </div>

            <div className="container mx-auto px-4 pt-5 space-y-4">
                {/* Status hero */}
                <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />

                {/* Timeline */}
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mb-4" />
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-3 mb-4 last:mb-0">
                            <div className="w-[30px] h-[30px] bg-gray-100 rounded-full animate-pulse" />
                            <div className="h-3.5 w-36 bg-gray-100 rounded animate-pulse" />
                        </div>
                    ))}
                </div>

                {/* Merchant */}
                <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                    <div className="w-11 h-11 bg-gray-100 rounded-xl animate-pulse" />
                    <div className="flex-1">
                        <div className="h-2.5 w-14 bg-gray-100 rounded animate-pulse mb-1.5" />
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    </div>
                </div>

                {/* Items */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
                    </div>
                    {[0, 1, 2].map(i => (
                        <div key={i} className="px-4 py-3 flex justify-between items-center border-b border-gray-50 last:border-0">
                            <div className="flex gap-2.5">
                                <div className="w-7 h-7 bg-gray-100 rounded-md animate-pulse" />
                                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                            </div>
                            <div className="h-4 w-14 bg-gray-100 rounded animate-pulse" />
                        </div>
                    ))}
                    <div className="bg-gray-50 px-4 py-3 space-y-2">
                        <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                        <div className="h-5 w-full bg-gray-200 rounded animate-pulse" />
                    </div>
                </div>

                {/* Address */}
                <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                        <div className="h-2.5 w-12 bg-gray-100 rounded animate-pulse" />
                        <div className="h-4 w-44 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
                <div className="container mx-auto">
                    <div className="h-12 w-full bg-gray-100 rounded-xl animate-pulse" />
                </div>
            </div>
        </div>
    );
}
