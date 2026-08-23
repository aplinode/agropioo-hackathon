import type { Metadata } from "next";
import ToolPlaceholder from "@/components/shell/tool-placeholder";

export const metadata: Metadata = {
  title: "Notifications — Agropioo",
};

export default function NotificationsPage() {
  return (
    <ToolPlaceholder
      eyebrow="Notifications"
      title="Everything that needs your eye"
      description="Weather warnings, pest outbreak alerts, and price spikes for your crops — collected in one place."
    />
  );
}
