import type { Metadata } from "next";
import ToolPlaceholder from "@/components/shell/tool-placeholder";

export const metadata: Metadata = {
  title: "Schemes — Agropioo",
};

export default function SchemesPage() {
  return (
    <ToolPlaceholder
      eyebrow="Government schemes"
      title="Schemes matched to your farm"
      description="Subsidies, loans, and support programmes you may qualify for — with the forms explained simply."
    />
  );
}
