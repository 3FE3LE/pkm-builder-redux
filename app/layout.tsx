import type { Metadata } from "next";

import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { GeistPixelCircle } from "geist/font/pixel";
import { AppNav } from "@/components/AppNav";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Black Blaze 2 / Volt White 7 Team Builder",
  description:
    "Team builder dinamico para Pokemon Blaze Black 2 y Volt White 2 Redux, centrado en el inicial y el progreso de la historia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={cn("font-sans", GeistSans.variable, GeistPixelCircle.variable)}
    >
      <body>
        <AppNav />
        {children}
      </body>
    </html>
  );
}
