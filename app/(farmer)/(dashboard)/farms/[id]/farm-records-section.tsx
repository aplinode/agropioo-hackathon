"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CloudRainIcon,
  SproutIcon,
  FlaskIcon,
  BugIcon,
  WheatIcon,
  RecordIcon,
} from "@/components/icons";
import FarmDetailRecordItem from "./farm-detail-record-item";
import type { FarmsBundle } from "@/app/(farmer)/(dashboard)/farms/farms-bundle";

const typeIcon: Record<string, React.ComponentType<{size?: number}>> = {
  irrigation: CloudRainIcon,
  fertilizer: SproutIcon,
  pesticide: FlaskIcon,
  disease: BugIcon,
  harvest: WheatIcon,
  sowing: SproutIcon,
  planting: SproutIcon,
};

type Props = {
  farmId: string;
  records: Record<string, unknown>[];
  bundle: FarmsBundle;
};

export default function FarmRecordsSection({ farmId, records, bundle }: Props) {
  const [activeType, setActiveType] = useState<string | null>(null);

  const uniqueTypes = Array.from(new Set(records.map((r) => String(r.type)).filter(Boolean)));
  const filtered = activeType ? records.filter((r) => String(r.type) === activeType) : records;

  return (
    <section aria-labelledby="activity-heading" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="activity-heading" className="shrink-0 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate">
          {bundle.detail.activityHeading}
        </h2>
        {records.length > 0 && (
          <Link href={`/farms/${farmId}/records`} className="inline-flex min-h-11 items-center rounded-md text-sm font-semibold text-agro-canopy underline-offset-4 hover:underline">
            {bundle.detail.viewAllRecords}
          </Link>
        )}
      </div>

      {records.length === 0 ? (
        <div className="rounded-2xl border border-agro-sprout bg-white p-8 text-center">
          <p className="text-sm text-agro-slate">{bundle.detail.noRecords}</p>
          <Link
            href={`/records/new?farm=${farmId}`}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-agro-canopy px-5 text-sm font-semibold text-white transition-colors hover:bg-agro-forest"
          >
            {bundle.detail.logFieldEvent}
          </Link>
        </div>
      ) : (
        <>
          {uniqueTypes.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveType(null)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeType === null
                    ? 'bg-agro-canopy text-white'
                    : 'border border-agro-sprout bg-white text-agro-slate hover:border-agro-canopy hover:text-agro-canopy'
                }`}
              >
                All
              </button>
              {uniqueTypes.map((type) => {
                const Icon = typeIcon[type] || RecordIcon;
                const label = bundle.records.types[type as keyof typeof bundle.records.types] || type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setActiveType(type)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      activeType === type
                        ? 'bg-agro-canopy text-white'
                        : 'border border-agro-sprout bg-white text-agro-slate hover:border-agro-canopy hover:text-agro-canopy'
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          <ul className="divide-y divide-agro-sprout overflow-hidden rounded-2xl border border-agro-sprout bg-white">
            {filtered.map((record) => (
              <FarmDetailRecordItem key={record.id as string} record={record} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
