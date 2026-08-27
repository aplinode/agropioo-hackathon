import type { Metadata } from "next";
import AdvisorChat from "./advisor-chat";
import { getAdvisorBundle, getAppLocale } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Advisor — Agropioo",
};

export default async function AdvisorPage() {
  const bundle = await getAdvisorBundle();
  const appLocale = await getAppLocale();

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col lg:min-h-[calc(100dvh-11rem)]">
      <AdvisorChat bundle={bundle} appLocale={appLocale} />
    </div>
  );
}
