import type { NextConfig } from "next";

// Helper to get host from URL safely
const getHost = (url: string | undefined, defaultHost: string) => {
  if (!url) return defaultHost;
  try {
    return new URL(url).hostname;
  } catch {
    return defaultHost;
  }
};

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
const appHost = getHost(appUrl, "localhost");
const socketIp = getHost(socketUrl, "localhost");

const nextConfig: NextConfig = {
  // Allow mobile devices on local network to access dev server
  allowedDevOrigins: [appHost, "localhost", "127.0.0.1", "192.168.68.114"],

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
            value: `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.googleapis.com https://*.gstatic.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.cdnfonts.com https://*.googleapis.com; font-src 'self' https://fonts.gstatic.com https://fonts.cdnfonts.com; img-src 'self' data: https: blob: https://*.gstatic.com https://*.googleapis.com https://*.ggpht.com; connect-src 'self' data: blob: https://api.mercadopago.com https://*.googleapis.com https://*.gstatic.com https://*.google.com ws://localhost:3001 http://localhost:3001 ws://${socketIp}:3001 http://${socketIp}:3001 http://${appHost}:3000 https://somosmoovy.com:* https://*.somosmoovy.com:* wss://somosmoovy.com:* wss://*.somosmoovy.com:*; frame-src https://*.google.com; frame-ancestors 'self';`,
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

  // transpile @react-google-maps/api for better Turbopack compatibility
  transpilePackages: ["@react-google-maps/api"],

  // Disable x-powered-by header
  poweredByHeader: false,

  // Strict mode for React
  reactStrictMode: true,
};

export default nextConfig;
