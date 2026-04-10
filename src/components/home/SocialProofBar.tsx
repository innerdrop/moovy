import { Package, Store } from "lucide-react";

interface SocialProofBarProps {
    totalDelivered: number;
    activeMerchants: number;
}

export default function SocialProofBar({ totalDelivered, activeMerchants }: SocialProofBarProps) {
    if (totalDelivered === 0 && activeMerchants === 0) return null;

    return (
        <div className="bg-white">
            <div className="container mx-auto px-4 py-2.5 flex items-center justify-center gap-5 flex-wrap">
                {totalDelivered > 0 && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                        </span>
                        <Package className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-600 font-medium">
                            <span className="font-bold text-gray-900">+{totalDelivered.toLocaleString("es-AR")}</span> pedidos entregados
                        </span>
                    </div>
                )}
                {activeMerchants > 0 && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Store className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-600 font-medium">
                            <span className="font-bold text-gray-900">{activeMerchants}</span> comercios activos
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
