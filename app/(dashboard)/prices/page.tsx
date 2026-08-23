import type { Metadata } from "next";
import ToolPlaceholder from "@/components/shell/tool-placeholder";

export const metadata: Metadata = {
  title: "Prices — Agropioo",
};

export default function PricesPage() {
  return (
    <ToolPlaceholder
      eyebrow="Mandi prices"
      title="Know the rate before you sell"
      description="Daily mandi rates for your crops with a short-term outlook, so you can pick your selling day."
    />
  );
}
