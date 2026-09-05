import { requireSessionPage } from "@/lib/auth/guards";
import { getPestBundle } from "@/lib/i18n/server";
import PestHistoryList from "@/components/pest/PestHistoryList";
import PageHeader from "@/components/shell/page-header";

export const dynamic = "force-dynamic";

export default async function PestHistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSessionPage();
  const bundle = await getPestBundle();
  const { id } = await params;
  void id;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-agro-sprout bg-white p-5">
        <PageHeader eyebrow={bundle.historyTitle} title={bundle.historyTitle} description={bundle.historySubtitle} />
      </div>
      <PestHistoryList bundle={bundle} />
    </div>
  );
}
