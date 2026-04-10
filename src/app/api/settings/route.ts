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
        if (typeof data.heroSliderShowArrows === "boolean") updateData.heroSliderShowArrows = data.heroSliderShowArrows;

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

        // === BIBLIA FINANCIERA FIELDS REMOVED ===
        // Los campos financieros (zonas, clima, comisiones, cash protocol,
        // delivery programado, timeouts) se manejan EXCLUSIVAMENTE desde
        // /api/admin/ops-config con validación estricta de rangos y audit log.
        // Este endpoint NO debe modificar parámetros financieros.
        // Consolidado: 2026-03-26

        // Promo Banner (Slide Publicitario)
        if (typeof data.promoBannerEnabled === "boolean") updateData.promoBannerEnabled = data.promoBannerEnabled;
        if (data.promoBannerTitle !== undefined) updateData.promoBannerTitle = data.promoBannerTitle || "";
        if (data.promoBannerSubtitle !== undefined) updateData.promoBannerSubtitle = data.promoBannerSubtitle || "";
        if (data.promoBannerButtonText !== undefined) updateData.promoBannerButtonText = data.promoBannerButtonText || "";
        if (data.promoBannerButtonLink !== undefined) updateData.promoBannerButtonLink = data.promoBannerButtonLink || "";
        if (data.promoBannerImage !== undefined) updateData.promoBannerImage = data.promoBannerImage || null;
        if (data.promoBannerCtaPosition !== undefined) updateData.promoBannerCtaPosition = data.promoBannerCtaPosition || "abajo-izquierda";

        // Promo Slides (JSON array of slides for carousel)
        if (data.promoSlidesJson !== undefined) {
            try {
                const parsed = typeof data.promoSlidesJson === "string"
                    ? JSON.parse(data.promoSlidesJson)
                    : data.promoSlidesJson;
                if (Array.isArray(parsed)) {
                    // Validate each slide has expected structure
                    const validSlides = parsed.map((slide: any, idx: number) => ({
                        id: slide.id || `slide-${idx}-${Date.now()}`,
                        title: typeof slide.title === "string" ? slide.title : "",
                        subtitle: typeof slide.subtitle === "string" ? slide.subtitle : "",
                        buttonText: typeof slide.buttonText === "string" ? slide.buttonText : "",
                        buttonLink: typeof slide.buttonLink === "string" ? slide.buttonLink : "/",
                        image: typeof slide.image === "string" ? slide.image : null,
                        ctaPosition: typeof slide.ctaPosition === "string" ? slide.ctaPosition : "abajo-izquierda",
                        enabled: typeof slide.enabled === "boolean" ? slide.enabled : true,
                        order: typeof slide.order === "number" ? slide.order : idx,
                    }));
                    updateData.promoSlidesJson = JSON.stringify(validSlides);
                }
            } catch {
                // Invalid JSON — skip silently
            }
        }

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
