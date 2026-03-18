export default function TrustBar() {
    return (
        <div className="border-t border-b border-gray-100 bg-gray-50 py-4 px-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <span className="text-xs font-semibold text-gray-500">Pagás seguro con</span>
                <div className="flex items-center gap-3 flex-wrap justify-center">
                    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-center h-9">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/Mercado_Pago.svg.png" alt="MercadoPago" className="h-5 w-auto max-w-[80px] object-contain" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-center h-9">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/VISA-Logo.png" alt="Visa" className="h-5 w-auto max-w-[80px] object-contain" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-center h-9">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo-Mastercard.png" alt="Mastercard" className="h-5 w-auto max-w-[80px] object-contain" />
                    </div>
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-3 py-2 h-9">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="6" width="20" height="12" rx="2"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                        <span className="text-[11px] font-bold text-green-600">Efectivo</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
