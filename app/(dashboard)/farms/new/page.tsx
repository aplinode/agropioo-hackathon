import type { Metadata } from "next";
import ToolPlaceholder from "@/components/shell/tool-placeholder";

export const metadata: Metadata = {
  title: "Add a farm — Agropioo",
};

export default function NewFarmPage() {
  return (
    <ToolPlaceholder
      eyebrow="Farms"
      title="Add a farm"
      description="Tell Agropioo about your land — location, crop, and size — so every advisory is shaped around it."
    />
  );
}
