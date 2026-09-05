import { requireSessionPage } from "@/lib/auth/guards";
import { getPestBundle } from "@/lib/i18n/server";
import PestHistoryList from "@/components/pest/PestHistoryList";
import PageHeader from "@/components/shell/page-header";

export const dynamic = "force-dynamic";

export default async function PestHistoryPage() {
  await requireSessionPage();
  const bundle = await getPestBundle();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-agro-sprout bg-white p-5">
        <PageHeader eyebrow={bundle.historyTitle} title={bundle.historyTitle} description={bundle.historySubtitle} />
      </div>
      <PestHistoryList bundle={bundle} />
    </div>
  );
}
