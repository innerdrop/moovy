// NextAuth.js Configuration for Moovy - SECURED
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { checkRateLimit, resetRateLimit, auditLog } from "@/lib/security";
import { logUserActivity, ACTIVITY_ACTIONS } from "@/lib/user-activity";

// ISSUE-062: bloqueo persistente por intentos fallidos. 5 intentos consecutivos
// fallidos -> loginLockedUntil = now + 15min. Warning desde el 3 (te quedan 2).
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const WARNING_THRESHOLD = 2;





export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Contraseña", type: "password" },
            },
            async authorize(credentials) {
                try {
                    if (!credentials?.email || !credentials?.password) {
                        return null;
                    }

                    const email = credentials.email as string;
                    const password = credentials.password as string;

                    // Rate limit login attempts per email
                    const rateLimitKey = `login:${email.toLowerCase()}`;
                    const rateCheck = await checkRateLimit(rateLimitKey, MAX_LOGIN_ATTEMPTS, LOCK_DURATION_MS);
                    if (!rateCheck.allowed) {
                        console.warn(`[Auth] Rate limited: ${email} (reset in ${Math.round(rateCheck.resetIn / 1000)}s)`);
                        const minutos = Math.max(1, Math.ceil(rateCheck.resetIn / 60_000));
                        throw new Error(`Demasiados intentos. Intentá de nuevo en ${minutos} minuto${minutos !== 1 ? "s" : ""}.`);
                    }

                    const { prisma } = await import("@/lib/prisma");

                    // Query mínima: solo necesitamos password y campos planos.
                    // Los roles/acceso se derivan después via computeUserAccess
                    // (ver src/lib/roles.ts para el principio de diseño).
                    const user = await prisma.user.findUnique({
                        where: { email: email.toLowerCase() },
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            password: true,
                            role: true,
                            image: true,
                            referralCode: true,
                            deletedAt: true,
                            failedLoginAttempts: true,
                            loginLockedUntil: true,
                        },
                    });

                    if (!user) {
                        console.log("[Auth] User not found:", email);
                        return null;
                    }

                    // Check for soft delete
                    if (user.deletedAt) {
                        throw new Error("Esta cuenta ha sido eliminada. Contactá a soporte.");
                    }

                    // ISSUE-062: bloqueo persistente. Si está bloqueado, no validamos password.
                    const now = new Date();
                    if (user.loginLockedUntil && user.loginLockedUntil > now) {
                        const minutos = Math.max(1, Math.ceil((user.loginLockedUntil.getTime() - now.getTime()) / 60_000));
                        console.warn(`[Auth] User locked: ${email} (${minutos}min remaining)`);
                        throw new Error(`Cuenta bloqueada por seguridad. Intentá en ${minutos} minuto${minutos !== 1 ? "s" : ""} o pedí desbloqueo a soporte.`);
                    }
                    // Auto-unlock: si el lock expiró, resetear contador antes de validar.
                    if (user.loginLockedUntil && user.loginLockedUntil <= now) {
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { failedLoginAttempts: 0, loginLockedUntil: null },
                        }).catch(err => console.error("[Auth] Failed auto-unlock:", err));
                        user.failedLoginAttempts = 0;
                        user.loginLockedUntil = null;
                    }

                    // Verify password
                    const isValid = await bcrypt.compare(password, user.password);

                    if (!isValid) {
                        // ISSUE-062: incrementar contador persistente y posiblemente bloquear.
                        const currentAttempts = user.failedLoginAttempts ?? 0;
                        const newAttempts = currentAttempts + 1;
                        const willLock = newAttempts >= MAX_LOGIN_ATTEMPTS;
                        const lockUntil = willLock ? new Date(Date.now() + LOCK_DURATION_MS) : null;

                        await prisma.user.update({
                            where: { id: user.id },
                            data: {
                                failedLoginAttempts: newAttempts,
                                loginLockedUntil: lockUntil,
                            },
                        }).catch(err => console.error("[Auth] Failed to update attempts:", err));

                        if (willLock) {
                            try {
                                auditLog({
                                    timestamp: new Date().toISOString(),
                                    userId: user.id,
                                    action: "USER_LOGIN_AUTO_LOCKED",
                                    resource: "User",
                                    resourceId: user.id,
                                    details: { email: user.email, attempts: newAttempts, lockUntil: lockUntil?.toISOString() },
                                });
                            } catch (err) {
                                console.error("[Auth] Audit log failed:", err);
                            }
                            try {
                                const { sendAccountLockedEmail } = await import("@/lib/email-legal-ux");
                                sendAccountLockedEmail({
                                    email: user.email,
                                    name: user.name,
                                    unlockAt: lockUntil!,
                                }).catch(err => console.error("[Auth] sendAccountLockedEmail failed:", err));
                            } catch (err) {
                                console.error("[Auth] Failed to import locked email:", err);
                            }

                            // ISSUE-062 visibilidad OPS: socket event en vivo + email al admin.
                            // Si el admin tiene /ops/fraude abierto, ve el alerta al instante.
                            // Si no, le llega un email con link directo al panel del user.
                            try {
                                const { socketEmitToRooms } = await import("@/lib/socket-emit");
                                socketEmitToRooms(
                                    ["admin:users", "admin:fraud"],
                                    "account_auto_locked",
                                    {
                                        userId: user.id,
                                        email: user.email,
                                        name: user.name,
                                        attempts: newAttempts,
                                        lockUntil: lockUntil?.toISOString(),
                                        lockedAt: new Date().toISOString(),
                                    }
                                ).catch(err => console.error("[Auth] socket emit failed:", err));
                            } catch (err) {
                                console.error("[Auth] Failed to import socket-emit:", err);
                            }

                            try {
                                const { sendAdminAccountLockedEmail } = await import("@/lib/email-admin-ops");
                                sendAdminAccountLockedEmail({
                                    userId: user.id,
                                    userEmail: user.email,
                                    userName: user.name,
                                    attempts: newAttempts,
                                    lockUntil: lockUntil!,
                                }).catch(err => console.error("[Auth] sendAdminAccountLockedEmail failed:", err));
                            } catch (err) {
                                console.error("[Auth] Failed to import admin locked email:", err);
                            }

                            console.warn(`[Auth] Auto-locked: ${email} after ${newAttempts} failed attempts`);
                            throw new Error("Tu cuenta fue bloqueada por seguridad por múltiples intentos fallidos. Te enviamos un email con instrucciones. Intentá en 15 minutos o reseteá tu contraseña.");
                        }

                        const remaining = MAX_LOGIN_ATTEMPTS - newAttempts;
                        console.log(`[Auth] Invalid password for: ${email} (attempt ${newAttempts}/${MAX_LOGIN_ATTEMPTS})`);
                        if (remaining <= WARNING_THRESHOLD) {
                            throw new Error(remaining === 1
                                ? "Contraseña incorrecta. Te queda 1 intento antes de bloqueo."
                                : `Contraseña incorrecta. Te quedan ${remaining} intentos antes de bloqueo.`
                            );
                        }
                        return null;
                    }

                    // Login OK — resetear contador, lock y rate limit.
                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            failedLoginAttempts: 0,
                            loginLockedUntil: null,
                            updatedAt: new Date(),
                        },
                    }).catch(err => console.error("Failed to update login time", err));

                    console.log("[Auth] Login successful for:", user.email, "Role:", user.role);

                    // Reset rate limit on successful login
                    await resetRateLimit(rateLimitKey);

                    // Derivar roles y acceso desde el estado de dominio (Merchant.approvalStatus,
                    // Driver.approvalStatus, SellerProfile.isActive). Esto reemplaza el viejo
                    // auto-heal de UserRole: ya no leemos la tabla UserRole acá, los roles se
                    // calculan en cada login a partir de los perfiles reales.
                    // Ver src/lib/roles.ts → computeUserAccess() para el detalle.
                    const { computeUserAccess } = await import("@/lib/roles");
                    const access = await computeUserAccess(user.id);

                    // Roles en el JWT: si el user TIENE un perfil (no importa el status),
                    // lo incluimos. El gate de approved/pending/suspended lo hace cada layout
                    // protegido via requireXAccess(). Esto permite que PortalSwitcher muestre
                    // tabs para portales en los que el user tiene un perfil aunque todavía
                    // no esté aprobado (ej: ir a /comercios/pendiente-aprobacion).
                    const activeRoles: string[] = ["USER"];
                    if (access?.isAdmin) activeRoles.push("ADMIN");
                    if (access && access.merchant.status !== "none") activeRoles.push("COMERCIO");
                    if (access && access.driver.status !== "none") activeRoles.push("DRIVER");
                    if (access && access.seller.status !== "none") activeRoles.push("SELLER");
                    // Deduplicate + include legacy User.role for backward compat
                    const uniqueRoles = [...new Set([...activeRoles, user.role].filter(Boolean))];

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        roles: uniqueRoles,
                        image: user.image,
                        referralCode: user.referralCode,
                        merchantId: access?.merchant.merchantId ?? null,
                    };
                } catch (error) {
                    // Errores user-facing (lock, rate limit, soft delete, warnings) se re-lanzan
                    // para que NextAuth los propague al cliente como result.error.
                    if (error instanceof Error && error.message) {
                        const msg = error.message;
                        const isUserFacing =
                            msg.startsWith("Demasiados intentos") ||
                            msg.startsWith("Cuenta bloqueada") ||
                            msg.startsWith("Tu cuenta fue bloqueada") ||
                            msg.startsWith("Contraseña incorrecta") ||
                            msg.startsWith("Esta cuenta ha sido eliminada");
                        if (isUserFacing) {
                            console.warn("[Auth] User-facing error:", msg);
                            throw error;
                        }
                    }
                    console.error("[Auth] Authorize error (unexpected):", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger }) {
            if (user) {
                token.id = user.id || "";
                token.role = (user as any).role;
                token.roles = (user as any).roles || [token.role];
                token.referralCode = (user as any).referralCode;
                token.merchantId = (user as any).merchantId;
                token.loginAt = Date.now();

                // Log successful login on sign-in
                if (trigger === "signIn") {
                    logUserActivity({
                        userId: user.id || "",
                        action: ACTIVITY_ACTIONS.LOGIN,
                        entityType: "User",
                        entityId: user.id || "",
                        metadata: { method: "credentials" },
                    }).catch((err) => console.error("[Auth] Failed to log login activity:", err));
                }
            }

            // Check suspension and archive status on signin only (not on every update)
            // For trigger === "update", only re-check if explicitly requested via token.refreshSuspension
            if ((trigger === "signIn" || (trigger === "update" && (token as any).refreshSuspension)) && token.id) {
                try {
                    const { prisma } = await import("@/lib/prisma");
                    const userId = token.id as string;

                    const userStatus = await prisma.user.findUnique({
                        where: { id: userId },
                        select: {
                            isSuspended: true,
                            suspendedUntil: true,
                            suspensionReason: true,
                            archivedAt: true,
                        },
                    });

                    if (userStatus) {
                        // Check archive status - only mutate if value changed
                        const newIsArchived = Boolean(userStatus.archivedAt);
                        const currentIsArchived = (token as any).isArchived || false;
                        if (currentIsArchived !== newIsArchived) {
                            (token as any).isArchived = newIsArchived;
                        }

                        // Check suspension status
                        if (userStatus.isSuspended) {
                            const now = new Date();
                            if (userStatus.suspendedUntil && userStatus.suspendedUntil <= now) {
                                // Auto-unsuspend: suspension period has expired
                                await prisma.user.update({
                                    where: { id: userId },
                                    data: {
                                        isSuspended: false,
                                        suspendedUntil: null,
                                    },
                                });

                                // Also clear suspension from related Merchant and Driver if exists
                                await prisma.merchant.updateMany({
                                    where: { ownerId: userId },
                                    data: { isSuspended: false, suspendedUntil: null },
                                });

                                await prisma.driver.updateMany({
                                    where: { userId },
                                    data: { isSuspended: false, suspendedUntil: null },
                                });

                                (token as any).isSuspended = false;
                                (token as any).suspendedUntil = null;
                            } else {
                                // Still suspended - only mutate if value changed
                                const newIsSuspended = true;
                                const newSuspendedUntil = userStatus.suspendedUntil?.toISOString() || null;
                                if ((token as any).isSuspended !== newIsSuspended || (token as any).suspendedUntil !== newSuspendedUntil) {
                                    (token as any).isSuspended = newIsSuspended;
                                    (token as any).suspendedUntil = newSuspendedUntil;
                                    (token as any).suspensionReason = userStatus.suspensionReason;
                                }
                            }
                        } else {
                            // Not suspended - only mutate if value changed
                            const newIsSuspended = false;
                            if ((token as any).isSuspended !== newIsSuspended) {
                                (token as any).isSuspended = newIsSuspended;
                                (token as any).suspendedUntil = null;
                            }
                        }
                    }

                    // Clear the refresh flag after processing
                    if ((token as any).refreshSuspension) {
                        delete (token as any).refreshSuspension;
                    }
                } catch (err) {
                    console.error("[Auth] Failed to check suspension status:", err);
                }
            }

            // Re-derive roles from DB when client calls update() with refreshRoles flag.
            // Esto se dispara desde PortalSwitcher, endpoints de activación de rol,
            // endpoints admin approve/reject, etc. En cada caso, re-lee el estado de
            // dominio via computeUserAccess() y reconstruye el array de roles del JWT.
            // Ver src/lib/roles.ts para el detalle.
            if (trigger === "update" && token.id && (token as any).refreshRoles) {
                try {
                    const { computeUserAccess } = await import("@/lib/roles");
                    const userId = token.id as string;

                    // Importante: computeUserAccess está cacheado por request vía React cache(),
                    // pero el JWT callback corre fuera del ciclo de request de un componente,
                    // así que acá hace una query fresca cada vez que se dispara este trigger.
                    const access = await computeUserAccess(userId);

                    if (access) {
                        // Reconstruir roles con el mismo criterio que authorize()
                        const newRoleArray: string[] = ["USER"];
                        if (access.isAdmin) newRoleArray.push("ADMIN");
                        if (access.merchant.status !== "none") newRoleArray.push("COMERCIO");
                        if (access.driver.status !== "none") newRoleArray.push("DRIVER");
                        if (access.seller.status !== "none") newRoleArray.push("SELLER");

                        // Legacy: mantener User.role plano dentro del array
                        const { prisma } = await import("@/lib/prisma");
                        const freshUser = await prisma.user.findUnique({
                            where: { id: userId },
                            select: { role: true },
                        });

                        const newRoles = [
                            ...new Set(
                                [...newRoleArray, freshUser?.role ?? ""].filter(Boolean)
                            ),
                        ];
                        const currentRoles = (token.roles as string[]) || [];
                        if (JSON.stringify(newRoles.sort()) !== JSON.stringify(currentRoles.sort())) {
                            token.roles = newRoles;
                        }

                        if (freshUser && token.role !== freshUser.role) {
                            token.role = freshUser.role;
                        }

                        const newMerchantId = access.merchant.merchantId;
                        if (token.merchantId !== newMerchantId) {
                            token.merchantId = newMerchantId;
                        }
                    }

                    // Clear the refreshRoles flag after processing
                    delete (token as any).refreshRoles;
                } catch (err) {
                    console.error("[Auth] Failed to refresh roles on update:", err);
                }
            }

            // Invalidate token if too old (security measure)
            if (token.loginAt && Date.now() - (token.loginAt as number) > 7 * 24 * 60 * 60 * 1000) {
                // Force re-login after 7 days
                token.expired = true;
            }

            return token;
        },
        async session({ session, token }) {
            // Check if token is expired
            if ((token as any).expired) {
                return { ...session, user: undefined };
            }

            if (token && session.user) {
                // Only mutate if values actually changed
                if (session.user.id !== token.id) {
                    session.user.id = token.id as string;
                }
                if ((session.user as any).role !== token.role) {
                    (session.user as any).role = token.role;
                }
                const newRoles = token.roles || [token.role];
                if (JSON.stringify((session.user as any).roles || []) !== JSON.stringify(newRoles)) {
                    (session.user as any).roles = newRoles;
                }
                if ((session.user as any).referralCode !== token.referralCode) {
                    (session.user as any).referralCode = token.referralCode;
                }
                if ((session.user as any).merchantId !== token.merchantId) {
                    (session.user as any).merchantId = token.merchantId;
                }
                const newIsSuspended = (token as any).isSuspended || false;
                if ((session.user as any).isSuspended !== newIsSuspended) {
                    (session.user as any).isSuspended = newIsSuspended;
                }
                const newSuspendedUntil = (token as any).suspendedUntil || null;
                if ((session.user as any).suspendedUntil !== newSuspendedUntil) {
                    (session.user as any).suspendedUntil = newSuspendedUntil;
                }
                const newSuspensionReason = (token as any).suspensionReason || null;
                if ((session.user as any).suspensionReason !== newSuspensionReason) {
                    (session.user as any).suspensionReason = newSuspensionReason;
                }
                const newIsArchived = (token as any).isArchived || false;
                if ((session.user as any).isArchived !== newIsArchived) {
                    (session.user as any).isArchived = newIsArchived;
                }
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 7 * 24 * 60 * 60, // 7 days (reduced from 30 for security)
        updateAge: 24 * 60 * 60, // Update session every 24 hours
    },

    // Allow cookies over HTTP for local network testing (non-localhost IP)
    useSecureCookies: process.env.NODE_ENV === "production",

    // Don't log in production
    debug: process.env.NODE_ENV === "development",

    // Trust the host header (critical for VPS/Nginx)
    trustHost: true,

    // Secret validation - MUST match proxy.ts
    secret: (() => {
        const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
        if (!secret && process.env.NODE_ENV === "production") {
            throw new Error("AUTH_SECRET must be set in production");
        }
        // Use consistent fallback for development
        return secret || "Moovy-san-juan-dev-secret-2024-minimum-32-chars";
    })(),
});

