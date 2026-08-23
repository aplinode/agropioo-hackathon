import type { Metadata } from "next";
import PageHeader from "@/components/shell/page-header";
import SettingsView from "./settings-view";

export const metadata: Metadata = {
  title: "Settings — Agropioo",
};

export default function SettingsPage() {
  return (
    <div className="pt-1">
      <PageHeader
        eyebrow="Settings"
        title="Your profile and preferences"
        description="Your details, your language, and which alerts reach you — all in one place."
      />
      <div className="mt-7 max-w-2xl">
        <SettingsView />
      </div>
    </div>
  );
}
