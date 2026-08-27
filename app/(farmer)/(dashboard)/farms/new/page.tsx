import type { Metadata } from "next";
import PageHeader from "@/components/shell/page-header";
import NewFarmForm from "./farm-form";
import { getFarmsBundle } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Add a farm — Agropioo",
};

export default async function NewFarmPage() {
  const bundle = await getFarmsBundle();
  return (
    <div className="pt-1">
      <PageHeader
        eyebrow={bundle.eyebrow}
        title={bundle.new.heading}
        description={bundle.new.description}
      />
      <div className="mt-8 max-w-xl">
        <NewFarmForm bundle={bundle} />
      </div>
    </div>
  );
}
