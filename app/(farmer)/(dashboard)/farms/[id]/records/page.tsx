import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/components/shell/page-header";
import {
  CloudRainIcon,
  SproutIcon,
  FlaskIcon,
  BugIcon,
  WheatIcon,
  RecordIcon,
} from "@/components/icons";
import { getFarmsBundle } from "@/lib/i18n/server";
import { requireSessionPage } from "@/lib/auth/guards";
import { getSupabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Farm records — Agropioo",
};

const recordKindIcon: Record<string, React.ComponentType<{size?: number}>> = {
  irrigation: CloudRainIcon,
  fertilizer: SproutIcon,
  pesticide: FlaskIcon,
  disease: BugIcon,
  harvest: WheatIcon,
  sowing: SproutIcon,
  planting: SproutIcon,
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
          {records.map((record, index) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const r = record as any;
            const KindIcon = recordKindIcon[r.type] || RecordIcon;
            return (
              <li key={r.id} className="relative">
                {index < records.length - 1 && (
                  <span aria-hidden="true" className="absolute start-[27px] top-14 h-[calc(100%-2rem)] w-px bg-agro-sprout" />
                )}
                <div className="flex items-start gap-3 rounded-2xl border border-agro-sprout bg-white p-4">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-agro-mint text-agro-canopy">
                    <KindIcon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-wide text-agro-canopy">
                        {recordTypeLabel[r.type] || r.type}
                      </span>
                      <span className="font-mono text-xs text-agro-slate">{r.event_date}</span>
                    </div>
                    <p className="mt-0.5 text-sm font-semibold leading-snug text-agro-ink">
                      {r.title || r.type}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-agro-slate">
                      {r.note}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
