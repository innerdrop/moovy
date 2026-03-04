// NextAuth Type Augmentation
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;      // Legacy single role (kept for compatibility)
            roles: string[];   // All active roles from UserRole table
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        role: string;
        roles: string[];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: string;
        roles: string[];
    }
}
