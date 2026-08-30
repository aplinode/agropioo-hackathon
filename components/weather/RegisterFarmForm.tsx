"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@/components/icons";

export type RegisterFarmFormProps = {
  farmId: string;
  cropOptions: string[];
  strings: {
    title: string;
    body: string;
    crop: string;
    sowing: string;
    soil: string;
    irrigation: string;
    soilTypes: string;
    irrigationMethods: string;
    save: string;
    saving: string;
    success: string;
    error: string;
  };
  irrigationOptions?: string[];
};

const DEFAULT_IRRIGATION = ["drip", "sprinkler", "flood", "rainfed"];

/* Lets a farmer set the weather-advisory profile (crop, sowing date, soil,
   irrigation) for a registered farm so daily advice can be generated (US1). */
export default function RegisterFarmForm({
  farmId,
  cropOptions,
  strings,
  irrigationOptions = DEFAULT_IRRIGATION,
}: RegisterFarmFormProps) {
  const router = useRouter();
  const [crop, setCrop] = useState(cropOptions[0] ?? "");
  const [sowing, setSowing] = useState("");
  const [soil, setSoil] = useState("");
  const [irrigation, setIrrigation] = useState(irrigationOptions[0] ?? "drip");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    try {
      const res = await fetch("/api/weather/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          farm_id: farmId,
          primary_crop: crop,
          sowing_date: sowing,
          soil_type: soil,
          irrigation_method: irrigation,
        }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setStatus("saved");
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="mt-5 rounded-3xl border border-agro-sprout bg-white p-6">
      <h2 className="text-lg font-semibold text-agro-forest">{strings.title}</h2>
      <p className="mt-1 text-sm text-agro-slate">{strings.body}</p>

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div>
          <label className="block font-mono text-xs uppercase tracking-[0.18em] text-agro-slate">
            {strings.crop}
          </label>
          <select
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
            className="mt-1 w-full rounded-xl border border-agro-sprout bg-white px-3 py-2.5 text-sm text-agro-ink outline-none focus:border-agro-canopy focus:ring-2 focus:ring-agro-canopy/20"
          >
            {cropOptions.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-mono text-xs uppercase tracking-[0.18em] text-agro-slate">
            {strings.sowing}
          </label>
          <input
            type="date"
            required
            value={sowing}
            onChange={(e) => setSowing(e.target.value)}
            className="mt-1 w-full rounded-xl border border-agro-sprout bg-white px-3 py-2.5 text-sm text-agro-ink outline-none focus:border-agro-canopy focus:ring-2 focus:ring-agro-canopy/20"
          />
        </div>

        <div>
          <label className="block font-mono text-xs uppercase tracking-[0.18em] text-agro-slate">
            {strings.soil}
          </label>
          <input
            type="text"
            required
            value={soil}
            onChange={(e) => setSoil(e.target.value)}
            placeholder={strings.soilTypes}
            className="mt-1 w-full rounded-xl border border-agro-sprout bg-white px-3 py-2.5 text-sm text-agro-ink outline-none focus:border-agro-canopy focus:ring-2 focus:ring-agro-canopy/20"
          />
        </div>

        <div>
          <label className="block font-mono text-xs uppercase tracking-[0.18em] text-agro-slate">
            {strings.irrigation}
          </label>
          <select
            value={irrigation}
            onChange={(e) => setIrrigation(e.target.value)}
            className="mt-1 w-full rounded-xl border border-agro-sprout bg-white px-3 py-2.5 text-sm text-agro-ink outline-none focus:border-agro-canopy focus:ring-2 focus:ring-agro-canopy/20"
          >
            {irrigationOptions.map((m) => (
              <option key={m} value={m}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={status === "saving"}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-agro-canopy px-4 text-sm font-semibold text-white transition-colors hover:bg-agro-forest disabled:opacity-60"
        >
          <PlusIcon size={16} />
          {status === "saving" ? strings.saving : strings.save}
        </button>

        {status === "saved" && (
          <p className="text-center text-sm font-medium text-agro-canopy">{strings.success}</p>
        )}
        {status === "error" && (
          <p className="text-center text-sm text-agro-forest">{strings.error}</p>
        )}
      </form>
    </section>
  );
}
