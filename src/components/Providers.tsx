"use client";

// Session Provider for NextAuth
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import PointsCelebration from "@/components/shared/PointsCelebration";
import ToastContainer from "@/components/ui/Toast";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { CartSyncProvider } from "@/hooks/useCartSync";

export default function Providers({ children }: { children: ReactNode }) {
    return (
        <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
            <CartSyncProvider>
                {children}
            </CartSyncProvider>
            <PointsCelebration />
            <ToastContainer />
            <ConfirmModal />
        </SessionProvider>
    );
}
