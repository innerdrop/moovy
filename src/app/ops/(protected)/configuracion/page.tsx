// Admin Configuration Page - Configuración de la Tienda (Premium Dashboard Design)
import { prisma } from "@/lib/prisma";
import {
    Settings,
    DollarSign,
} from "lucide-react";
import ConfigForm from "./ConfigForm";
import { Switch } from "./Switch";
// PromoBannerImageUpload moved to dedicated /ops/banner-promo page

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

                            <div className="flex items-center justify-between p-5 bg-red-50/20 rounded-2xl border border-red-50">
                                <div>
                                    <h3 className="font-extrabold text-gray-900 text-sm">Flechas de Navegación</h3>
                                    <p className="text-[10px] text-slate-400 font-medium">Mostrar flechas ← → en el slider</p>
                                </div>
                                <Switch
                                    name="heroSliderShowArrows"
                                    defaultChecked={(settings as any)?.heroSliderShowArrows ?? true}
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

                    {/* Banner Promo — Moved to dedicated page */}
                    <a href="/ops/banner-promo" className="block bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 hover:border-pink-200 hover:shadow-md transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 -mr-16 -mt-16 rounded-full group-hover:scale-110 transition-transform duration-500" />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center">
                                    <span className="text-2xl">⚡</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 leading-none">Banner Promocional</h2>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Configurá el banner horizontal de la tienda</p>
                                </div>
                            </div>
                            <span className="text-pink-500 font-black text-sm group-hover:translate-x-1 transition-transform">
                                Ir a Banner Promo →
                            </span>
                        </div>
                    </a>
                </div>

                {/* Full Width: Redirect to Biblia Financiera */}
                <div className="lg:col-span-2">
                    <a href="/ops/config-biblia" className="block bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100 hover:border-red-200 hover:shadow-md transition-all group">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/20">
                                    <DollarSign className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 leading-none italic">Logística, Delivery y Finanzas</h2>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1.5">
                                        Configurá tarifas, zonas, clima, comisiones y más desde la Biblia Financiera
                                    </p>
                                </div>
                            </div>
                            <span className="text-red-500 font-black text-sm group-hover:translate-x-1 transition-transform">
                                Ir a Biblia Financiera →
                            </span>
                        </div>
                    </a>
                </div>

            </div>
        </ConfigForm>
    );
}
