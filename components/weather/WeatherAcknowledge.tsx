"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, EyeIcon } from "@/components/icons";

export type WeatherAcknowledgeProps = {
  advisoryId: string;
  strings: {
    markActed: string;
    markAcknowledged: string;
    markedActed: string;
    markedSeen: string;
  };
};

/* Mark an advisory as acted upon / seen from the history detail view (US4, FR-11). */
export default function WeatherAcknowledge({ advisoryId, strings }: WeatherAcknowledgeProps) {
  const router = useRouter();
  const [done, setDone] = useState<null | "acted" | "seen">(null);

  async function send(action: "acted_upon" | "acknowledged", kind: "acted" | "seen") {
    try {
      await fetch(`/api/weather/history/${advisoryId}/acknowledge`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      setDone(kind);
      router.refresh();
    } catch {
      // No-op: the farmer can retry; state stays unchanged.
    }
  }

  if (done) {
    return (
      <p className="mt-4 rounded-xl border border-agro-sprout bg-agro-mint px-4 py-2.5 text-sm font-medium text-agro-canopy">
        {done === "acted" ? strings.markedActed : strings.markedSeen}
      </p>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() => send("acted_upon", "acted")}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-agro-canopy px-4 text-sm font-semibold text-white transition-colors hover:bg-agro-forest"
      >
        <CheckIcon size={16} />
        {strings.markActed}
      </button>
      <button
        type="button"
        onClick={() => send("acknowledged", "seen")}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-agro-sprout bg-white px-4 text-sm font-semibold text-agro-forest transition-colors hover:border-agro-canopy hover:bg-agro-mint"
      >
        <EyeIcon size={16} />
        {strings.markAcknowledged}
      </button>
    </div>
  );
}
