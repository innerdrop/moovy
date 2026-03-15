import prisma from "@/lib/prisma";

export async function logAudit(params: {
    action: string;
    entityType: string;
    entityId: string;
    userId: string;
    details?: Record<string, any>;
}) {
    try {
        await prisma.auditLog.create({
            data: {
                action: params.action,
                entityType: params.entityType,
                entityId: params.entityId,
                userId: params.userId,
                details: params.details ? JSON.stringify(params.details) : null,
            },
        });
    } catch (error) {
        console.error("[AUDIT] Failed to log:", error);
    }
}
