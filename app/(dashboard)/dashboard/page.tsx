import type { Metadata } from "next";
import DashboardView from "./dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard — Agropioo",
  description:
    "Today's advisory, weather, alerts, and every Agropioo tool — one screen that answers kya karoon aaj?",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const emptyView = params.view === "empty";

  return <DashboardView variant={emptyView ? "empty" : "default"} />;
}
