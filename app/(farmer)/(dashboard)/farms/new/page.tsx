import type { Metadata } from "next";
import PageHeader from "@/components/shell/page-header";
import NewFarmForm from "./farm-form";

export const metadata: Metadata = {
  title: "Add a farm — Agropioo",
};

export default function NewFarmPage() {
  return (
    <div className="pt-1">
      <PageHeader
        eyebrow="Farms"
        title="Add a farm"
        description="Tell Agropioo about your land — location, crop, and size — so every advisory is shaped around it."
      />
      <div className="mt-8 max-w-xl">
        <NewFarmForm />
      </div>
    </div>
  );
}
