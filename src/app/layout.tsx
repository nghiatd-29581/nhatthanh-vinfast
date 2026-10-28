import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE_URL } from "@/lib/env";
import { getSiteData } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const { seo, contact } = await getSiteData();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: seo.title, template: `%s | ${contact.display_name}` },
    description: seo.description,
    applicationName: contact.display_name,
    openGraph: { type: "website", locale: "vi_VN", siteName: contact.display_name, title: seo.title, description: seo.description, url: SITE_URL },
    twitter: { card: "summary_large_image", title: seo.title, description: seo.description },
    alternates: { canonical: "/" },
    formatDetection: { telephone: true },
  };
}

export const viewport: Viewport = { themeColor: "#101114", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
