import type { Metadata } from "next";
import ToolPlaceholder from "@/components/shell/tool-placeholder";

export const metadata: Metadata = {
  title: "Farms — Agropioo",
};

export default function FarmsPage() {
  return (
    <ToolPlaceholder
      eyebrow="Farms"
      title="All your farms, one list"
      description="Every farm with its crops, growth stage, and health at a glance — plus the full record log for each."
    />
  );
}
