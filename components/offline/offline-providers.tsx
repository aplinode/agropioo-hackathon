import { OfflineBanner, InstallPrompt } from "./offline-install-prompt";
import { getDictionary } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";

export interface OfflineProvidersProps {
  locale: Locale;
}

export async function OfflineProviders({ locale }: OfflineProvidersProps) {
  const { t } = await getDictionary(locale);

  return (
    <>
      <OfflineBanner message={t("offline.banner")} />
      <InstallPrompt
        installAction={t("offline.installAction")}
        iosPrompt={t("offline.iosPrompt")}
      />
    </>
  );
}
