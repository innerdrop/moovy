// Helper to emit socket events from API routes via the socket server's /emit endpoint
// Uses CRON_SECRET for authentication

const SOCKET_URL = process.env.SOCKET_INTERNAL_URL || "http://localhost:3001";
const CRON_SECRET = process.env.CRON_SECRET;

interface EmitOptions {
    event: string;
    room?: string;
    data: Record<string, any>;
}

/**
 * Emit a socket event to a specific room or broadcast.
 * Fire-and-forget — errors are logged but don't throw.
 */
export async function socketEmit({ event, room, data }: EmitOptions): Promise<void> {
    if (!CRON_SECRET) {
        console.warn("[socketEmit] CRON_SECRET not set, skipping emit");
        return;
    }

    try {
        await fetch(`${SOCKET_URL}/emit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${CRON_SECRET}`,
            },
            body: JSON.stringify({ event, room, data }),
        });
    } catch (err) {
        console.error(`[socketEmit] Failed to emit ${event}:`, err);
    }
}

/**
 * Emit the same event to multiple rooms in parallel.
 */
export async function socketEmitToRooms(
    rooms: string[],
    event: string,
    data: Record<string, any>
): Promise<void> {
    await Promise.all(
        rooms.map((room) => socketEmit({ event, room, data }))
    );
}
