"use client";
import AppControlChat from "@/components/app-control/app-control-chat";
import type { AppControlBundle } from "@/components/app-control/app-control-bundle";

type Props = {
  bundle: AppControlBundle;
};

export default function AppControlPanel({ bundle }: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden">
        <AppControlChat bundle={bundle} />
      </div>
    </div>
  );
}
