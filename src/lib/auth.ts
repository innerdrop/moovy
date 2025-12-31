// NextAuth.js Configuration for Polirrubro San Juan
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// Simple in-memory user lookup for development
// In production, this should use a proper database connection
async function findUserByEmail(email: string) {
    // Import better-sqlite3 dynamically to avoid issues
    const Database = (await import("better-sqlite3")).default;
    const path = await import("path");

    const dbPath = path.join(process.cwd(), "prisma", "dev.db");

    try {
        const db = new Database(dbPath, { readonly: true });
        const user = db.prepare("SELECT * FROM User WHERE email = ?").get(email);
        db.close();
        return user as any;
    } catch (error) {
        console.error("[Auth] Database error:", error);
        return null;
    }
}

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
                        console.log("[Auth] Missing credentials");
                        return null;
                    }

                    const user = await findUserByEmail(credentials.email as string);

                    if (!user) {
                        console.log("[Auth] User not found:", credentials.email);
                        return null;
                    }

                    const isValid = await bcrypt.compare(
                        credentials.password as string,
                        user.password
                    );

                    if (!isValid) {
                        console.log("[Auth] Invalid password for:", credentials.email);
                        return null;
                    }

                    console.log("[Auth] Login successful:", credentials.email);
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        image: user.image,
                    };
                } catch (error) {
                    console.error("[Auth] Authorize error:", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id || "";
                token.role = (user as any).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                (session.user as any).role = token.role;
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
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    debug: process.env.NODE_ENV === "development",
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "polirrubro-san-juan-fallback-secret-2024",
});
