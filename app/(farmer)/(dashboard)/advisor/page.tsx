import type { Metadata } from "next";
import AdvisorChat from "./advisor-chat";
import { getAdvisorBundle, getAppLocale } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Advisor — Agropioo",
};

interface AdvisorPageProps {
  searchParams: Promise<{ draft?: string }>;
}

export default async function AdvisorPage({ searchParams }: AdvisorPageProps) {
  const [bundle, appLocale, { draft }] = await Promise.all([
    getAdvisorBundle(),
    getAppLocale(),
    searchParams,
  ]);

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col lg:min-h-[calc(100dvh-11rem)]">
      <AdvisorChat bundle={bundle} appLocale={appLocale} initialDraft={draft} />
    </div>
  );
}
