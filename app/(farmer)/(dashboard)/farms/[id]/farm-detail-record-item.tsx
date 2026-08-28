"use client";

import { useState } from "react";
import { RecordIcon, EyeIcon } from "@/components/icons";
import RecordDetailModal from "@/components/records/record-detail-modal";

type Props = {
  record: Record<string, unknown>;
};

const recordKindIcon: Record<string, React.ComponentType<{size?: number}>> = {
  irrigation: RecordIcon,
  fertilizer: RecordIcon,
  pesticide: RecordIcon,
  disease: RecordIcon,
  harvest: RecordIcon,
  sowing: RecordIcon,
  planting: RecordIcon,
};

function KindIcon({ type }: { type: string }) {
  const Icon = recordKindIcon[type] || RecordIcon;
  return <Icon size={18} />;
}

export default function FarmDetailRecordItem({ record }: Props) {
  const [open, setOpen] = useState(false);
  const r = record as Record<string, unknown>;

  return (
    <>
      <li className="flex items-start gap-3 p-4">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-agro-mint text-agro-canopy">
          <KindIcon type={String(r.type)} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-agro-ink">{String(r.title || r.type)}</p>
          <p className="mt-0.5 line-clamp-1 text-xs leading-relaxed text-agro-slate">{String(r.note || "")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="font-mono text-[0.7rem] uppercase tracking-wide text-agro-slate">{String(r.event_date)}</span>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-agro-slate transition-colors hover:bg-agro-cloud hover:text-agro-canopy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-agro-canopy"
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
