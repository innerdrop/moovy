// Admin Configuration Page - Configuración de la Tienda
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
            <div>
                <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
                    <Settings className="w-6 h-6" />
                    Configuración
                </h1>
                <p className="text-gray-600">Configurá los parámetros de tu tienda</p>
            </div>

            {/* Maintenance Mode Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-orange-200">
                <h2 className="text-lg font-bold text-navy mb-4 flex items-center gap-2">
                    🚧 Modo Mantenimiento (Landing)
                </h2>

                <div className="space-y-4">
                    {/* Toggle */}
                    <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                        <div>
                            <h3 className="font-semibold text-navy">Página en Mantenimiento</h3>
                            <p className="text-sm text-gray-600">
                                Cuando está activo, la landing mostrará "Volvemos Pronto"
                            </p>
                        </div>
                        <Switch
                            name="isMaintenanceMode"
                            defaultChecked={settings?.isMaintenanceMode ?? false}
                            activeColor="bg-orange-500"
                        />
                    </div>

                    {/* Tienda Maintenance Toggle */}
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                        <div>
                            <h3 className="font-semibold text-navy text-red-700">Mantenimiento Catálogo (/tienda)</h3>
                            <p className="text-sm text-gray-600">
                                Cuando está activo, la ruta /tienda mostrará su mensaje de mantenimiento
                            </p>
                        </div>
                        <Switch
                            name="tiendaMaintenance"
                            defaultChecked={settings?.tiendaMaintenance ?? false}
                            activeColor="bg-red-500"
                        />
                    </div>

                    {/* Maintenance Message */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mensaje de mantenimiento
                        </label>
                        <textarea
                            defaultValue={settings?.maintenanceMessage || ""}
                            className="input resize-none"
                            rows={2}
                            placeholder="¡Volvemos pronto! Estamos trabajando para mejorar tu experiencia."
                            name="maintenanceMessage"
                        />
                    </div>
                </div>
            </div>

            {/* Promo Popup Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-purple-200">
                <h2 className="text-lg font-bold text-navy mb-4 flex items-center gap-2">
                    <span className="text-2xl">🎉</span>
                    Popup Promocional
                </h2>

                <div className="space-y-4">
                    {/* Enable Toggle */}
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                        <div>
                            <h3 className="font-semibold text-navy">Activar Popup</h3>
                            <p className="text-sm text-gray-600">
                                Se mostrará al ingresar a la tienda (una vez por sesión)
                            </p>
                        </div>
                        <Switch
                            name="promoPopupEnabled"
                            defaultChecked={settings?.promoPopupEnabled ?? false}
                            activeColor="bg-purple-500"
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Título
                            </label>
                            <input
                                type="text"
                                defaultValue={settings?.promoPopupTitle || ""}
                                className="input"
                                placeholder="¡Super Oferta!"
                                name="promoPopupTitle"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mensaje
                            </label>
                            <textarea
                                defaultValue={settings?.promoPopupMessage || ""}
                                className="input resize-none"
                                rows={2}
                                placeholder="Aprovecha 20% OFF en tu primera compra con el cupón BIENVENIDA"
                                name="promoPopupMessage"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                URL Imagen (Opcional)
                            </label>
                            <input
                                type="text"
                                defaultValue={settings?.promoPopupImage || ""}
                                className="input"
                                placeholder="https://..."
                                name="promoPopupImage"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Link de Destino (Opcional)
                            </label>
                            <input
                                type="text"
                                defaultValue={settings?.promoPopupLink || ""}
                                className="input"
                                placeholder="/comercios/ejemplo"
                                name="promoPopupLink"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Texto del Botón
                            </label>
                            <input
                                type="text"
                                defaultValue={settings?.promoPopupButtonText || "Ver más"}
                                className="input"
                                placeholder="Ir a la oferta"
                                name="promoPopupButtonText"
                            />
                        </div>

                        <div className="flex items-center gap-3 mt-4">
                            <input
                                type="checkbox"
                                defaultChecked={settings?.promoPopupDismissable ?? true}
                                className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                name="promoPopupDismissable"
                                id="promoPopupDismissable"
                            />
                            <label htmlFor="promoPopupDismissable" className="text-sm text-gray-700 select-none">
                                Permitir cerrar (Cruz visible)
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Landing Cards Visibility */}
            <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-blue-200">
                <h2 className="text-lg font-bold text-navy mb-4 flex items-center gap-2">
                    🎯 Tarjetas del Landing (Comunidad)
                </h2>

                <div className="space-y-4">
                    {/* Repartidores Toggle */}
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div>
                            <h3 className="font-semibold text-navy">Mostrar Tarjeta Repartidores</h3>
                            <p className="text-sm text-gray-600">
                                Activa/desactiva la tarjeta de registro de repartidores en la landing
                            </p>
                        </div>
                        <Switch
                            name="showRepartidoresCard"
                            defaultChecked={settings?.showRepartidoresCard ?? true}
                            activeColor="bg-blue-500"
                        />
                    </div>

                    {/* Comercios Toggle */}
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div>
                            <h3 className="font-semibold text-navy">Mostrar Tarjeta Comercios</h3>
                            <p className="text-sm text-gray-600">
                                Activa/desactiva la tarjeta de registro de comercios en la landing
                            </p>
                        </div>
                        <Switch
                            name="showComerciosCard"
                            defaultChecked={settings?.showComerciosCard ?? true}
                            activeColor="bg-blue-500"
                        />
                    </div>

                    {/* Max Categories */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <label className="block text-sm font-medium text-navy mb-1 uppercase tracking-wider font-bold">
                            Cantidad de Categorías en Sliders
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            defaultValue={settings?.maxCategoriesHome ?? 6}
                            className="input w-32"
                            name="maxCategoriesHome"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Define cuántas categorías se mostrarán en los sliders de Home y /tienda antes de repetir el ciclo.
                        </p>
                    </div>
                </div>
            </div>

            {/* Category Grid Configuration */}
            <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-emerald-200">
                <h2 className="text-lg font-bold text-navy mb-4 flex items-center gap-2">
                    📦 Diseño de Categorías (Tienda)
                </h2>

                <div className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                        {/* Columns */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Columnas
                            </label>
                            <select
                                name="categoryGridColumns"
                                defaultValue={settings?.categoryGridColumns ?? 4}
                                className="input w-full"
                            >
                                <option value={3}>3 columnas</option>
                                <option value={4}>4 columnas</option>
                            </select>
                        </div>

                        {/* Rows */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Filas visibles
                            </label>
                            <select
                                name="categoryGridRows"
                                defaultValue={settings?.categoryGridRows ?? 2}
                                className="input w-full"
                            >
                                <option value={1}>1 fila</option>
                                <option value={2}>2 filas</option>
                                <option value={3}>3 filas</option>
                            </select>
                        </div>

                        {/* Card Size */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tamaño de tarjetas
                            </label>
                            <select
                                name="categoryCardSize"
                                defaultValue={settings?.categoryCardSize ?? "medium"}
                                className="input w-full"
                            >
                                <option value="small">Pequeño</option>
                                <option value="medium">Mediano</option>
                                <option value="large">Grande</option>
                            </select>
                        </div>
                    </div>

                    {/* Scrollable Toggle */}
                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                        <div>
                            <h3 className="font-semibold text-navy">Scroll Horizontal</h3>
                            <p className="text-sm text-gray-600">
                                Permite deslizar las categorías hacia los costados
                            </p>
                        </div>
                        <Switch
                            name="categoryScrollable"
                            defaultChecked={settings?.categoryScrollable ?? false}
                            activeColor="bg-emerald-500"
                        />
                    </div>

                    {/* Auto-scroll Toggle */}
                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                        <div>
                            <h3 className="font-semibold text-navy">Auto-scroll</h3>
                            <p className="text-sm text-gray-600">
                                Las categorías se mueven automáticamente
                            </p>
                        </div>
                        <Switch
                            name="categoryAutoScroll"
                            defaultChecked={settings?.categoryAutoScroll ?? false}
                            activeColor="bg-emerald-500"
                        />
                    </div>

                    {/* Auto-scroll Speed */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Velocidad Auto-scroll (ms)
                        </label>
                        <input
                            type="number"
                            min="1000"
                            max="10000"
                            step="500"
                            defaultValue={settings?.categoryAutoScrollSpeed ?? 3000}
                            className="input w-40"
                            name="categoryAutoScrollSpeed"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Tiempo entre cada movimiento (1000ms = 1 segundo)
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-navy mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-moovy" />
                    Configuración de Delivery
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Fuel Price */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            💰 Precio de Nafta por Litro
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                defaultValue={settings?.fuelPricePerLiter || 1200}
                                className="input !pl-10"
                                name="fuelPricePerLiter"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Actualizá este valor cuando cambie el precio de la nafta
                        </p>
                    </div>

                    {/* Fuel Consumption */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            ⛽ Consumo por Km (L/km)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            defaultValue={settings?.fuelConsumptionPerKm || 0.06}
                            className="input"
                            name="fuelConsumptionPerKm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Moto: ~0.06 L/km | Auto: ~0.10 L/km
                        </p>
                    </div>

                    {/* Base Fee */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            🏠 Costo Base de Envío
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                defaultValue={settings?.baseDeliveryFee || 500}
                                className="input !pl-10"
                                name="baseDeliveryFee"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Mínimo que se cobra por viaje
                        </p>
                    </div>

                    {/* Maintenance Factor */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            🔧 Factor de Mantenimiento
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            defaultValue={settings?.maintenanceFactor || 1.35}
                            className="input"
                            name="maintenanceFactor"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            1.35 = 35% extra para cubiertas, service, contingencias y ganancia
                        </p>
                    </div>

                    {/* Max Distance */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            📍 Distancia Máxima de Delivery (km)
                        </label>
                        <input
                            type="number"
                            defaultValue={settings?.maxDeliveryDistance || 15}
                            className="input"
                            name="maxDeliveryDistance"
                        />
                    </div>

                    {/* Free Delivery Minimum */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            🆓 Envío Gratis desde ($ mínimo)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                defaultValue={settings?.freeDeliveryMinimum || ""}
                                className="input !pl-10"
                                placeholder="Dejá vacío para desactivar"
                                name="freeDeliveryMinimum"
                            />
                        </div>
                    </div>
                </div>

                {/* Cost Preview */}
                <div className="mt-6 p-4 bg-moovy-light rounded-lg">
                    <h3 className="font-semibold text-navy mb-2">
                        📊 Ejemplo de Cálculo (5 km)
                    </h3>
                    <div className="text-sm space-y-1">
                        <p>Ida y vuelta: 10 km</p>
                        <p>Nafta: 10 × 0.06 × ${settings?.fuelPricePerLiter || 1200} = ${Math.round(10 * 0.06 * (settings?.fuelPricePerLiter || 1200))}</p>
                        <p>Base: ${settings?.baseDeliveryFee || 500}</p>
                        <p>Subtotal: ${Math.round(10 * 0.06 * (settings?.fuelPricePerLiter || 1200)) + (settings?.baseDeliveryFee || 500)}</p>
                        <p className="font-bold text-moovy">
                            Total (×{settings?.maintenanceFactor || 1.35}): $
                            {Math.ceil((Math.round(10 * 0.06 * (settings?.fuelPricePerLiter || 1200)) + (settings?.baseDeliveryFee || 500)) * (settings?.maintenanceFactor || 1.35))}
                        </p>
                    </div>
                </div>
            </div>



            {/* Contact */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-navy mb-4 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-moovy" />
                    Contacto
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            WhatsApp
                        </label>
                        <input
                            type="tel"
                            defaultValue={settings?.whatsappNumber || ""}
                            className="input"
                            placeholder="+54 264 555 5555"
                            name="whatsappNumber"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Teléfono
                        </label>
                        <input
                            type="tel"
                            defaultValue={settings?.phone || ""}
                            className="input"
                            placeholder="+54 264 555 5555"
                            name="phone"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            defaultValue={settings?.email || ""}
                            className="input"
                            placeholder="contacto@Moovysanjuan.com"
                            name="email"
                        />
                    </div>
                </div>
            </div>
        </ConfigForm>
    );
}

