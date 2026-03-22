// Root Layout - Layout Principal
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import WebVitalsReporter from "@/components/analytics/WebVitalsReporter";

// DM Sans — self-hosted variable font (100-900 weights, no CDN dependency)
const dmSans = localFont({
  src: [
    {
      path: "../../public/fonts/DM-Sans-Variable.woff2",
      style: "normal",
    },
  ],
  variable: "--font-dm-sans",
  display: "swap",
  weight: "100 900",
});

// Jakarta Sans as fallback
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#e60012",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.somosmoovy.com"),
  title: {
    default: "MOOVY — Tu marketplace y delivery en Ushuaia",
    template: "%s | MOOVY",
  },
  description: "Comprá productos, comida y más de comercios locales en Ushuaia. Delivery rápido a tu puerta. Marketplace entre vecinos.",
  keywords: "moovy, delivery, ushuaia, marketplace, comida, comercios, tierra del fuego, pedidos, envíos",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MOOVY",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "MOOVY — Tu marketplace y delivery en Ushuaia",
    description: "Comprá productos, comida y más de comercios locales en Ushuaia. Delivery rápido a tu puerta.",
    type: "website",
    locale: "es_AR",
    siteName: "MOOVY",
    images: ["/favicon-32x32.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "MOOVY — Tu marketplace y delivery en Ushuaia",
    description: "Comprá productos, comida y más de comercios locales en Ushuaia. Delivery rápido a tu puerta.",
    images: ["/favicon-32x32.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <head>
        {/* PWA Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      </head>
      <body className={`${dmSans.variable} ${jakarta.variable} font-sans antialiased`}>
        <ServiceWorkerRegistrar />
        <WebVitalsReporter />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
