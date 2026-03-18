// Admin Configuration Page - Configuración de la Tienda (Premium Dashboard Design)
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/delivery";
import {
    Settings,
    Store,
    Truck,
    DollarSign,
    MapPin,
    Phone,
} from "lucide-react";
import ConfigForm from "./ConfigForm";
import { Switch } from "./Switch";
import PromoBannerImageUpload from "./PromoBannerImageUpload";

async function getSettings() {
    try {
        let settings = await prisma.storeSettings.findUnique({
            where: { id: "settings" },
        });

        if (!settings) {
            settings = await prisma.storeSettings.create({
                data: { id: "settings" },
            });
        }

        return settings;
    } catch (error) {
        return null;
    }
}

export default async function ConfigurationPage() {
    const settings = await getSettings();

    return (
        <ConfigForm initialSettings={settings}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 italic">
                        <div className="w-12 h-12 rounded-2xl bg-navy flex items-center justify-center shadow-lg shadow-navy/20 not-italic">
                            <Settings className="w-7 h-7 text-white" />
                        </div>
                        Configuración
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 ml-1">Panel de control global del sistema</p>
                </div>
            </div>

            {/* Configuration Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Maintenance & Visibility */}
                <div className="space-y-8">
                    {/* Maintenance Mode Section */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 -mr-16 -mt-16 rounded-full group-hover:scale-110 transition-transform duration-500" />

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
                                <span className="text-2xl">🚧</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900 leading-none">Mantenimiento</h2>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Control de acceso global</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Toggle Landing */}
                            <div className="flex items-center justify-between p-5 bg-orange-50/50 rounded-2xl border border-orange-100/50">
                                <div className="max-w-[70%]">
                                    <h3 className="font-extrabold text-gray-900 text-sm">Modo Landing</h3>
                                    <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                                        Muestra "Volvemos Pronto" en la página principal.
                                    </p>
                                </div>
                                <Switch
                                    name="isMaintenanceMode"
                                    defaultChecked={settings?.isMaintenanceMode ?? false}
                                    activeColor="bg-orange-500"
                                />
                            </div>

                            {/* Toggle Tienda */}
                            <div className="flex items-center justify-between p-5 bg-red-50/50 rounded-2xl border border-red-100/50">
                                <div className="max-w-[70%]">
                                    <h3 className="font-extrabold text-red-700 text-sm">Modo Catálogo</h3>
                                    <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                                        Bloquea la navegación por productos y compras.
                                    </p>
                                </div>
                                <Switch
                                    name="tiendaMaintenance"
                                    defaultChecked={settings?.tiendaMaintenance ?? false}
                                    activeColor="bg-red-500"
                                />
                            </div>

                            {/* Maintenance Message */}
                            <div className="pt-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">
                                    Mensaje al usuario
                                </label>
                                <textarea
                                    defaultValue={settings?.maintenanceMessage || ""}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all resize-none"
                                    rows={2}
                                    placeholder="¡Volvemos pronto! Estamos trabajando para mejorar tu experiencia."
                                    name="maintenanceMessage"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Visibility Section */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 -mr-16 -mt-16 rounded-full group-hover:scale-110 transition-transform duration-500" />

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                                <span className="text-2xl">🎯</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900 leading-none">Visibilidad</h2>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Landing y Sliders</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-5 bg-blue-50/30 rounded-2xl border border-blue-50">
                                <div>
                                    <h3 className="font-extrabold text-gray-900 text-sm">Registro Repartidores</h3>
                                    <p className="text-[10px] text-slate-400 font-medium">Mostrar tarjeta en landing</p>
                                </div>
                                <Switch
                                    name="showRepartidoresCard"
                                    defaultChecked={settings?.showRepartidoresCard ?? true}
                                    activeColor="bg-blue-500"
                                />
                            </div>

                            <div className="flex items-center justify-between p-5 bg-blue-50/30 rounded-2xl border border-blue-50">
                                <div>
                                    <h3 className="font-extrabold text-gray-900 text-sm">Registro Comercios</h3>
                                    <p className="text-[10px] text-slate-400 font-medium">Mostrar tarjeta en landing</p>
                                </div>
                                <Switch
                                    name="showComerciosCard"
                                    defaultChecked={settings?.showComerciosCard ?? true}
                                    activeColor="bg-blue-500"
                                />
                            </div>

                            <div className="flex items-center justify-between p-5 bg-red-50/30 rounded-2xl border border-red-50">
                                <div>
                                    <h3 className="font-extrabold text-gray-900 text-sm">Slider Promocional</h3>
                                    <p className="text-[10px] text-slate-400 font-medium">Mostrar banners en la landing</p>
                                </div>
                                <Switch
                                    name="heroSliderEnabled"
                                    defaultChecked={(settings as any)?.heroSliderEnabled ?? true}
                                    activeColor="bg-red-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                        Categorías en Home
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        defaultValue={settings?.maxCategoriesHome ?? 6}
                                        className="w-full bg-white border border-slate-100 rounded-xl px-3 py-2 font-black text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        name="maxCategoriesHome"
                                    />
                                </div>
                                <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                                    <label className="block text-[9px] font-black text-red-400 uppercase tracking-widest mb-2">
                                        Intervalo Slider
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            max="30"
                                            step="1"
                                            defaultValue={Math.round((settings?.heroSliderInterval ?? 5000) / 1000)}
                                            className="w-full bg-white border border-red-100 rounded-xl px-3 py-2 font-black text-gray-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                                            name="heroSliderInterval"
                                        />
                                        <span className="text-[10px] font-black text-red-400">SEG</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Promos & Branding */}
                <div className="space-y-8">
                    {/* Promo Popup Section */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 -mr-16 -mt-16 rounded-full group-hover:scale-110 transition-transform duration-500" />

                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                                    <span className="text-2xl">🎉</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 leading-none">Popup Promo</h2>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Ventana emergente</p>
                                </div>
                            </div>
                            <Switch
                                name="promoPopupEnabled"
                                defaultChecked={settings?.promoPopupEnabled ?? false}
                                activeColor="bg-red-500"
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Título</label>
                                    <input
                                        type="text"
                                        defaultValue={settings?.promoPopupTitle || ""}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                                        placeholder="¡Super Oferta!"
                                        name="promoPopupTitle"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Mensaje</label>
                                    <textarea
                                        defaultValue={settings?.promoPopupMessage || ""}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-red-500 focus:outline-none transition-all resize-none"
                                        rows={2}
                                        placeholder="Aprovecha 20% OFF..."
                                        name="promoPopupMessage"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Botón</label>
                                    <input
                                        type="text"
                                        defaultValue={settings?.promoPopupButtonText || "Ver más"}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                                        name="promoPopupButtonText"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Link</label>
                                    <input
                                        type="text"
                                        defaultValue={settings?.promoPopupLink || ""}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                                        placeholder="/tienda"
                                        name="promoPopupLink"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-red-50/50 rounded-2xl border border-red-100/50">
                                <input
                                    type="checkbox"
                                    defaultChecked={settings?.promoPopupDismissable ?? true}
                                    className="w-5 h-5 text-red-600 rounded-lg border-red-200 focus:ring-red-500"
                                    name="promoPopupDismissable"
                                    id="promoPopupDismissable"
                                />
                                <label htmlFor="promoPopupDismissable" className="text-xs font-bold text-gray-900 select-none">
                                    Permitir cerrar (Cruz visible)
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Banner Card Section */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 -mr-16 -mt-16 rounded-full group-hover:scale-110 transition-transform duration-500" />

                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center">
                                    <span className="text-2xl">⚡</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 leading-none">Banner /Tienda</h2>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Banner horizontal</p>
                                </div>
                            </div>
                            <Switch
                                name="promoBannerEnabled"
                                defaultChecked={(settings as any)?.promoBannerEnabled ?? true}
                                activeColor="bg-pink-500"
                            />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Título (con \n)</label>
                                <input
                                    type="text"
                                    defaultValue={(settings as any)?.promoBannerTitle ?? "Noches de\nPizza & Pelis"}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                                    name="promoBannerTitle"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Subtítulo</label>
                                <input
                                    type="text"
                                    defaultValue={(settings as any)?.promoBannerSubtitle ?? "2x1 en locales seleccionados de 20hs a 23hs."}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                                    name="promoBannerSubtitle"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Texto Botón</label>
                                    <input
                                        type="text"
                                        defaultValue={(settings as any)?.promoBannerButtonText ?? "Ver locales"}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                                        name="promoBannerButtonText"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Link Botón</label>
                                    <input
                                        type="text"
                                        defaultValue={(settings as any)?.promoBannerButtonLink ?? "/productos?categoria=pizzas"}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                                        name="promoBannerButtonLink"
                                    />
                                </div>
                            </div>
                            <PromoBannerImageUpload
                                currentImage={(settings as any)?.promoBannerImage}
                                name="promoBannerImage"
                            />
                        </div>
                    </div>
                </div>

                {/* Full Width: Delivery Tools */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-32 bg-navy/[0.02] -mt-16 rounded-[100%] group-hover:h-40 transition-all duration-500" />

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-navy flex items-center justify-center shadow-lg shadow-navy/20">
                                    <Truck className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 leading-none italic">Logística de Delivery</h2>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-moovy rounded-full" />
                                        Cálculo inteligente de tarifas
                                    </p>
                                </div>
                            </div>

                            {/* Fast Action Cost Preview */}
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3 flex items-center gap-4">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Costo base hoy</p>
                                    <p className="text-xl font-black text-gray-900 leading-none">
                                        ${settings?.baseDeliveryFee || 500}
                                    </p>
                                </div>
                                <div className="w-px h-8 bg-slate-200" />
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Envío Gratis desde</p>
                                    <p className="text-xl font-black text-moovy leading-none">
                                        {settings?.freeDeliveryMinimum ? `$${settings.freeDeliveryMinimum}` : "Desactivado"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">
                                    <DollarSign className="w-3 h-3" />
                                    Precio Nafta (L)
                                </label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black">$</span>
                                    <input
                                        type="number"
                                        defaultValue={settings?.fuelPricePerLiter || 1200}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-4 text-lg font-black text-gray-900 focus:ring-2 focus:ring-navy focus:outline-none transition-all group-hover:bg-white"
                                        name="fuelPricePerLiter"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">
                                    <Store className="w-3 h-3" />
                                    Consumo L/KM
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    defaultValue={settings?.fuelConsumptionPerKm || 0.06}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-lg font-black text-gray-900 focus:ring-2 focus:ring-navy focus:outline-none transition-all hover:bg-white"
                                    name="fuelConsumptionPerKm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">
                                    <Settings className="w-3 h-3" />
                                    Factor Mantenimiento
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    defaultValue={settings?.maintenanceFactor || 1.35}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-lg font-black text-gray-900 focus:ring-2 focus:ring-navy focus:outline-none transition-all hover:bg-white"
                                    name="maintenanceFactor"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">
                                    <MapPin className="w-3 h-3" />
                                    Distancia Máx (KM)
                                </label>
                                <input
                                    type="number"
                                    defaultValue={settings?.maxDeliveryDistance || 15}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-lg font-black text-gray-900 focus:ring-2 focus:ring-navy focus:outline-none transition-all hover:bg-white"
                                    name="maxDeliveryDistance"
                                />
                            </div>

                            <div className="space-y-2 lg:col-span-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">
                                    <DollarSign className="w-3 h-3" />
                                    Configurador Envío Gratis
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black">$</span>
                                        <input
                                            type="number"
                                            defaultValue={settings?.baseDeliveryFee || 500}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-4 text-lg font-black text-gray-900 focus:ring-2 focus:ring-navy focus:outline-none transition-all group-hover:bg-white"
                                            name="baseDeliveryFee"
                                            placeholder="Base"
                                        />
                                    </div>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-moovy/30 font-black">$</span>
                                        <input
                                            type="number"
                                            defaultValue={settings?.freeDeliveryMinimum || ""}
                                            className="w-full bg-moovy/5 border border-moovy/10 rounded-2xl pl-10 pr-4 py-4 text-lg font-black text-moovy focus:ring-2 focus:ring-moovy focus:outline-none transition-all group-hover:bg-white"
                                            placeholder="Umbral"
                                            name="freeDeliveryMinimum"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Rider Commission Section */}
                        <div className="mt-8 p-6 bg-green-50 border border-green-100 rounded-[2rem] relative overflow-hidden">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                                    <span className="text-xl">🏍️</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 leading-none">Ganancia del Rider</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Porcentaje del envío que cobra el repartidor</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-green-700 uppercase tracking-widest mb-1.5 pl-1">
                                        Comisión Rider (%)
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="1"
                                            defaultValue={(settings as any)?.riderCommissionPercent ?? 80}
                                            className="w-full bg-white border border-green-200 rounded-2xl px-5 py-4 text-lg font-black text-gray-900 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all group-hover:bg-green-50/50"
                                            name="riderCommissionPercent"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400 font-black">%</span>
                                    </div>
                                </div>

                                <div className="p-4 bg-white rounded-2xl border border-green-100 flex flex-col justify-center">
                                    <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-1">Rider gana</p>
                                    <p className="text-xl font-black text-green-700">
                                        {(settings as any)?.riderCommissionPercent ?? 80}% del envío
                                    </p>
                                </div>

                                <div className="p-4 bg-white rounded-2xl border border-green-100 flex flex-col justify-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Moovy retiene</p>
                                    <p className="text-xl font-black text-gray-900">
                                        {100 - ((settings as any)?.riderCommissionPercent ?? 80)}% del envío
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 p-6 bg-navy text-white rounded-[2rem] shadow-xl shadow-navy/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 -mr-24 -mt-24 rounded-full" />
                            <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                                <span className="w-2 h-2 bg-moovy rounded-full animate-pulse" />
                                Simulador de Costos (Envío 5 KM)
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-900-light uppercase tracking-widest mb-1 opacity-60">Distancia</p>
                                    <p className="text-xl font-black">5 KM <span className="text-xs font-normal opacity-40">(10km I/V)</span></p>
                                </div>
                                <div className="border-l border-white/10 pl-6">
                                    <p className="text-[10px] font-bold text-gray-900-light uppercase tracking-widest mb-1 opacity-60">Nafta Estimada</p>
                                    <p className="text-xl font-black">${Math.round(10 * 0.06 * (settings?.fuelPricePerLiter || 1200))}</p>
                                </div>
                                <div className="border-l border-white/10 pl-6">
                                    <p className="text-[10px] font-black text-moovy uppercase tracking-widest mb-1">Cliente paga</p>
                                    <p className="text-2xl font-black text-moovy">
                                        ${Math.ceil((Math.round(10 * 0.06 * (settings?.fuelPricePerLiter || 1200)) + (settings?.baseDeliveryFee || 500)) * (settings?.maintenanceFactor || 1.35))}
                                    </p>
                                </div>
                                <div className="border-l border-white/10 pl-6">
                                    <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">Rider gana</p>
                                    <p className="text-2xl font-black text-green-400">
                                        ${Math.round(Math.ceil((Math.round(10 * 0.06 * (settings?.fuelPricePerLiter || 1200)) + (settings?.baseDeliveryFee || 500)) * (settings?.maintenanceFactor || 1.35)) * ((settings as any)?.riderCommissionPercent ?? 80) / 100)}
                                    </p>
                                </div>
                                <div className="border-l border-white/10 pl-6">
                                    <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mb-1">Moovy gana</p>
                                    <p className="text-2xl font-black text-yellow-400">
                                        ${Math.ceil((Math.round(10 * 0.06 * (settings?.fuelPricePerLiter || 1200)) + (settings?.baseDeliveryFee || 500)) * (settings?.maintenanceFactor || 1.35)) - Math.round(Math.ceil((Math.round(10 * 0.06 * (settings?.fuelPricePerLiter || 1200)) + (settings?.baseDeliveryFee || 500)) * (settings?.maintenanceFactor || 1.35)) * ((settings as any)?.riderCommissionPercent ?? 80) / 100)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Card */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 group">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
                                <Phone className="w-6 h-6 text-green-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900 leading-none">Canales de Contacto</h2>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Soporte y Atención</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1 italic">WhatsApp</label>
                                <input
                                    type="tel"
                                    defaultValue={settings?.whatsappNumber || ""}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    placeholder="+54 264 555 5555"
                                    name="whatsappNumber"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1 italic">Teléfono</label>
                                <input
                                    type="tel"
                                    defaultValue={settings?.phone || ""}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="+54 264 555 5555"
                                    name="phone"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1 italic">Email</label>
                                <input
                                    type="email"
                                    defaultValue={settings?.email || ""}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                                    placeholder="contacto@Moovysanjuan.com"
                                    name="email"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ConfigForm>
    );
}
