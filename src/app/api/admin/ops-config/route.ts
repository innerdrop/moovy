import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { hasAnyRole } from "@/lib/auth-utils";
import {
  getFullOpsConfig,
  updateDeliveryConfig,
  updateCommissionConfig,
  updatePointsConfig,
  updateCashProtocolConfig,
  updateScheduledDeliveryConfig,
  updateTimeoutConfig,
  logConfigChange,
} from "@/lib/ops-config";
import { pino } from "pino";

const logger = pino();

export async function GET(request: Request) {
  const limited = await applyRateLimit(
    request,
    "ops-config:read",
    30,
    60_000
  );
  if (limited) return limited;

  try {
    const session = await auth();
    if (!session || !hasAnyRole(session, ["ADMIN"])) {
      logger.warn({ email: (session?.user as any)?.email }, "Unauthorized OPS config read attempt");
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const config = await getFullOpsConfig();
    logger.info({ email: (session?.user as any)?.email }, "OPS config retrieved");
    return NextResponse.json(config);
  } catch (error) {
    logger.error({ error }, "OPS config GET error");
    return NextResponse.json(
      { error: "Error al obtener configuración" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const limited = await applyRateLimit(
    request,
    "ops-config:write",
    30,
    60_000
  );
  if (limited) return limited;

  try {
    const session = await auth();
    if (!session || !hasAnyRole(session, ["ADMIN"])) {
      logger.warn({ email: (session?.user as any)?.email }, "Unauthorized OPS config write attempt");
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { section, data } = body;

    if (!section || !data) {
      return NextResponse.json(
        { error: "Se requiere section y data" },
        { status: 400 }
      );
    }

    // Get current config for audit logging
    const currentConfig = await getFullOpsConfig();
    const adminId = session.user?.id || "unknown";
    const adminEmail = (session?.user as any)?.email || "unknown";

    logger.info({ email: adminEmail, section }, "Updating OPS config section");

    switch (section) {
      case "delivery": {
        // Validate ranges
        if (
          data.baseDeliveryFee !== undefined &&
          (data.baseDeliveryFee < 0 || data.baseDeliveryFee > 10000)
        ) {
          return NextResponse.json(
            { error: "Tarifa base debe estar entre $0 y $10.000" },
            { status: 400 }
          );
        }
        if (
          data.fuelPricePerLiter !== undefined &&
          (data.fuelPricePerLiter < 100 || data.fuelPricePerLiter > 5000)
        ) {
          return NextResponse.json(
            { error: "Precio de combustible debe estar entre $100 y $5.000" },
            { status: 400 }
          );
        }
        if (
          data.riderCommissionPercent !== undefined &&
          (data.riderCommissionPercent < 50 || data.riderCommissionPercent > 95)
        ) {
          return NextResponse.json(
            { error: "Comisión repartidor debe estar entre 50% y 95%" },
            { status: 400 }
          );
        }
        if (
          data.operationalCostPercent !== undefined &&
          (data.operationalCostPercent < 0 || data.operationalCostPercent > 20)
        ) {
          return NextResponse.json(
            { error: "Costo operativo debe estar entre 0% y 20%" },
            { status: 400 }
          );
        }
        if (
          data.maxDeliveryDistance !== undefined &&
          (data.maxDeliveryDistance < 1 || data.maxDeliveryDistance > 100)
        ) {
          return NextResponse.json(
            { error: "Distancia máxima debe estar entre 1 y 100 km" },
            { status: 400 }
          );
        }
        if (
          data.fuelConsumptionPerKm !== undefined &&
          (data.fuelConsumptionPerKm < 0.01 || data.fuelConsumptionPerKm > 1)
        ) {
          return NextResponse.json(
            { error: "Consumo de combustible debe estar entre 0.01 y 1 L/km" },
            { status: 400 }
          );
        }
        if (
          data.maintenanceFactor !== undefined &&
          (data.maintenanceFactor < 1 || data.maintenanceFactor > 3)
        ) {
          return NextResponse.json(
            { error: "Factor mantenimiento debe estar entre 1.0 y 3.0" },
            { status: 400 }
          );
        }

        await updateDeliveryConfig(data);
        await logConfigChange(
          adminId,
          adminEmail,
          "STORE_SETTINGS",
          "delivery",
          currentConfig.delivery,
          data
        );
        break;
      }

      case "commissions": {
        if (
          data.defaultMerchantCommission !== undefined &&
          (data.defaultMerchantCommission < 1 || data.defaultMerchantCommission > 30)
        ) {
          return NextResponse.json(
            { error: "Comisión merchant debe estar entre 1% y 30%" },
            { status: 400 }
          );
        }
        if (
          data.defaultSellerCommission !== undefined &&
          (data.defaultSellerCommission < 1 || data.defaultSellerCommission > 30)
        ) {
          return NextResponse.json(
            { error: "Comisión seller debe estar entre 1% y 30%" },
            { status: 400 }
          );
        }
        if (
          data.riderCommissionPercent !== undefined &&
          (data.riderCommissionPercent < 50 || data.riderCommissionPercent > 95)
        ) {
          return NextResponse.json(
            { error: "Comisión repartidor debe estar entre 50% y 95%" },
            { status: 400 }
          );
        }

        await updateCommissionConfig(data);
        await logConfigChange(
          adminId,
          adminEmail,
          "STORE_SETTINGS",
          "commissions",
          currentConfig.commissions,
          data
        );
        break;
      }

      case "points": {
        if (
          data.pointsPerDollar !== undefined &&
          (data.pointsPerDollar < 0.01 || data.pointsPerDollar > 100)
        ) {
          return NextResponse.json(
            { error: "Puntos por peso debe estar entre 0.01 y 100" },
            { status: 400 }
          );
        }
        if (
          data.maxDiscountPercent !== undefined &&
          (data.maxDiscountPercent < 1 || data.maxDiscountPercent > 100)
        ) {
          return NextResponse.json(
            { error: "Máximo descuento debe estar entre 1% y 100%" },
            { status: 400 }
          );
        }
        if (
          data.minPointsToRedeem !== undefined &&
          (data.minPointsToRedeem < 1 || data.minPointsToRedeem > 10000)
        ) {
          return NextResponse.json(
            { error: "Puntos mínimos deben estar entre 1 y 10.000" },
            { status: 400 }
          );
        }
        if (
          data.signupBonus !== undefined &&
          (data.signupBonus < 0 || data.signupBonus > 10000)
        ) {
          return NextResponse.json(
            { error: "Bonus signup debe estar entre 0 y 10.000" },
            { status: 400 }
          );
        }

        await updatePointsConfig(data);
        await logConfigChange(
          adminId,
          adminEmail,
          "POINTS_CONFIG",
          "points",
          currentConfig.points,
          data
        );
        break;
      }

      case "cashProtocol": {
        if (
          data.cashMpOnlyDeliveries !== undefined &&
          (data.cashMpOnlyDeliveries < 0 || data.cashMpOnlyDeliveries > 100)
        ) {
          return NextResponse.json(
            { error: "Entregas solo MP debe estar entre 0 y 100" },
            { status: 400 }
          );
        }
        if (
          data.cashLimitL1 !== undefined &&
          (data.cashLimitL1 < 1000 || data.cashLimitL1 > 100000)
        ) {
          return NextResponse.json(
            { error: "Límite cash L1 debe estar entre $1.000 y $100.000" },
            { status: 400 }
          );
        }
        if (
          data.cashLimitL2 !== undefined &&
          (data.cashLimitL2 < 1000 || data.cashLimitL2 > 200000)
        ) {
          return NextResponse.json(
            { error: "Límite cash L2 debe estar entre $1.000 y $200.000" },
            { status: 400 }
          );
        }
        if (
          data.cashLimitL3 !== undefined &&
          (data.cashLimitL3 < 1000 || data.cashLimitL3 > 500000)
        ) {
          return NextResponse.json(
            { error: "Límite cash L3 debe estar entre $1.000 y $500.000" },
            { status: 400 }
          );
        }

        await updateCashProtocolConfig(data);
        await logConfigChange(
          adminId,
          adminEmail,
          "STORE_SETTINGS",
          "cashProtocol",
          currentConfig.cashProtocol,
          data
        );
        break;
      }

      case "scheduledDelivery": {
        if (
          data.maxOrdersPerSlot !== undefined &&
          (data.maxOrdersPerSlot < 1 || data.maxOrdersPerSlot > 100)
        ) {
          return NextResponse.json(
            { error: "Máx pedidos por slot debe estar entre 1 y 100" },
            { status: 400 }
          );
        }
        if (
          data.slotDurationMinutes !== undefined &&
          (data.slotDurationMinutes < 30 || data.slotDurationMinutes > 480)
        ) {
          return NextResponse.json(
            { error: "Duración slot debe estar entre 30 y 480 minutos" },
            { status: 400 }
          );
        }
        if (
          data.minAnticipationHours !== undefined &&
          (data.minAnticipationHours < 0.5 || data.minAnticipationHours > 24)
        ) {
          return NextResponse.json(
            { error: "Anticipación mínima debe estar entre 0.5 y 24 horas" },
            { status: 400 }
          );
        }
        if (
          data.maxAnticipationHours !== undefined &&
          (data.maxAnticipationHours < 1 || data.maxAnticipationHours > 168)
        ) {
          return NextResponse.json(
            { error: "Anticipación máxima debe estar entre 1 y 168 horas" },
            { status: 400 }
          );
        }

        await updateScheduledDeliveryConfig(data);
        await logConfigChange(
          adminId,
          adminEmail,
          "STORE_SETTINGS",
          "scheduledDelivery",
          currentConfig.scheduledDelivery,
          data
        );
        break;
      }

      case "timeouts": {
        if (
          data.merchantConfirmTimeoutSec !== undefined &&
          (data.merchantConfirmTimeoutSec < 30 || data.merchantConfirmTimeoutSec > 1800)
        ) {
          return NextResponse.json(
            { error: "Timeout merchant debe estar entre 30s y 30min" },
            { status: 400 }
          );
        }
        if (
          data.driverResponseTimeoutSec !== undefined &&
          (data.driverResponseTimeoutSec < 15 || data.driverResponseTimeoutSec > 300)
        ) {
          return NextResponse.json(
            { error: "Timeout driver debe estar entre 15s y 5min" },
            { status: 400 }
          );
        }

        await updateTimeoutConfig(data);
        await logConfigChange(
          adminId,
          adminEmail,
          "STORE_SETTINGS",
          "timeouts",
          currentConfig.timeouts,
          data
        );
        break;
      }

      default:
        return NextResponse.json(
          { error: `Sección desconocida: ${section}` },
          { status: 400 }
        );
    }

    // Revalidate all relevant paths
    revalidatePath("/ops");
    revalidatePath("/tienda");
    revalidatePath("/");

    const updatedConfig = await getFullOpsConfig();
    logger.info(
      { email: adminEmail, section },
      "OPS config section updated successfully"
    );
    return NextResponse.json({
      message: "Configuración actualizada",
      config: updatedConfig,
    });
  } catch (error) {
    logger.error(
      { error: (error as Error).message },
      "OPS config PUT error"
    );
    return NextResponse.json(
      { error: "Error al actualizar configuración: " + (error as Error).message },
      { status: 500 }
    );
  }
}
