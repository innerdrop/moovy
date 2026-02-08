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
            console.log("Auth failed - session:", session?.user, "role:", userRole);
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 401 }
            );
        }

        const data = await request.json();
        console.log("Updating settings with data:", data);

        // Build update object with only defined values
        const updateData: any = {};

        // Booleans
        if (typeof data.isOpen === "boolean") updateData.isOpen = data.isOpen;
        if (typeof data.isMaintenanceMode === "boolean") updateData.isMaintenanceMode = data.isMaintenanceMode;
        if (typeof data.tiendaMaintenance === "boolean") updateData.tiendaMaintenance = data.tiendaMaintenance;
        if (typeof data.showRepartidoresCard === "boolean") updateData.showRepartidoresCard = data.showRepartidoresCard;
        if (typeof data.showComerciosCard === "boolean") updateData.showComerciosCard = data.showComerciosCard;

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


        // Integers
        if (data.maxCategoriesHome) updateData.maxCategoriesHome = parseInt(data.maxCategoriesHome);
        // Hero slider interval (value comes from ConfigForm already in milliseconds)
        if (data.heroSliderInterval) updateData.heroSliderInterval = parseInt(data.heroSliderInterval);

        // Optional float (can be null)
        if (data.freeDeliveryMinimum) {
            updateData.freeDeliveryMinimum = parseFloat(data.freeDeliveryMinimum);
        } else if (data.freeDeliveryMinimum === "" || data.freeDeliveryMinimum === null) {
            updateData.freeDeliveryMinimum = null;
        }

        console.log("Prisma update data:", updateData);

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
