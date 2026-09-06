"use client";

import { useState } from "react";
import type { PestBundle } from "./pest-bundle";

const GROWTH_STAGES = [
  "Sowing",
  "Vegetative",
  "Tillering",
  "Grand growth",
  "Panicle initiation",
  "Squaring",
  "Flowering",
  "Boll filling",
  "Tasselling",
  "Grain filling",
  "Ripening",
  "Harvest",
  "Ready",
];

interface GrowthStageEditorProps {
  bundle: PestBundle;
  farmId: string;
  crops: string[];
  initialStages: Record<string, string>;
}

export default function GrowthStageEditor({ bundle, farmId, crops, initialStages }: GrowthStageEditorProps) {
  const crop = crops[0] ?? "";
  const [stage, setStage] = useState(initialStages[crop] ?? "Sowing");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/pest/growth-stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farm_id: farmId, crop, stage }),
      });
      if (res.ok) {
        setMessage(bundle.growthStage.success);
      } else {
        setMessage(bundle.growthStage.error);
      }
    } catch {
      setMessage(bundle.growthStage.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-agro-sprout bg-white p-5">
      <h3 className="text-base font-semibold text-agro-forest">{bundle.growthStage.title}</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-agro-slate">{bundle.growthStage.crop}</label>
          <p className="mt-2 h-12 w-full rounded-xl border border-agro-sprout bg-agro-mint/30 px-4 text-sm font-medium text-agro-ink leading-[3rem]">
            {crop}
          </p>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-agro-slate">{bundle.growthStage.stage}</label>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="mt-2 h-12 w-full appearance-none rounded-xl border border-agro-sprout bg-white px-4 pr-10 text-sm text-agro-ink outline-none focus:border-agro-canopy focus:ring-2 focus:ring-agro-canopy/20"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23475569' viewBox='0 0 16 16'%3E%3Cpath d='M4.5 6l3.5 4 3.5-4z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center" }}
          >
            {GROWTH_STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-agro-canopy px-5 text-sm font-semibold text-white transition-colors hover:bg-agro-forest disabled:opacity-50"
        >
          {saving ? bundle.growthStage.saving : bundle.growthStage.save}
        </button>
        {message && <span className="text-sm text-agro-slate">{message}</span>}
      </div>
    </div>
  );
}
