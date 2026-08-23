import type { Metadata } from "next";
import ToolPlaceholder from "@/components/shell/tool-placeholder";

export const metadata: Metadata = {
  title: "Settings — Agropioo",
};

export default function SettingsPage() {
  return (
    <ToolPlaceholder
      eyebrow="Settings"
      title="Your profile and preferences"
      description="Your name, language, and how Agropioo reaches you — all in one place."
    />
  );
}
