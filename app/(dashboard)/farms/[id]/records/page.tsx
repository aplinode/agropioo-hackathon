import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { demoFarms } from "@/app/(dashboard)/dashboard/demo-data";
import PageHeader from "@/components/shell/page-header";
import { recordTypeLabel, recordsForFarm } from "../../demo-data";
import {
  CloudRainIcon,
  SproutIcon,
  FlaskIcon,
  BugIcon,
  WheatIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "Farm records — Agropioo",
};

const recordKindIcon = {
  irrigation: CloudRainIcon,
  fertilizer: SproutIcon,
  pesticide: FlaskIcon,
  disease: BugIcon,
  harvest: WheatIcon,
} as const;

/* Full digital record log for one farm — irrigation, fertilizer, pesticide,
   disease, and harvest entries in season order. */
export default async function FarmRecordsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const farm = demoFarms.find((candidate) => candidate.id === id);
  if (!farm) notFound();

  const records = recordsForFarm(farm.id);

  return (
    <div className="pt-1">
      <PageHeader
        eyebrow={`${farm.name} · records`}
        title="The farm's memory"
        description="Every irrigation, spray, and treatment written down — so decisions next week don't rely on memory."
      />

      <ol className="mt-6 space-y-3">
        {records.map((record, index) => {
          const KindIcon = recordKindIcon[record.type];
          return (
            <li key={record.id} className="relative">
              {/* Furrow spine connecting the entries */}
              {index < records.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute start-[27px] top-14 h-[calc(100%-2rem)] w-px bg-agro-sprout"
                />
              )}
              <div className="flex items-start gap-3 rounded-2xl border border-agro-sprout bg-white p-4">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-agro-mint text-agro-canopy">
                  <KindIcon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-wide text-agro-canopy">
                      {recordTypeLabel[record.type]}
                    </span>
                    <span className="font-mono text-xs text-agro-slate">{record.when}</span>
                  </div>
                  <p className="mt-0.5 text-sm font-semibold leading-snug text-agro-ink">
                    {record.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-agro-slate">
                    {record.note}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-6 rounded-xl border-dashed border-agro-sprout bg-agro-mint px-4 py-2.5 text-center font-mono text-xs tracking-wide text-agro-slate">
        DEMO · sample entries only — saving new ones isn&apos;t wired yet
      </p>
    </div>
  );
}
