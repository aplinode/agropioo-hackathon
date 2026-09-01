import type { Metadata } from "next";
import PageHeader from "@/components/shell/page-header";
import NotificationsList from "./notifications-list";

export const metadata: Metadata = {
  title: "Notifications — Agropioo",
};

export default async function NotificationsPage() {
  return (
    <div className="pt-1">
      <PageHeader
        eyebrow="Notifications"
        title="Everything that needs your eye"
        description="Weather warnings, pest outbreaks, and price moves for your crops — newest first, worst first."
      />
      <div className="mt-6">
        <NotificationsList />
      </div>
    </div>
  );
}

