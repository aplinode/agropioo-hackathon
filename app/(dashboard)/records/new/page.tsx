import type { Metadata } from "next";
import ToolPlaceholder from "@/components/shell/tool-placeholder";

export const metadata: Metadata = {
  title: "New record — Agropioo",
};

export default function NewRecordPage() {
  return (
    <ToolPlaceholder
      eyebrow="Farm records"
      title="Log what happened in the field"
      description="Irrigation, fertilizer, pesticide, disease, and harvest entries — your farm's memory, one line at a time."
    />
  );
}
