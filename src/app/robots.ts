import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.somosmoovy.com";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/api/", "/ops/", "/comercios/", "/repartidor/", "/vendedor/"],
        },
        sitemap: `${BASE_URL}/sitemap.xml`,
    };
}
