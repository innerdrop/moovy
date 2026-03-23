// Root Layout - Layout Principal
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "@/components/Providers";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import WebVitalsReporter from "@/components/analytics/WebVitalsReporter";

// Nunito — primary body font (variable, 200-1000 weights)
const nunito = localFont({
  src: [
    {
      path: "../../public/fonts/Nunito-Variable.ttf",
      style: "normal",
    },
  ],
  variable: "--font-nunito",
  display: "swap",
  weight: "200 1000",
});

// Arista 2.0 — display/headline font
const arista = localFont({
  src: [
    {
      path: "../../public/fonts/Arista2.0-Light.ttf",
      style: "normal",
      weight: "300",
    },
    {
      path: "../../public/fonts/Arista2.0.ttf",
      style: "normal",
      weight: "400",
    },
    {
      path: "../../public/fonts/Arista2.0-Fat.ttf",
      style: "normal",
      weight: "700",
    },
  ],
  variable: "--font-arista",
  display: "swap",
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
      <body className={`${nunito.variable} ${arista.variable} font-sans antialiased`}>
        <ServiceWorkerRegistrar />
        <WebVitalsReporter />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
