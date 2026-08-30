import type { Metadata, Viewport } from "next";

import { LOCALE_REGISTRY } from "@/lib/i18n/config";
import { getAppLocale, getDictionary } from "@/lib/i18n/server";
import { SetHtmlAttributes } from "@/components/set-html-attributes";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getAppLocale();
  const { t } = await getDictionary(locale);
  return {
    title: t("app.shell.metadataTitle").text,
    description: t("app.shell.metadataDescription").text,
  };
}

export const viewport: Viewport = {
  themeColor: "#F0FDF4",
};

export default async function FarmerAppLayout({ children }: LayoutProps<"/">) {
  const localeCode = await getAppLocale();
  const entry = LOCALE_REGISTRY[localeCode];

  return (
    <>
      <SetHtmlAttributes lang={entry.htmlLang} dir={entry.dir} />
      {children}
    </>
  );
}
