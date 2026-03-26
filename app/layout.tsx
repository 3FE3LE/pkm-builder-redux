import type { Metadata } from "next";

import "./globals.css";

import { GeistMono } from "geist/font/mono";
import { GeistPixelCircle } from "geist/font/pixel";
import { GeistSans } from "geist/font/sans";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { AppFooter } from "@/components/AppFooter";
import { AppNav } from "@/components/AppNav";
import { absoluteUrl, siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: "Pokemon Blaze Black 2 Redux / Volt White 2 Redux Team Builder",
    template: "%s | Redux Team Builder",
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  applicationName: siteConfig.shortName,
  alternates: {
    canonical: absoluteUrl("/home"),
  },
  openGraph: {
    type: "website",
    url: absoluteUrl("/home"),
    siteName: siteConfig.shortName,
    title: "Pokemon Blaze Black 2 Redux / Volt White 2 Redux Team Builder",
    description: siteConfig.description,
    locale: "es_ES",
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: "Pokemon Blaze Black 2 Redux / Volt White 2 Redux Team Builder",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pokemon Blaze Black 2 Redux / Volt White 2 Redux Team Builder",
    description: siteConfig.description,
    images: [absoluteUrl("/opengraph-image")],
  },
  icons: {
    icon: [
      { url: "/brand/snivy.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/snivy.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/snivy.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/brand/snivy.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/brand/snivy.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={cn(
        "font-sans",
        GeistSans.variable,
        GeistMono.variable,
        GeistPixelCircle.variable,
      )}
    >
      <body className="flex min-h-screen flex-col">
        <NuqsAdapter>
          <AppNav />
          <div className="flex-1">{children}</div>
          <AppFooter />
        </NuqsAdapter>
      </body>
    </html>
  );
}
