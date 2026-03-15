export default function TrustBar() {
    return (
        <div className="border-t border-b border-gray-100 bg-gray-50 py-4 px-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <span className="text-xs font-semibold text-gray-500">Pagás seguro con</span>
                <div className="flex items-center gap-2">
                    {["MercadoPago", "Efectivo", "VISA", "Mastercard"].map((name) => (
                        <span
                            key={name}
                            className="text-[11px] font-bold text-gray-500 bg-white border border-gray-200 rounded-md px-2.5 py-1"
                        >
                            {name}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
