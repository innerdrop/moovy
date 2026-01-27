import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security Headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.googleapis.com https://*.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.cdnfonts.com https://*.googleapis.com; font-src 'self' https://fonts.gstatic.com https://fonts.cdnfonts.com; img-src 'self' data: https: blob: https://*.gstatic.com https://*.googleapis.com https://*.ggpht.com; connect-src 'self' https://api.mercadopago.com https://*.googleapis.com; frame-src https://*.google.com; frame-ancestors 'self';",
          },
        ],
      },
    ];
  },

  // Redirects for legacy routes (fix for old AireCM index)
  async redirects() {
    return [
      {
        source: "/contacto.html",
        destination: "/contacto",
        permanent: true,
      },
      {
        source: "/index.html",
        destination: "/",
        permanent: true,
      },
      {
        source: "/servicios.html",
        destination: "/tienda",
        permanent: true,
      },
      {
        source: "/equipo.html",
        destination: "/nosotros",
        permanent: true,
      },
      {
        source: "/espacio.html",
        destination: "/nosotros",
        permanent: true,
      },
      // New subdomain URL structure redirects
      {
        source: "/riders/registro",
        destination: "/repartidor/registro",
        permanent: false,
      },
      {
        source: "/riders/login",
        destination: "/conductores/login",
        permanent: false,
      },
      {
        source: "/socios/registro",
        destination: "/comercio/registro",
        permanent: false,
      },
      {
        source: "/socios/login",
        destination: "/comercios/login",
        permanent: false,
      },
    ];
  },

  // Image optimization domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Disable x-powered-by header
  poweredByHeader: false,

  // Strict mode for React
  reactStrictMode: true,
};

export default nextConfig;
