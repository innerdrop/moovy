"use client";

import { useState, useRef } from "react";
import { Save, Loader2 } from "lucide-react";
import { toast } from "@/store/toast";
import { confirm } from "@/store/confirm";

interface ConfigFormProps {
    children: React.ReactNode;
    initialSettings: any;
}

export default function ConfigForm({ children, initialSettings }: ConfigFormProps) {
    const [saving, setSaving] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const ok = await confirm({
            title: "Guardar configuración",
            message: "Los cambios se aplicarán de inmediato en la tienda. ¿Confirmar?",
            confirmLabel: "Guardar",
            variant: "warning",
        });
        if (!ok) return;

        setSaving(true);

        const formData = new FormData(formRef.current!);

        const settings: any = {
            isMaintenanceMode: formData.get("isMaintenanceMode") === "on",
            tiendaMaintenance: formData.get("tiendaMaintenance") === "on",
            maintenanceMessage: formData.get("maintenanceMessage") || "",
            promoPopupEnabled: formData.get("promoPopupEnabled") === "on",
            promoPopupTitle: formData.get("promoPopupTitle") || "",
            promoPopupMessage: formData.get("promoPopupMessage") || "",
            promoPopupImage: formData.get("promoPopupImage") || "",
            promoPopupLink: formData.get("promoPopupLink") || "",
            promoPopupButtonText: formData.get("promoPopupButtonText") || "",
            promoPopupDismissable: formData.get("promoPopupDismissable") === "on",
            maxCategoriesHome: formData.get("maxCategoriesHome"),
            heroSliderEnabled: formData.get("heroSliderEnabled") === "on",
            heroSliderShowArrows: formData.get("heroSliderShowArrows") === "on",
            heroSliderInterval: parseInt(formData.get("heroSliderInterval") as string || "5") * 1000,
            heroBackgroundsJson: formData.get("heroBackgroundsJson") || undefined,
        };

        try {
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });

            if (res.ok) {
                toast.success("Configuración guardada correctamente");
            } else {
                const data = await res.json();
                toast.error(data.error || "Error al guardar");
            }
        } catch {
            toast.error("Error de conexión");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
            {children}

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
