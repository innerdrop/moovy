import MiComercioForm from "@/components/comercios/MiComercioForm";
import { loadProfileMerchant } from "../_data";
import { SubHeader, MerchantMissing } from "../_ui";

export default async function PerfilPage() {
    const merchant = await loadProfileMerchant();
    if (!merchant) return <MerchantMissing />;
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <SubHeader title="Perfil" subtitle="Portada, logo, descripción y redes sociales" />
            <MiComercioForm merchant={merchant} section="perfil" />
        </div>
    );
}
