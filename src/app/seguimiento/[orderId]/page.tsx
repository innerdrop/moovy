import { redirect } from "next/navigation";

// Redirect to consolidated order detail page.
// /seguimiento/[id] was merged into /mis-pedidos/[id] (2026-04-16).
// This redirect handles bookmarks, shared links, and push notifications
// that may still point to the old URL.
export default async function SeguimientoRedirect({
    params,
}: {
    params: Promise<{ orderId: string }>;
}) {
    const { orderId } = await params;
    redirect(`/mis-pedidos/${orderId}`);
}
