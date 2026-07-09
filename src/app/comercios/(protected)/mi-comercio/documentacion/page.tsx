import SettingsForm from "@/components/comercios/SettingsForm";
import { loadSettingsMerchant } from "../_data";
import { SubHeader, MerchantMissing } from "../_ui";

export default async function DocumentacionPage() {
    const data = await loadSettingsMerchant();
    if (!data) return <MerchantMissing />;
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <SubHeader title="Documentación" subtitle="CUIT, CBU y habilitaciones para operar" />
            <SettingsForm merchant={data.merchant} requiredDocFields={data.requiredDocFields} section="documentacion" />
        </div>
    );
}
