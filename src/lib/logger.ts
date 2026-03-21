// Structured logger — uses pino if available, falls back to console
let pinoLogger: any = null;

try {
    // Dynamic require to avoid breaking if pino isn't available
    const pino = require("pino");
    const isDev = process.env.NODE_ENV !== "production";

    pinoLogger = pino({
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
        formatters: {
            level: (label: string) => ({ level: label }),
        },
        base: {
            service: "moovy-api",
        },
    });
} catch {
    // pino not available — use console fallback
}

// Console-based fallback logger that matches pino's API
const consoleLogger = {
    info: (obj: any, msg?: string) => console.log(`[INFO]`, msg || "", typeof obj === "string" ? obj : JSON.stringify(obj)),
    error: (obj: any, msg?: string) => console.error(`[ERROR]`, msg || "", typeof obj === "string" ? obj : JSON.stringify(obj)),
    warn: (obj: any, msg?: string) => console.warn(`[WARN]`, msg || "", typeof obj === "string" ? obj : JSON.stringify(obj)),
    debug: (obj: any, msg?: string) => console.log(`[DEBUG]`, msg || "", typeof obj === "string" ? obj : JSON.stringify(obj)),
    child: (bindings: Record<string, unknown>) => {
        const prefix = bindings.module ? `[${bindings.module}]` : "";
        return {
            info: (obj: any, msg?: string) => console.log(prefix, `[INFO]`, msg || "", typeof obj === "object" ? JSON.stringify(obj) : obj),
            error: (obj: any, msg?: string) => console.error(prefix, `[ERROR]`, msg || "", typeof obj === "object" ? JSON.stringify(obj) : obj),
            warn: (obj: any, msg?: string) => console.warn(prefix, `[WARN]`, msg || "", typeof obj === "object" ? JSON.stringify(obj) : obj),
            debug: (obj: any, msg?: string) => console.log(prefix, `[DEBUG]`, msg || "", typeof obj === "object" ? JSON.stringify(obj) : obj),
        };
    },
};

const logger = pinoLogger || consoleLogger;

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
