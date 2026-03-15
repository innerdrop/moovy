import { Search, CreditCard, Clock } from "lucide-react";

const steps = [
    {
        step: "1",
        title: "Elegí",
        desc: "Buscá lo que querés",
        Icon: Search,
        bgColor: "bg-red-50",
        iconColor: "text-[#e60012]",
    },
    {
        step: "2",
        title: "Pagá",
        desc: "MP o efectivo",
        Icon: CreditCard,
        bgColor: "bg-green-50",
        iconColor: "text-green-600",
    },
    {
        step: "3",
        title: "Recibí",
        desc: "Delivery en minutos",
        Icon: Clock,
        bgColor: "bg-blue-50",
        iconColor: "text-blue-600",
    },
];

export default function HowItWorks() {
    return (
        <div className="py-4 px-4">
            <div className="flex gap-3 overflow-x-auto scrollbar-hide md:grid md:grid-cols-3 md:gap-4 max-w-4xl mx-auto" style={{ scrollbarWidth: "none" }}>
                {steps.map((item) => (
                    <div
                        key={item.step}
                        className="flex-shrink-0 w-[140px] md:w-auto bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center"
                    >
                        <div className={`w-10 h-10 ${item.bgColor} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                            <item.Icon className={`w-5 h-5 ${item.iconColor}`} />
                        </div>
                        <div className="text-sm font-bold text-gray-900">{item.title}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">{item.desc}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
