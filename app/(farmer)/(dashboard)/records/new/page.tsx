import type { Metadata } from "next";
import PageHeader from "@/components/shell/page-header";
import NewRecordForm from "./record-form";
import { getFarmsBundle } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "New record — Agropioo",
};

export default async function NewRecordPage() {
  const bundle = await getFarmsBundle();
  return (
    <div className="pt-1">
      <PageHeader
        eyebrow={bundle.records.eyebrow}
        title={bundle.records.new.heading}
        description={bundle.records.new.description}
      />
      <div className="mt-8 max-w-xl">
        <NewRecordForm bundle={bundle} />
      </div>
    </div>
  );
}
