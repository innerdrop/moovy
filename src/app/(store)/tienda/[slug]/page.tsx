// Redirect /tienda/[slug] → /store/[slug]
// Los links del MerchantCard apuntan a /tienda/slug pero la página real está en /store/[slug]
import { redirect } from "next/navigation";

type Props = {
    params: Promise<{ slug: string }>;
};

export default async function TiendaSlugRedirect({ params }: Props) {
    const { slug } = await params;
    redirect(`/store/${slug}`);
}
