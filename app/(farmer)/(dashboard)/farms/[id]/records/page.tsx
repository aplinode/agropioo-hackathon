import type { Metadata } from "next";
import PageHeader from "@/components/shell/page-header";
import { getFarmsBundle } from "@/lib/i18n/server";
import { requireSessionPage } from "@/lib/auth/guards";
import { getSupabase } from "@/lib/supabase";
import FarmRecordItem from "./farm-record-item";

export const metadata: Metadata = {
  title: "Farm records — Agropioo",
};

export default async function FarmRecordsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSessionPage();
  const { id } = await params;
  let records: Array<Record<string, unknown>> = [];
  try {
    const supabase = getSupabase();
    // First verify farm belongs to session
    const { data: farm } = await supabase
      .from('farms')
      .select('id')
      .eq('id', id)
      .eq('account_id', session.accountId)
      .is('archived_at', null)
      .maybeSingle();

    if (farm) {
      const { data } = await supabase
        .from('records')
        .select('*')
        .eq('farm_id', id)
        .order('event_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (data) records = data;
    }
  } catch (err) {
    console.error("Error fetching farm records:", err);
  }

  const bundle = await getFarmsBundle();

  const recordTypeLabel: Record<string, string> = {
    irrigation: bundle.records.types.irrigation,
    fertilizer: bundle.records.types.fertilizer,
    pesticide: bundle.records.types.pesticide,
    disease: bundle.records.types.disease,
    harvest: bundle.records.types.harvest,
    sowing: 'Sowing',
    planting: 'Planting',
  };

  return (
    <div className="pt-1">
      <PageHeader
        eyebrow={bundle.records.eyebrow}
        title={bundle.records.farmRecords.heading}
        description={bundle.records.farmRecords.description}
      />

      {records.length === 0 ? (
        <p className="mt-6 rounded-xl border-dashed border-agro-sprout bg-agro-mint px-4 py-2.5 text-center font-mono text-xs tracking-wide text-agro-slate">
          No records yet. Log your first field event.
        </p>
      ) : (
        <ol className="mt-6 space-y-3">
          {records.map((record, index) => (
            <FarmRecordItem
              key={record.id as string}
              record={record}
              index={index}
              total={records.length}
              typeLabel={recordTypeLabel[record.type as string] || String(record.type)}
            />
          ))}
        </ol>
      )}
    </div>
  );
}
