"use client";
import { useState } from "react";
import SimpleAppControlChat from "@/components/app-control/app-control-chat";
import type { AppControlBundle } from "@/components/app-control/app-control-bundle";

type Props = {
  bundle: AppControlBundle;
};

export default function AppControlFloatingChat({ bundle }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-20 end-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-agro-canopy to-agro-forest text-white shadow-lg hover:from-agro-forest hover:to-agro-canopy lg:bottom-8 lg:end-8"
          aria-label={bundle.floating.open}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-agro-ink/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-agro-sprout bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-agro-sprout px-4 py-3">
              <h2 className="text-base font-semibold text-agro-ink">{bundle.pageTitle}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-agro-ink/60 hover:bg-agro-stone/30"
                aria-label={bundle.floating.close}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <SimpleAppControlChat bundle={bundle} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
