import type { Metadata } from "next";
import ToolPlaceholder from "@/components/shell/tool-placeholder";

export const metadata: Metadata = {
  title: "Detect — Agropioo",
};

export default function DetectPage() {
  return (
    <ToolPlaceholder
      eyebrow="Crop doctor"
      title="Spot disease before it spreads"
      description="Upload a photo of an affected leaf and get a diagnosis with the next steps — right on your phone."
    />
  );
}
