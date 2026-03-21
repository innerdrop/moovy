// @ts-ignore — pino has esm/cjs compatibility quirks
import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

const logger = pino({
    level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
    ...(isDev ? {
        transport: {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "HH:MM:ss",
                ignore: "pid,hostname",
            },
        },
    } : {}),
    // Production: JSON output for log aggregation
    formatters: {
        level: (label) => ({ level: label }),
    },
    base: {
        service: "moovy-api",
    },
});

export default logger;

// Create child loggers for different modules
export const authLogger = logger.child({ module: "auth" });
export const orderLogger = logger.child({ module: "orders" });
export const paymentLogger = logger.child({ module: "payments" });
export const deliveryLogger = logger.child({ module: "delivery" });
export const emailLogger = logger.child({ module: "email" });
export const cronLogger = logger.child({ module: "cron" });
export const socketLogger = logger.child({ module: "socket" });

// Helper to create request-scoped logger
export function createRequestLogger(module: string, extra?: Record<string, unknown>) {
    return logger.child({ module, requestId: crypto.randomUUID().slice(0, 8), ...extra });
}
