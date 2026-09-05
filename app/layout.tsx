import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { LOCALES } from "@/lib/i18n/config";
import "./globals.css";

const playfair = localFont({
  src: [
    { path: "./fonts/PlayfairDisplay-400.ttf", weight: "400" },
    { path: "./fonts/PlayfairDisplay-500.ttf", weight: "500" },
    { path: "./fonts/PlayfairDisplay-600.ttf", weight: "600" },
    { path: "./fonts/PlayfairDisplay-700.ttf", weight: "700" },
  ],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = localFont({
  src: [
    { path: "./fonts/DM-Sans-400.ttf", weight: "400" },
    { path: "./fonts/DM-Sans-500.ttf", weight: "500" },
    { path: "./fonts/DM-Sans-600.ttf", weight: "600" },
    { path: "./fonts/DM-Sans-700.ttf", weight: "700" },
  ],
  variable: "--font-dm-sans",
  display: "swap",
});

const geistMono = localFont({
  src: [
    { path: "./fonts/GeistMono-400.ttf", weight: "400" },
    { path: "./fonts/GeistMono-500.ttf", weight: "500" },
    { path: "./fonts/GeistMono-600.ttf", weight: "600" },
    { path: "./fonts/GeistMono-700.ttf", weight: "700" },
  ],
  variable: "--font-geist-mono",
  display: "swap",
});

const nastaliq = localFont({
  src: [
    { path: "./fonts/NastaliqUrdu-400.ttf", weight: "400" },
    { path: "./fonts/NastaliqUrdu-500.ttf", weight: "500" },
    { path: "./fonts/NastaliqUrdu-600.ttf", weight: "600" },
    { path: "./fonts/NastaliqUrdu-700.ttf", weight: "700" },
  ],
  variable: "--font-nastaliq",
  display: "swap",
});

const arabicUi = localFont({
  src: [
    { path: "./fonts/NotoSansArabic-400.ttf", weight: "400" },
    { path: "./fonts/NotoSansArabic-500.ttf", weight: "500" },
    { path: "./fonts/NotoSansArabic-600.ttf", weight: "600" },
    { path: "./fonts/NotoSansArabic-700.ttf", weight: "700" },
  ],
  variable: "--font-arabic-ui",
  display: "swap",
});

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agropioo — AI-Powered Farm Intelligence Platform",
  description:
    "Agropioo unites an AI advisor, satellite field monitoring, market price intelligence, and digital farm records on one platform. Built for Pakistan. A product of Aplinode.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Agropioo",
  },
  formatDetection: {
    telephone: false,
  },
  icons: [
    { rel: "icon", url: "/favicon.ico", sizes: "any" },
    { rel: "apple-touch-icon", url: "/logo.png", sizes: "192x192" },
  ],
};

export const viewport: Viewport = {
  themeColor: "#F0FDF4",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fontVariables = `${playfair.variable} ${dmSans.variable} ${geistMono.variable} ${nastaliq.variable} ${arabicUi.variable}`;

  return (
    <html
      lang="en"
      dir="ltr"
      className={`${fontVariables} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
