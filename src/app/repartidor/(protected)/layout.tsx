import MobileOnlyGuard from "@/components/ui/MobileOnlyGuard";

export default function RepartidorProtectedLayout({ children }: { children: React.ReactNode }) {
    return (
        <MobileOnlyGuard mode="block" portalName="Repartidor">
            {children}
        </MobileOnlyGuard>
    );
}
