"use client";

// Session Provider for NextAuth
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import PointsCelebration from "@/components/shared/PointsCelebration";
import { CartSyncProvider } from "@/hooks/useCartSync";

export default function Providers({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <CartSyncProvider>
                {children}
            </CartSyncProvider>
            <PointsCelebration />
        </SessionProvider>
    );
}
