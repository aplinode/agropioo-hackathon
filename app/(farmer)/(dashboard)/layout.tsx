import type { ReactNode } from "react";

export const dynamic = "force-dynamic";
import AppSidebar from "@/components/shell/app-sidebar";
import BottomTabBar from "@/components/shell/bottom-tab-bar";
import { requireSessionPage } from "@/lib/auth/guards";
import { getShellBundle } from "@/lib/i18n/server";
import LayoutWithPageContext from "@/components/app-control/layout-page-context";

/* Farmer app shell: desktop sidebar + mobile bottom tab bar.
   Every farmer-app page renders inside this layout. Guests are redirected
   to /login here — one choke point for the whole app (FR27/FR29). */
export default async function FarmerAppLayout({ children }: { children: ReactNode }) {
  await requireSessionPage();
  const bundle = await getShellBundle();
  return (
    <div className="min-h-dvh bg-agro-paper">
      <AppSidebar bundle={bundle} />
      <div className="lg:ps-64">
        <main className="mx-auto w-full max-w-2xl px-4 pb-28 pt-6 sm:px-6 lg:max-w-4xl lg:px-10 lg:pb-16 lg:pt-9 xl:max-w-5xl">
          <LayoutWithPageContext>{children}</LayoutWithPageContext>
        </main>
      </div>
      <BottomTabBar bundle={bundle} />
    </div>
  );
}

