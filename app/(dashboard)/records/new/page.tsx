import type { Metadata } from "next";
import PageHeader from "@/components/shell/page-header";
import NewRecordForm from "./record-form";

export const metadata: Metadata = {
  title: "New record — Agropioo",
};

export default function NewRecordPage() {
  return (
    <div className="pt-1">
      <PageHeader
        eyebrow="Farm records"
        title="Log what happened in the field"
        description="Irrigation, fertilizer, pesticide, disease, and harvest entries — your farm's memory, one line at a time."
      />
      <div className="mt-8 max-w-xl">
        <NewRecordForm />
      </div>
    </div>
  );
}
