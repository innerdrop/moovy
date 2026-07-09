import SettingsForm from "@/components/comercios/SettingsForm";
import { loadSettingsMerchant } from "../_data";
import { SubHeader, MerchantMissing } from "../_ui";

export default async function MercadoPagoPage() {
    const data = await loadSettingsMerchant();
    if (!data) return <MerchantMissing />;
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <SubHeader title="MercadoPago" subtitle="Vinculá tu cuenta de cobro y mirá tu comisión" />
            <SettingsForm merchant={data.merchant} requiredDocFields={data.requiredDocFields} section="mercadopago" />
        </div>
    );
}
