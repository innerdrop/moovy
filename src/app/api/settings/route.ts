// API Route: Store Settings Update
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch current settings
export async function GET() {
    try {
        let settings = await prisma.storeSettings.findUnique({
            where: { id: "settings" },
        });

        if (!settings) {
            settings = await prisma.storeSettings.create({
                data: { id: "settings" },
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json(
            { error: "Error al obtener configuración" },
            { status: 500 }
        );
    }
}

// PUT - Update settings (Admin only)
export async function PUT(request: Request) {
    try {
        const session = await auth();
        const userRole = (session?.user as any)?.role;

        // Check for admin role (case insensitive)
        if (!session || !["ADMIN", "admin"].includes(userRole)) {
            // V-010 FIX: No PII in auth failure logs
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 401 }
            );
        }

        const data = await request.json();

        // Build update object with only defined values
        const updateData: any = {};

        // Booleans
        if (typeof data.isOpen === "boolean") updateData.isOpen = data.isOpen;
        if (typeof data.isMaintenanceMode === "boolean") updateData.isMaintenanceMode = data.isMaintenanceMode;
        if (typeof data.tiendaMaintenance === "boolean") updateData.tiendaMaintenance = data.tiendaMaintenance;
        if (typeof data.showRepartidoresCard === "boolean") updateData.showRepartidoresCard = data.showRepartidoresCard;
        if (typeof data.showComerciosCard === "boolean") updateData.showComerciosCard = data.showComerciosCard;
        if (typeof data.heroSliderEnabled === "boolean") updateData.heroSliderEnabled = data.heroSliderEnabled;

        // Strings
        if (data.closedMessage !== undefined) updateData.closedMessage = data.closedMessage || "";
        if (data.maintenanceMessage !== undefined) updateData.maintenanceMessage = data.maintenanceMessage || "";
        if (data.storeName !== undefined) updateData.storeName = data.storeName;
        if (data.whatsappNumber !== undefined) updateData.whatsappNumber = data.whatsappNumber || null;
        if (data.phone !== undefined) updateData.phone = data.phone || null;
        if (data.email !== undefined) updateData.email = data.email || null;

        // Promo Popup
        if (typeof data.promoPopupEnabled === "boolean") updateData.promoPopupEnabled = data.promoPopupEnabled;
        if (typeof data.promoPopupDismissable === "boolean") updateData.promoPopupDismissable = data.promoPopupDismissable;
        if (data.promoPopupTitle !== undefined) updateData.promoPopupTitle = data.promoPopupTitle || "";
        if (data.promoPopupMessage !== undefined) updateData.promoPopupMessage = data.promoPopupMessage || "";
        if (data.promoPopupImage !== undefined) updateData.promoPopupImage = data.promoPopupImage || "";
        if (data.promoPopupLink !== undefined) updateData.promoPopupLink = data.promoPopupLink || "";
        if (data.promoPopupButtonText !== undefined) updateData.promoPopupButtonText = data.promoPopupButtonText || "Ver más";

        // Floats
        if (data.fuelPricePerLiter) updateData.fuelPricePerLiter = parseFloat(data.fuelPricePerLiter);
        if (data.fuelConsumptionPerKm) updateData.fuelConsumptionPerKm = parseFloat(data.fuelConsumptionPerKm);
        if (data.baseDeliveryFee) updateData.baseDeliveryFee = parseFloat(data.baseDeliveryFee);
        if (data.maintenanceFactor) updateData.maintenanceFactor = parseFloat(data.maintenanceFactor);
        if (data.maxDeliveryDistance) updateData.maxDeliveryDistance = parseFloat(data.maxDeliveryDistance);
        if (data.riderCommissionPercent) updateData.riderCommissionPercent = parseFloat(data.riderCommissionPercent);


        // Integers
        if (data.maxCategoriesHome) updateData.maxCategoriesHome = parseInt(data.maxCategoriesHome);
        // Hero slider interval (value comes from ConfigForm already in milliseconds)
        if (data.heroSliderInterval) updateData.heroSliderInterval = parseInt(data.heroSliderInterval);

        // === OPS CONFIG: Biblia Financiera fields ===
        // Zone & Climate
        if (data.zoneMultipliersJson !== undefined) updateData.zoneMultipliersJson = data.zoneMultipliersJson;
        if (data.climateMultipliersJson !== undefined) updateData.climateMultipliersJson = data.climateMultipliersJson;
        if (data.activeClimateCondition !== undefined) updateData.activeClimateCondition = data.activeClimateCondition;
        if (data.operationalCostPercent !== undefined) updateData.operationalCostPercent = parseFloat(data.operationalCostPercent);
        // Commission defaults
        if (data.defaultMerchantCommission !== undefined) updateData.defaultMerchantCommission = parseFloat(data.defaultMerchantCommission);
        if (data.defaultSellerCommission !== undefined) updateData.defaultSellerCommission = parseFloat(data.defaultSellerCommission);
        // Cash Protocol
        if (data.cashMpOnlyDeliveries !== undefined) updateData.cashMpOnlyDeliveries = parseInt(data.cashMpOnlyDeliveries);
        if (data.cashLimitL1 !== undefined) updateData.cashLimitL1 = parseFloat(data.cashLimitL1);
        if (data.cashLimitL2 !== undefined) updateData.cashLimitL2 = parseFloat(data.cashLimitL2);
        if (data.cashLimitL3 !== undefined) updateData.cashLimitL3 = parseFloat(data.cashLimitL3);
        // Scheduled Delivery
        if (data.maxOrdersPerSlot !== undefined) updateData.maxOrdersPerSlot = parseInt(data.maxOrdersPerSlot);
        if (data.slotDurationMinutes !== undefined) updateData.slotDurationMinutes = parseInt(data.slotDurationMinutes);
        if (data.minAnticipationHours !== undefined) updateData.minAnticipationHours = parseFloat(data.minAnticipationHours);
        if (data.maxAnticipationHours !== undefined) updateData.maxAnticipationHours = parseFloat(data.maxAnticipationHours);
        if (data.operatingHoursStart !== undefined) updateData.operatingHoursStart = data.operatingHoursStart;
        if (data.operatingHoursEnd !== undefined) updateData.operatingHoursEnd = data.operatingHoursEnd;
        // Timeouts
        if (data.merchantConfirmTimeoutSec !== undefined) updateData.merchantConfirmTimeoutSec = parseInt(data.merchantConfirmTimeoutSec);
        if (data.driverResponseTimeoutSec !== undefined) updateData.driverResponseTimeoutSec = parseInt(data.driverResponseTimeoutSec);

        // Promo Banner (Slide Publicitario)
        if (typeof data.promoBannerEnabled === "boolean") updateData.promoBannerEnabled = data.promoBannerEnabled;
        if (data.promoBannerTitle !== undefined) updateData.promoBannerTitle = data.promoBannerTitle || "";
        if (data.promoBannerSubtitle !== undefined) updateData.promoBannerSubtitle = data.promoBannerSubtitle || "";
        if (data.promoBannerButtonText !== undefined) updateData.promoBannerButtonText = data.promoBannerButtonText || "";
        if (data.promoBannerButtonLink !== undefined) updateData.promoBannerButtonLink = data.promoBannerButtonLink || "";
        if (data.promoBannerImage !== undefined) updateData.promoBannerImage = data.promoBannerImage || null;

        // Optional float (can be null)
        if (data.freeDeliveryMinimum) {
            updateData.freeDeliveryMinimum = parseFloat(data.freeDeliveryMinimum);
        } else if (data.freeDeliveryMinimum === "" || data.freeDeliveryMinimum === null) {
            updateData.freeDeliveryMinimum = null;
        }

        // V-010 FIX: Removed sensitive data logging

        const settings = await prisma.storeSettings.upsert({
            where: { id: "settings" },
            update: updateData,
            create: {
                id: "settings",
                ...updateData,
            },
        });

        revalidatePath("/tienda");
        revalidatePath("/");
        revalidatePath("/mantenimiento");

        return NextResponse.json({
            message: "Configuración actualizada",
            settings
        });
    } catch (error) {
        console.error("Error updating settings:", error);
        return NextResponse.json(
            { error: "Error al actualizar configuración: " + (error as Error).message },
            { status: 500 }
        );
    }
}
