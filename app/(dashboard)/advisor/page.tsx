import type { Metadata } from "next";
import ToolPlaceholder from "@/components/shell/tool-placeholder";

export const metadata: Metadata = {
  title: "Advisor — Agropioo",
};

export default function AdvisorPage() {
  return (
    <ToolPlaceholder
      eyebrow="AI Advisor"
      title="Ask anything about your crop"
      description="A chat that knows your farms, your weather, and your language — text first, in Urdu, Punjabi, Pashto, and more."
    />
  );
}
