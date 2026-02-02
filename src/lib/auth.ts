// NextAuth.js Configuration for Moovy - SECURED
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";





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

                    // Import Prisma Client dynamically to avoid Edge Runtime issues if any (though authorize runs on Node)
                    // But standard practice in this repo seems to be importing from @/lib/prisma
                    const { prisma } = await import("@/lib/prisma");

                    const user = await prisma.user.findUnique({
                        where: { email: email.toLowerCase() },
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

                    const merchant = await prisma.merchant.findFirst({
                        where: { ownerId: user.id },
                        select: { id: true }
                    });

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role as "ADMIN" | "USER" | "DRIVER",
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
                token.referralCode = (user as any).referralCode;
                token.merchantId = (user as any).merchantId;
                token.loginAt = Date.now();
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

