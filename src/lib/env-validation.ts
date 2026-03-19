/**
 * Environment variable validation — import at startup to fail fast.
 * Detects missing secrets, weak values, and production misconfigurations.
 */
import crypto from "crypto";

const REQUIRED_VARS = [
  "AUTH_SECRET",
  "DATABASE_URL",
  "CRON_SECRET",
  "NEXT_PUBLIC_APP_URL",
] as const;

const REQUIRED_IN_PRODUCTION = [
  "MP_ACCESS_TOKEN",
  "MP_PUBLIC_KEY",
  "MP_WEBHOOK_SECRET",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASS",
  "VAPID_PRIVATE_KEY",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
] as const;

const WEAK_SECRET_PATTERNS = [
  /moovy.*secret/i,
  /cambiar.*produccion/i,
  /change.*production/i,
  /fallback/i,
  /default/i,
  /your[_-].*[_-]here/i,
  /minimum.*chars/i,
  /placeholder/i,
];

let validated = false;

export function validateEnv(): void {
  // Only validate once per process
  if (validated) return;
  validated = true;

  const errors: string[] = [];
  const warnings: string[] = [];
  const isProd = process.env.NODE_ENV === "production";

  // ── Check required vars ──────────────────────────────────────────────
  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) {
      errors.push(`Falta variable requerida: ${key}`);
    }
  }

  // ── Check production-required vars ───────────────────────────────────
  if (isProd) {
    for (const key of REQUIRED_IN_PRODUCTION) {
      if (!process.env[key]) {
        errors.push(`Falta variable de producción: ${key}`);
      }
    }
  }

  // ── Check for weak secrets ───────────────────────────────────────────
  const secretVars = ["AUTH_SECRET", "NEXTAUTH_SECRET", "CRON_SECRET"];
  for (const key of secretVars) {
    const value = process.env[key];
    if (!value) continue;

    if (value.length < 32) {
      warnings.push(`${key} es muy corto (${value.length} chars, mínimo 32)`);
    }

    for (const pattern of WEAK_SECRET_PATTERNS) {
      if (pattern.test(value)) {
        if (isProd) {
          errors.push(`${key} contiene un valor débil reconocible. Generá un secret aleatorio fuerte.`);
        } else {
          warnings.push(`${key} tiene valor débil (aceptable en dev, NUNCA en prod)`);
        }
        break;
      }
    }
  }

  // ── Output ───────────────────────────────────────────────────────────
  if (warnings.length > 0) {
    console.warn(`[ENV ⚠️] ${warnings.join(" | ")}`);
  }

  if (errors.length > 0) {
    const msg = `[ENV ❌] Validación fallida:\n  - ${errors.join("\n  - ")}`;
    console.error(msg);
    if (isProd) {
      throw new Error(`Environment validation failed: ${errors.join("; ")}`);
    }
  }
}

/**
 * Timing-safe token comparison for cron/internal endpoints.
 * Returns true if both strings are equal, using constant-time comparison.
 */
export function verifyBearerToken(provided: string | null | undefined, expected: string | undefined): boolean {
  if (!provided || !expected) return false;

  const a = Buffer.from(provided, "utf-8");
  const b = Buffer.from(expected, "utf-8");

  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}
