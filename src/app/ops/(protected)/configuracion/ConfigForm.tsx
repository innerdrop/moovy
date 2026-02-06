"use client";

import { useState, useRef } from "react";
import { Save, Loader2 } from "lucide-react";

interface ConfigFormProps {
    children: React.ReactNode;
    initialSettings: any;
}

export default function ConfigForm({ children, initialSettings }: ConfigFormProps) {
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        const formData = new FormData(formRef.current!);

        // Build settings object from form
        // Checkboxes in HTML: if checked, they are present in FormData as "on"
        // If not checked, they are NOT present in FormData.
        const settings: any = {

            // Maintenance mode
            isMaintenanceMode: formData.get("isMaintenanceMode") === "on",
            tiendaMaintenance: formData.get("tiendaMaintenance") === "on",
            maintenanceMessage: formData.get("maintenanceMessage") || "",

            // Delivery
            fuelPricePerLiter: formData.get("fuelPricePerLiter"),
            fuelConsumptionPerKm: formData.get("fuelConsumptionPerKm"),
            baseDeliveryFee: formData.get("baseDeliveryFee"),
            maintenanceFactor: formData.get("maintenanceFactor"),
            freeDeliveryMinimum: formData.get("freeDeliveryMinimum"),
            maxDeliveryDistance: formData.get("maxDeliveryDistance"),

            // Store location
            storeName: formData.get("storeName"),
            storeAddress: formData.get("storeAddress"),
            originLat: formData.get("originLat"),
            originLng: formData.get("originLng"),

            // Contact
            whatsappNumber: formData.get("whatsappNumber"),
            phone: formData.get("phone"),
            email: formData.get("email"),

            // Promo Popup
            promoPopupEnabled: formData.get("promoPopupEnabled") === "on",
            promoPopupTitle: formData.get("promoPopupTitle") || "",
            promoPopupMessage: formData.get("promoPopupMessage") || "",
            promoPopupImage: formData.get("promoPopupImage") || "",
            promoPopupLink: formData.get("promoPopupLink") || "",
            promoPopupButtonText: formData.get("promoPopupButtonText") || "",
            promoPopupDismissable: formData.get("promoPopupDismissable") === "on",

            // Landing cards
            showRepartidoresCard: formData.get("showRepartidoresCard") === "on",
            showComerciosCard: formData.get("showComerciosCard") === "on",
            maxCategoriesHome: formData.get("maxCategoriesHome"),
        };

        try {
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });

            if (res.ok) {
                setMessage({ type: "success", text: "✅ Configuración guardada correctamente" });
            } else {
                const data = await res.json();
                setMessage({ type: "error", text: data.error || "Error al guardar" });
            }
        } catch (error) {
            setMessage({ type: "error", text: "Error de conexión" });
        } finally {
            setSaving(false);
            // Clear message after 3 seconds
            setTimeout(() => setMessage(null), 3000);
        }
    };

    return (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
            {children}

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg ${message.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary flex items-center gap-2 px-8 disabled:opacity-50"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Guardar Cambios
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
