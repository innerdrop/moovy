import MiComercioForm from "@/components/comercios/MiComercioForm";
import SettingsForm from "@/components/comercios/SettingsForm";
import { loadProfileMerchant, loadSettingsMerchant } from "../_data";
import { SubHeader, MerchantMissing } from "../_ui";

export default async function HorariosPage() {
    const [profile, settings] = await Promise.all([loadProfileMerchant(), loadSettingsMerchant()]);
    if (!profile || !settings) return <MerchantMissing />;
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <SubHeader title="Horarios y estado" subtitle="Días y horarios de atención · abrir o pausar la tienda" />
            {/* Estado (abrir/pausar) arriba; el editor de horarios abajo. */}
            <SettingsForm merchant={settings.merchant} requiredDocFields={settings.requiredDocFields} section="estado" />
            <MiComercioForm merchant={profile} section="horarios" />
        </div>
    );
}
