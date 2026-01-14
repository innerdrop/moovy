import PointsConfigForm from "@/components/admin/PointsConfigForm";

export default function AdminSettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
                <p className="text-slate-500">Ajustes generales de la tienda y programa de lealtad.</p>
            </div>

            <PointsConfigForm />
        </div>
    );
}
