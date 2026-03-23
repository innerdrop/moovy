// API: Initialize canned responses (seed data)
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

const INITIAL_CANNED_RESPONSES = [
    {
        shortcut: "/saludo",
        title: "Saludo inicial",
        content: "¡Hola! Soy {operatorName} de MOOVY. ¿En qué puedo ayudarte?",
        category: "general",
        sortOrder: 1
    },
    {
        shortcut: "/horario",
        title: "Horario de atención",
        content: "Nuestro horario de atención es de lunes a sábado de 9:00 a 22:00.",
        category: "general",
        sortOrder: 2
    },
    {
        shortcut: "/estado-pedido",
        title: "Verificar estado de pedido",
        content:
            "Para verificar el estado de tu pedido, andá a 'Mis Pedidos' en el menú. ¿Necesitás ayuda con algo más?",
        category: "pedido",
        sortOrder: 3
    },
    {
        shortcut: "/demora",
        title: "Explicar demora",
        content:
            "Lamentamos la demora. Estamos contactando al comercio/repartidor para darte una actualización. Te pedimos unos minutos.",
        category: "pedido",
        sortOrder: 4
    },
    {
        shortcut: "/cancelar",
        title: "Información de cancelación",
        content:
            "Para cancelar un pedido, tenés que hacerlo antes de que el comercio lo confirme. ¿Querés que verifique si es posible?",
        category: "pedido",
        sortOrder: 5
    },
    {
        shortcut: "/pago",
        title: "Problemas de pago",
        content:
            "Los pagos con MercadoPago se procesan al instante. Si tenés un problema, compartime el número de pedido y lo verificamos.",
        category: "pago",
        sortOrder: 6
    },
    {
        shortcut: "/reclamo",
        title: "Registrar reclamo",
        content:
            "Lamento que hayas tenido una mala experiencia. Voy a registrar tu reclamo y un supervisor lo va a revisar en las próximas 24 horas.",
        category: "cuenta",
        sortOrder: 7
    },
    {
        shortcut: "/puntos",
        title: "Sistema de puntos",
        content:
            "Ganás 1 punto MOOVER por cada $1 que gastás. Podés canjearlos como descuento en tu próximo pedido (máximo 50% del total).",
        category: "general",
        sortOrder: 8
    },
    {
        shortcut: "/comercio",
        title: "Registro de comercio",
        content:
            "Para registrar tu comercio en MOOVY, visitá somosmoovy.com/comercio/registro. El proceso toma menos de 5 minutos.",
        category: "general",
        sortOrder: 9
    },
    {
        shortcut: "/despedida",
        title: "Despedida",
        content:
            "¡Gracias por contactarnos! Si necesitás algo más, no dudes en escribirnos. ¡Que tengas un excelente día!",
        category: "cierre",
        sortOrder: 10
    },
    {
        shortcut: "/reembolso",
        title: "Solicitar reembolso",
        content:
            "Voy a verificar tu caso para procesar el reembolso. Por favor, compartime tu número de pedido.",
        category: "pago",
        sortOrder: 11
    },
    {
        shortcut: "/direccion",
        title: "Actualizar dirección",
        content:
            "Podés actualizar tu dirección de entrega desde 'Mi Perfil' → 'Direcciones'. ¿Necesitás ayuda con eso?",
        category: "cuenta",
        sortOrder: 12
    }
];

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // Check if already seeded
        const existing = await (prisma as any).cannedResponse.count();
        if (existing > 0) {
            return NextResponse.json({
                message: "Las respuestas rápidas ya están inicializadas",
                count: existing
            });
        }

        // Seed canned responses
        const created = await Promise.all(
            INITIAL_CANNED_RESPONSES.map(resp =>
                (prisma as any).cannedResponse.create({
                    data: {
                        ...resp,
                        isActive: true
                    }
                })
            )
        );

        return NextResponse.json({
            message: "Respuestas rápidas inicializadas exitosamente",
            count: created.length,
            responses: created
        });
    } catch (error) {
        console.error("Error initializing canned responses:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// GET - Check initialization status
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const count = await (prisma as any).cannedResponse.count();

        return NextResponse.json({
            isInitialized: count > 0,
            count,
            message: count > 0
                ? "Las respuestas rápidas ya están inicializadas"
                : "Las respuestas rápidas aún no se han inicializado"
        });
    } catch (error) {
        console.error("Error checking initialization:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
