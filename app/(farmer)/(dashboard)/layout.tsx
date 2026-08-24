import type { ReactNode } from "react";

export const dynamic = "force-dynamic";
import AppSidebar from "@/components/shell/app-sidebar";
import BottomTabBar from "@/components/shell/bottom-tab-bar";
import { requireSessionPage } from "@/lib/auth/guards";

/* Farmer app shell: desktop sidebar + mobile bottom tab bar.
   Every farmer-app page renders inside this layout. Guests are redirected
   to /login here â€” one choke point for the whole app (FR27/FR29). */
export default async function FarmerAppLayout({ children }: { children: ReactNode }) {
  await requireSessionPage();
  return (
    <div className="min-h-dvh bg-agro-paper">
      <AppSidebar />
      <div className="lg:pl-64">
        <main className="mx-auto w-full max-w-2xl px-4 pb-28 pt-6 sm:px-6 lg:max-w-4xl lg:px-10 lg:pb-16 lg:pt-9 xl:max-w-5xl">
          {children}
        </main>
      </div>
      <BottomTabBar />
    </div>
  );
}

