import type { Metadata } from "next";
import PageHeader from "@/components/shell/page-header";
import RecordForm from "./record-form";
import { getFarmsBundle } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Log a field event — Agropioo",
};

export default async function NewRecordPage({
  searchParams,
}: {
  searchParams: Promise<{ farm?: string }>;
}) {
  const params = await searchParams;
  const bundle = await getFarmsBundle();
  return (
    <div className="pt-1">
      <PageHeader
        eyebrow={bundle.records.eyebrow}
        title={bundle.records.new.heading}
        description={bundle.records.new.description}
      />
      <div className="mt-8 max-w-xl">
        <RecordForm bundle={bundle} defaultFarmId={params.farm || ''} />
      </div>
    </div>
  );
}
