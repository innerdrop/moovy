import SettingsForm from "@/components/comercios/SettingsForm";
import { loadSettingsMerchant } from "../_data";
import { SubHeader, MerchantMissing } from "../_ui";

export default async function EntregasPage() {
    const data = await loadSettingsMerchant();
    if (!data) return <MerchantMissing />;
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <SubHeader title="Entregas y pedidos" subtitle="Radio, pedido mínimo, retiro en local y tiempo de preparación" />
            <SettingsForm merchant={data.merchant} requiredDocFields={data.requiredDocFields} section="entregas" />
        </div>
    );
}
