import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Sans, Geist_Mono } from "next/font/google";
import "../globals.css";

/* Root layout for the farmer-app route group. Route groups each carry their
   own <html>: marketing pages live under app/(site)/[locale], and this group
   serves ((dashboard), forgot-password, reset-password) without a locale
   prefix — English at launch, per the language policy. */
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

export const metadata: Metadata = {
  title: "Agropioo — AI-Powered Farm Intelligence Platform",
  description:
    "Today's advisory, weather, alerts, and every Agropioo tool — built for Pakistan. A product of Aplinode.",
};

export const viewport: Viewport = {
  themeColor: "#F0FDF4",
};

export default function FarmerAppLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${playfair.variable} ${dmSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
