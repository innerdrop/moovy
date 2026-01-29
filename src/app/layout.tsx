// Root Layout - Layout Principal
import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
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
  title: "Moovy | Tu Antojo Manda!",
  description: "Delivery rápido en Ushuaia. Pedí lo que quieras, te lo llevamos.",
  keywords: "moovy, delivery, comida, ushuaia, rapido, pedidos",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Moovy",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Moovy | Tu Antojo Manda!",
    description: "Delivery rápido en Ushuaia.",
    type: "website",
    siteName: "Moovy",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Moovy - Tu Antojo Manda!",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Moovy | Tu Antojo Manda!",
    description: "Delivery rápido en Ushuaia.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        {/* PWA Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      </head>
      <body className={`${poppins.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
