import type { Metadata, Viewport } from "next";
import {
  Playfair_Display,
  DM_Sans,
  Geist_Mono,
  Noto_Nastaliq_Urdu,
  Noto_Sans_Arabic,
} from "next/font/google";
import { LOCALES } from "@/lib/i18n/config";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const nastaliq = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  variable: "--font-nastaliq",
  display: "swap",
});

const arabicUi = Noto_Sans_Arabic({
  subsets: ["arabic"],
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
      <body className="flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}
