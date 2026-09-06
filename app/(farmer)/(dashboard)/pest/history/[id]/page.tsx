import { requireSessionPage } from "@/lib/auth/guards";
import { getPestBundle } from "@/lib/i18n/server";
import { queryOne } from "@/lib/db";
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

  const alert = await queryOne<{
    id: string;
    farm_id: string;
    pest_type: string;
    risk_score: number;
    severity: string;
    recommendation_text: string;
    created_at: string;
    read_at: string | null;
    dismissed_at: string | null;
  }>(
    `SELECT id, farm_id, pest_type, risk_score, severity, recommendation_text, created_at, read_at, dismissed_at
     FROM pest_alerts
     WHERE id = $1`,
    [id],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-agro-sprout bg-white p-5">
        <PageHeader eyebrow={bundle.historyTitle} title={bundle.historyTitle} description={bundle.historySubtitle} />
      </div>
      {alert ? (
        <div className="rounded-2xl border border-agro-sprout bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${alert.severity === 'critical' ? 'text-agro-error' : 'text-agro-warning'}`}>
                {alert.pest_type} — {Math.round(alert.risk_score)}%
              </p>
              <p className="mt-1 text-xs text-agro-slate">
                {new Date(alert.created_at).toLocaleDateString()}
              </p>
            </div>
            <span className="rounded-full border border-agro-sprout px-2.5 py-1 text-xs font-semibold text-agro-slate">
              {alert.read_at ? bundle.alerts.markedRead : bundle.alerts.markRead}
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-agro-ink">{alert.recommendation_text}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-agro-sprout bg-white p-5">
          <p className="text-sm text-agro-slate">{bundle.historyEmpty}</p>
        </div>
      )}
      <PestHistoryList bundle={bundle} />
    </div>
  );
}
