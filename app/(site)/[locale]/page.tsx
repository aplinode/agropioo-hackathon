import { getCurrentDictionary, siteHeaderStrings } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";
import { getSessionOptional } from "@/lib/auth/guards";
import { queryOne } from "@/lib/db";
import HomeContent from "./home-content";
import type { SessionUser } from "@/components/SiteHeader";

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale, t } = await getCurrentDictionary((await params).locale);
  const sessionCtx = await getSessionOptional();

  let session: SessionUser | null = null;
  if (sessionCtx) {
    const user = await queryOne<{ full_name: string }>(
      `SELECT full_name FROM users WHERE id = $1`,
      [sessionCtx.accountId],
    );
    session = {
      email: sessionCtx.email,
      fullName: user?.full_name ?? sessionCtx.email,
    };
  }

  return <HomeContent headerStrings={siteHeaderStrings(t)} session={session} locale={locale} />;
}
