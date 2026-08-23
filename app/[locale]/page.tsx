import { getCurrentDictionary, siteHeaderStrings } from "@/lib/i18n/server";
import HomeContent from "./home-content";

export default async function HomePage() {
  const { t } = await getCurrentDictionary();
  return <HomeContent headerStrings={siteHeaderStrings(t)} />;
}
