import type { ReactNode } from "react";
import AppSidebar from "@/components/shell/app-sidebar";
import BottomTabBar from "@/components/shell/bottom-tab-bar";

/* Farmer app shell: desktop sidebar + mobile bottom tab bar.
   Every farmer-app page renders inside this layout. */
export default function FarmerAppLayout({ children }: { children: ReactNode }) {
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
