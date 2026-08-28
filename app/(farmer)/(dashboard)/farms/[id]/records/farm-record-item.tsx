"use client";

import { useState } from "react";
import {
  CloudRainIcon,
  SproutIcon,
  FlaskIcon,
  BugIcon,
  WheatIcon,
  RecordIcon,
  EyeIcon,
} from "@/components/icons";
import RecordDetailModal from "@/components/records/record-detail-modal";

type Props = {
  record: Record<string, unknown>;
  index: number;
  total: number;
  typeLabel?: string;
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

export default function FarmRecordItem({ record, index, total, typeLabel }: Props) {
  const [open, setOpen] = useState(false);
  const r = record as Record<string, unknown>;
  const KindIcon = recordKindIcon[r.type as string] || RecordIcon;

  return (
    <>
      <li className="relative">
        {index < total - 1 && (
          <span aria-hidden="true" className="absolute start-[27px] top-14 h-[calc(100%-2rem)] w-px bg-agro-sprout" />
        )}
        <div className="flex items-start gap-3 rounded-2xl border border-agro-sprout bg-white p-4">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-agro-mint text-agro-canopy">
            <KindIcon size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-wide text-agro-canopy">
                {typeLabel || String(r.type)}
              </span>
              <span className="font-mono text-xs text-agro-slate">{String(r.event_date)}</span>
            </div>
            <p className="mt-0.5 text-sm font-semibold leading-snug text-agro-ink">
              {String(r.title || r.type)}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-agro-slate">
              {String(r.note || "")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-agro-slate transition-colors hover:bg-agro-mint hover:text-agro-canopy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-agro-canopy"
            aria-label="View record details"
          >
            <EyeIcon size={16} />
          </button>
        </div>
      </li>
      <RecordDetailModal record={open ? record : null} onClose={() => setOpen(false)} />
    </>
  );
}
