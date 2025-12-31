// Root Layout - Layout Principal
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Polirrubro San Juan | Delivery 24hs",
  description: "Tu polirrubro de confianza en San Juan. Lácteos, bebidas, sandwichería, golosinas y más. Delivery las 24 horas.",
  keywords: "polirrubro, san juan, delivery, kiosco, almacén, bebidas, lacteos, sandwiches",
  openGraph: {
    title: "Polirrubro San Juan | Delivery 24hs",
    description: "Tu polirrubro de confianza en San Juan. Delivery las 24 horas.",
    type: "website",
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
        <link
          href="https://fonts.googleapis.com/css2?family=Pacifico&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
