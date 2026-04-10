// NextAuth.js Configuration for Moovy - SECURED
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { checkRateLimit, resetRateLimit } from "@/lib/security";
import { logUserActivity, ACTIVITY_ACTIONS } from "@/lib/user-activity";





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
                    const rateCheck = await checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
                    if (!rateCheck.allowed) {
                        console.warn(`[Auth] Rate limited: ${email} (reset in ${Math.round(rateCheck.resetIn / 1000)}s)`);
                        throw new Error("Demasiados intentos. Intentá de nuevo en unos minutos.");
                    }

                    const { prisma } = await import("@/lib/prisma");

                    const user = await prisma.user.findUnique({
                        where: { email: email.toLowerCase() },
                        include: {
                            roles: {
                                where: { isActive: true },
                                select: { role: true }
                            }
                        }
                    });

                    if (!user) {
                        console.log("[Auth] User not found:", email);
                        return null;
                    }

                    // Check for soft delete
                    if (user.deletedAt) {
                        throw new Error("Esta cuenta ha sido eliminada. Contactá a soporte.");
                    }

                    // Verify password
                    const isValid = await bcrypt.compare(password, user.password);

                    if (!isValid) {
                        console.log("[Auth] Invalid password for:", email);
                        return null;
                    }

                    // Update last login (fire and forget)
                    prisma.user.update({
                        where: { id: user.id },
                        data: { updatedAt: new Date() } // Simulate last login tracking via updatedAt
                    }).catch(err => console.error("Failed to update login time", err));

                    console.log("[Auth] Login successful for:", user.email, "Role:", user.role);

                    // Reset rate limit on successful login
                    await resetRateLimit(rateLimitKey);

                    const merchant = await prisma.merchant.findFirst({
                        where: { ownerId: user.id },
                        select: { id: true }
                    });

                    // Build roles array from UserRole table, fallback to legacy role
                    const rolesFromTable = user.roles && user.roles.length > 0
                        ? user.roles.map((r: { role: string }) => r.role)
                        : [];
                    // Always include legacy User.role for backward compatibility
                    const activeRoles = [...new Set([...rolesFromTable, user.role].filter(Boolean))];

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        roles: activeRoles,
                        image: user.image,
                        referralCode: user.referralCode,
                        merchantId: merchant?.id || null,
                    };
                } catch (error) {
                    console.error("[Auth] Authorize error:", error);
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

            // Re-fetch roles from DB when client calls update() with refreshRoles flag (e.g. after activating SELLER role)
            if (trigger === "update" && token.id && (token as any).refreshRoles) {
                try {
                    const { prisma } = await import("@/lib/prisma");
                    const userId = token.id as string;

                    const freshUser = await prisma.user.findUnique({
                        where: { id: userId },
                        select: {
                            role: true,
                            roles: { where: { isActive: true }, select: { role: true } },
                        },
                    });
                    if (freshUser) {
                        const rolesFromTable = freshUser.roles.map((r) => r.role);

                        // Auto-heal: if Driver is APPROVED but UserRole DRIVER doesn't exist or is inactive,
                        // create/activate it so the JWT includes DRIVER role
                        if (!rolesFromTable.includes("DRIVER")) {
                            const approvedDriver = await prisma.driver.findUnique({
                                where: { userId },
                                select: { approvalStatus: true, isActive: true },
                            });
                            if (approvedDriver && (approvedDriver.approvalStatus === "APPROVED" || approvedDriver.isActive)) {
                                // Upsert the UserRole
                                const existingRole = await prisma.userRole.findUnique({
                                    where: { userId_role: { userId, role: "DRIVER" } },
                                });
                                if (existingRole && !existingRole.isActive) {
                                    await prisma.userRole.update({
                                        where: { userId_role: { userId, role: "DRIVER" } },
                                        data: { isActive: true },
                                    });
                                } else if (!existingRole) {
                                    await prisma.userRole.create({
                                        data: { userId, role: "DRIVER", isActive: true },
                                    });
                                }
                                rolesFromTable.push("DRIVER");
                            }
                        }

                        // Auto-heal: if SellerProfile exists and is active but UserRole SELLER
                        // doesn't exist or is inactive, create/activate it
                        if (!rolesFromTable.includes("SELLER")) {
                            const activeSeller = await prisma.sellerProfile.findUnique({
                                where: { userId },
                                select: { isActive: true },
                            });
                            if (activeSeller?.isActive) {
                                const existingRole = await prisma.userRole.findUnique({
                                    where: { userId_role: { userId, role: "SELLER" } },
                                });
                                if (existingRole && !existingRole.isActive) {
                                    await prisma.userRole.update({
                                        where: { userId_role: { userId, role: "SELLER" } },
                                        data: { isActive: true },
                                    });
                                } else if (!existingRole) {
                                    await prisma.userRole.create({
                                        data: { userId, role: "SELLER", isActive: true },
                                    });
                                }
                                rolesFromTable.push("SELLER");
                            }
                        }

                        // Auto-heal: if Merchant exists for this user but UserRole COMERCIO
                        // doesn't exist or is inactive, create/activate it
                        if (!rolesFromTable.includes("COMERCIO")) {
                            const ownedMerchant = await prisma.merchant.findFirst({
                                where: { ownerId: userId },
                                select: { id: true },
                            });
                            if (ownedMerchant) {
                                const existingRole = await prisma.userRole.findUnique({
                                    where: { userId_role: { userId, role: "COMERCIO" } },
                                });
                                if (existingRole && !existingRole.isActive) {
                                    await prisma.userRole.update({
                                        where: { userId_role: { userId, role: "COMERCIO" } },
                                        data: { isActive: true },
                                    });
                                } else if (!existingRole) {
                                    await prisma.userRole.create({
                                        data: { userId, role: "COMERCIO", isActive: true },
                                    });
                                }
                                rolesFromTable.push("COMERCIO");
                            }
                        }

                        // Only mutate token.roles if they actually changed
                        const newRoles = [...new Set([...rolesFromTable, freshUser.role].filter(Boolean))];
                        const currentRoles = (token.roles as string[]) || [];
                        if (JSON.stringify(newRoles.sort()) !== JSON.stringify(currentRoles.sort())) {
                            token.roles = newRoles;
                        }

                        // Only mutate token.role if it changed
                        if (token.role !== freshUser.role) {
                            token.role = freshUser.role;
                        }

                        // Also refresh merchantId in case user became a merchant
                        const merchant = await prisma.merchant.findFirst({
                            where: { ownerId: userId },
                            select: { id: true },
                        });
                        const newMerchantId = merchant?.id || null;
                        if (token.merchantId !== newMerchantId) {
                            token.merchantId = newMerchantId;
                        }

                        // Clear the refreshRoles flag after processing
                        delete (token as any).refreshRoles;
                    }
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

