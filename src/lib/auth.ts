// NextAuth.js Configuration for Moovy - SECURED
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { checkRateLimit, resetRateLimit } from "@/lib/security";





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
            }

            // Re-fetch roles from DB when client calls update() (e.g. after activating SELLER role)
            if (trigger === "update" && token.id) {
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

                        token.roles = [...new Set([...rolesFromTable, freshUser.role].filter(Boolean))];
                        token.role = freshUser.role;

                        // Also refresh merchantId in case user became a merchant
                        const merchant = await prisma.merchant.findFirst({
                            where: { ownerId: userId },
                            select: { id: true },
                        });
                        token.merchantId = merchant?.id || null;
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
                session.user.id = token.id as string;
                (session.user as any).role = token.role;
                (session.user as any).roles = token.roles || [token.role];
                (session.user as any).referralCode = token.referralCode;
                (session.user as any).merchantId = token.merchantId;
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

