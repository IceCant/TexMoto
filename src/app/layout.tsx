import type { Metadata, Viewport } from "next";
import { Battambang, Geist } from "next/font/google";

import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { getLocale } from "@/i18n/server";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const battambang = Battambang({ variable: "--font-khmer", subsets: ["khmer", "latin"], weight: ["400", "700", "900"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  applicationName: "TexMoto",
  title: { default: "TexMoto", template: "%s · TexMoto" },
  description: "Simple motorcycle shop management and storefronts for Cambodia.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TexMoto",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  colorScheme: "light",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${geist.variable} ${battambang.variable}`}>
      <body>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
