import type { Metadata } from "next";
import { demoFarms } from "@/app/(dashboard)/dashboard/demo-data";
import ToolPlaceholder from "@/components/shell/tool-placeholder";

export const metadata: Metadata = {
  title: "Farm details — Agropioo",
};

/* Demo stand-in for the farm detail screen. Shows the tapped farm's name
   when the id matches the mock data, so the demo flow feels connected. */
export default async function FarmDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const farm = demoFarms.find((candidate) => candidate.id === id);

  return (
    <ToolPlaceholder
      eyebrow="Farm details"
      title={farm ? farm.name : "Your farm"}
      description="Crops, growth stage, health overview, and the full record log for this farm will live here."
    />
  );
}
