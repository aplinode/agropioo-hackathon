"use client";
import AppControlChat from "@/components/app-control/app-control-chat";
import type { AppControlBundle } from "@/components/app-control/app-control-bundle";

type Props = {
  bundle: AppControlBundle;
};

export default function AppControlPanel({ bundle }: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-agro-sprout px-4 py-3">
        <h2 className="text-base font-semibold text-agro-ink">{bundle.pageTitle}</h2>
      </div>
      <div className="flex-1 overflow-hidden">
        <AppControlChat bundle={bundle} />
      </div>
    </div>
  );
}
