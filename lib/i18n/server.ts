import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { locale as rootLocale } from "next/root-params";

import { CATALOG, ENGLISH_TABLE, type CatalogKey } from "@/catalog";
import { APP_LOCALE_COOKIE, isLocale } from "./config";
import { getSupabase } from "@/lib/supabase";

import type { Locale } from "./config";
import { formatMessage } from "./logic";
import { resolveAppLocale, resolveString, type ResolvedString, type StringTable } from "./logic";
import type { DashboardBundle } from "@/app/(farmer)/(dashboard)/dashboard/dashboard-bundle";
import type { FarmsBundle } from "@/app/(farmer)/(dashboard)/farms/farms-bundle";
import type { AdvisorBundle } from "@/app/(farmer)/(dashboard)/advisor/advisor-bundle";

export interface Translator {
  (key: CatalogKey, params?: Readonly<Record<string, string | number>>): ResolvedString;
}

export interface Dictionary {
  locale: Locale;
  t: Translator;
}

function buildTable(
  rows: readonly { key: string; value: string | null }[],
): StringTable {
  const table: Record<string, string> = {};
  for (const row of rows) {
    if (typeof row.value === "string" && row.value.trim() !== "") {
      table[row.key] = row.value;
    }
  }
  return table;
}

/**
 * Loads the dictionary for one locale from the DB catalog. Rendered
 * dynamically with per-request dedupe via React cache() — no cross-request
 * cache, so founder SQL edits are visible on the very next request (AC-6).
 * If Supabase is unreachable we degrade to the build-time catalog so pages
 * still render English (+ drafted copy) instead of erroring.
 */
export const getDictionary = cache(async (localeCode: Locale): Promise<Dictionary> => {
  let primary: StringTable = fallbackTableFor(localeCode);
  let english: StringTable = ENGLISH_TABLE;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("translations")
      .select("key,locale,value")
      .in("locale", [localeCode, "en"])
      .eq("status", "translated");

    if (!error && data) {
      const localizedRows: { key: string; value: string | null }[] = [];
      const englishRows: { key: string; value: string | null }[] = [];
      for (const row of data) {
        if (row.locale === localeCode) localizedRows.push(row);
        else englishRows.push(row);
      }
      // DB rows overlay the drafted baseline — they can override copy but a
      // missing/empty DB (or locale gap) must never erase the catalog.
      primary = {
        ...fallbackTableFor(localeCode),
        ...buildTable(localizedRows),
      };
      const dbEnglish = buildTable(englishRows);
      english = { ...ENGLISH_TABLE, ...dbEnglish };
    }
  } catch {
    // Supabase unavailable — keep the build-time fallback tables.
  }

  const t: Translator = (key, params) => {
    const resolved = resolveString(primary, english, key);
    const text =
      params === undefined ? resolved.text : formatMessage(resolved.text, params);
    return { text, isFallback: resolved.isFallback };
  };

  return { locale: localeCode, t };
});

/** Build-time drafted copy for a locale merged over the English source of truth. */
function fallbackTableFor(localeCode: Locale): StringTable {
  const drafted = CATALOG[localeCode] ?? {};
  const table: Record<string, string> = { ...ENGLISH_TABLE };
  for (const [key, value] of Object.entries(drafted)) {
    if (typeof value === "string" && value.trim() !== "") table[key] = value;
  }
  return table;
}

/**
 * Dictionary for whichever locale the URL carries — the standard entry point
 * for pages under app/[locale]. Unprefixed rewrites resolve to "en".
 */
export async function getCurrentDictionary(): Promise<Dictionary> {
  const raw = await rootLocale();
  return getDictionary(isLocale(raw) ? raw : "en");
}

/**
 * Farmer-app display language, resolved once per request from the persisted
 * preference (ADR 0004): absent/unknown cookie values fall back to English.
 * Cached like getDictionary so a layout and its pages share one resolution.
 */
export const getAppLocale = cache(async (): Promise<Locale> => {
  await connection();
  const cookieStore = await cookies();
  return resolveAppLocale(cookieStore.get(APP_LOCALE_COOKIE)?.value);
});

/**
 * Flat translation bundle for the client shell (sidebar + bottom tabs).
 * Server-only function — result crosses the RSC boundary as plain props.
 */
export async function getShellBundle() {
  const locale = await getAppLocale();
  const dict = await getDictionary(locale);
  const t = dict.t;
  return {
    nav: {
      dashboard: t("app.shell.nav.dashboard").text,
      farms: t("app.shell.nav.farms").text,
      advisor: t("app.shell.nav.advisor").text,
      detect: t("app.shell.nav.detect").text,
      prices: t("app.shell.nav.prices").text,
      weather: t("app.shell.nav.weather").text,
      notifications: t("app.shell.nav.notifications").text,
      settings: t("app.shell.nav.settings").text,
      more: t("app.shell.nav.more").text,
    },
    signOut: t("app.shell.signOut").text,
    aria: {
      farmerTools: t("app.shell.aria.farmerTools").text,
      currentPage: t("app.shell.aria.currentPage").text,
    },
    productOf: t("common.productOfAplinode").text,
    builtForPakistan: t("common.builtForPakistan").text,
  } as const;
}

/**
 * Flat translation bundle for the client DashboardView (UI chrome + demo data).
 * Server-only function — result crosses the RSC boundary as plain props.
 */
export async function getDashboardBundle(): Promise<DashboardBundle> {
  const locale = await getAppLocale();
  const dict = await getDictionary(locale);
  const t = dict.t;
  return {
    greeting: t("app.dashboard.greeting").text,
    profileMenu: t("app.dashboard.aria.profileMenu").text,
    welcomeEyebrow: t("app.dashboard.welcomeEyebrow").text,
    welcomeTitle: t("app.dashboard.welcomeTitle").text,
    welcomeBody: t("app.dashboard.welcomeBody").text,
    addFirstFarm: t("app.dashboard.addFirstFarm").text,
    today: t("app.dashboard.badge.today").text,
    advisoryTitle: t("app.dashboard.aria.advisoryTitle").text,
    carryToField: t("app.dashboard.carryToField").text,
    askAdvisor: t("app.dashboard.askAdvisor").text,
    weatherTitle: t("app.dashboard.aria.weatherTitle").text,
    degreesCelsius: t("app.dashboard.aria.degreesCelsius").text,
    fullForecast: t("app.dashboard.fullForecast").text,
    weatherUnavailable: t("app.dashboard.weatherUnavailable").text,
    seasonTipBadge: t("app.dashboard.seasonTipBadge").text,
    alertsHeading: t("app.dashboard.alertsHeading").text,
    newCount: t("app.dashboard.newCount").text,
    viewAllAlerts: t("app.dashboard.viewAllAlerts").text,
    noAlerts: t("app.dashboard.noAlerts").text,
    alertAria: t("app.dashboard.aria.alert").text,
    severityCritical: t("app.dashboard.severity.critical").text,
    severityWatch: t("app.dashboard.severity.watch").text,
    severityInfo: t("app.dashboard.severity.info").text,
    quickActionsHeading: t("app.dashboard.quickActionsHeading").text,
    cropDoctor: t("app.dashboard.cropDoctor").text,
    detectTitle: t("app.dashboard.detectTitle").text,
    detectBody: t("app.dashboard.detectBody").text,
    myFarms: t("app.dashboard.myFarms").text,
    addFarm: t("app.dashboard.addFarm").text,
    healthGood: t("app.dashboard.health.good").text,
    healthWatch: t("app.dashboard.health.watch").text,
    setupChecklist: t("app.dashboard.setupChecklist").text,
    checklistProgress: t("app.dashboard.checklistProgress").text,
    dismissChecklist: t("app.dashboard.aria.dismissChecklist").text,
    setupProgress: t("app.dashboard.aria.setupProgress").text,
    demoFooter: t("app.dashboard.demoFooter").text,
    languageLabel: t("app.dashboard.languageLabel").text,
    signOut: t("app.shell.signOut").text,
    demo: {
      todayLabel: t("app.dashboard.demo.todayLabel").text,
      location: t("app.dashboard.demo.location").text,
      advisoryCrop: t("app.dashboard.demo.advisoryCrop").text,
      advisoryStage: t("app.dashboard.demo.advisoryStage").text,
      advisoryAction: t("app.dashboard.demo.advisoryAction").text,
      advisoryWhy: t("app.dashboard.demo.advisoryWhy").text,
      seasonAction: t("app.dashboard.demo.seasonAction").text,
      seasonWhy: t("app.dashboard.demo.seasonWhy").text,
      weatherLocation: t("app.dashboard.demo.weatherLocation").text,
      weatherCondition: t("app.dashboard.demo.weatherCondition").text,
      rainNote: t("app.dashboard.demo.rainNote").text,
      alertWhitefly: t("app.dashboard.demo.alertWhitefly").text,
      alertRain: t("app.dashboard.demo.alertRain").text,
      alertPrice: t("app.dashboard.demo.alertPrice").text,
      farm1Name: t("app.dashboard.demo.farm1Name").text,
      farm1Location: t("app.dashboard.demo.farm1Location").text,
      farm1Crops: t("app.dashboard.demo.farm1Crops").text,
      farm1Stage: t("app.dashboard.demo.farm1Stage").text,
      farm2Name: t("app.dashboard.demo.farm2Name").text,
      farm2Location: t("app.dashboard.demo.farm2Location").text,
      farm2Crops: t("app.dashboard.demo.farm2Crops").text,
      farm2Stage: t("app.dashboard.demo.farm2Stage").text,
      farm3Name: t("app.dashboard.demo.farm3Name").text,
      farm3Location: t("app.dashboard.demo.farm3Location").text,
      farm3Crops: t("app.dashboard.demo.farm3Crops").text,
      farm3Stage: t("app.dashboard.demo.farm3Stage").text,
      checklistAdvisor: t("app.dashboard.demo.checklistAdvisor").text,
      checklistDetect: t("app.dashboard.demo.checklistDetect").text,
      actionAdvisor: t("app.dashboard.demo.actionAdvisor").text,
      actionScan: t("app.dashboard.demo.actionScan").text,
      actionPrices: t("app.dashboard.demo.actionPrices").text,
      actionRecord: t("app.dashboard.demo.actionRecord").text,
    },
  };
}

/**
 * Flat translation bundle for the farms feature (list, new, detail, records).
 * Built server-side and passed as props to client components.
 */
export async function getFarmsBundle(): Promise<FarmsBundle> {
  const locale = await getAppLocale();
  const dict = await getDictionary(locale);
  const t = dict.t;
  return {
    eyebrow: t("app.farms.eyebrow").text,
    healthGood: t("app.farms.health.good").text,
    healthWatch: t("app.farms.health.watch").text,
    unitsAcres: t("app.farms.units.acres").text,
    stages: {
      sowing: t("app.farms.stages.sowing").text,
      tillering: t("app.farms.stages.tillering").text,
      vegetative: t("app.farms.stages.vegetative").text,
      grainFilling: t("app.farms.stages.grainFilling").text,
      ready: t("app.farms.stages.ready").text,
      squaring: t("app.farms.stages.squaring").text,
      flowering: t("app.farms.stages.flowering").text,
      bollFilling: t("app.farms.stages.bollFilling").text,
      grandGrowth: t("app.farms.stages.grandGrowth").text,
      ripening: t("app.farms.stages.ripening").text,
      harvest: t("app.farms.stages.harvest").text,
    },
    districts: {
      multan: t("app.farms.districts.multan").text,
      sahiwal: t("app.farms.districts.sahiwal").text,
      faisalabad: t("app.farms.districts.faisalabad").text,
      vehari: t("app.farms.districts.vehari").text,
      bahawalpur: t("app.farms.districts.bahawalpur").text,
      lodhran: t("app.farms.districts.lodhran").text,
    },
    crops: {
      wheat: t("app.farms.crops.wheat").text,
      cotton: t("app.farms.crops.cotton").text,
      sugarcane: t("app.farms.crops.sugarcane").text,
      maize: t("app.farms.crops.maize").text,
      rice: t("app.farms.crops.rice").text,
    },
    list: {
      pageTitle: t("app.farms.list.pageTitle").text,
      heading: t("app.farms.list.heading").text,
      description: t("app.farms.list.description").text,
      addLink: t("app.farms.list.addLink").text,
      openFarm: t("app.farms.list.openFarm").text,
      addNewFarm: t("app.farms.list.addNewFarm").text,
    },
    new: {
      pageTitle: t("app.farms.new.pageTitle").text,
      heading: t("app.farms.new.heading").text,
      description: t("app.farms.new.description").text,
      fields: {
        name: t("app.farms.new.fields.name").text,
        district: t("app.farms.new.fields.district").text,
        crop: t("app.farms.new.fields.crop").text,
        acres: t("app.farms.new.fields.acres").text,
      },
      placeholders: {
        name: t("app.farms.new.placeholders.name").text,
        district: t("app.farms.new.placeholders.district").text,
        crop: t("app.farms.new.placeholders.crop").text,
        acres: t("app.farms.new.placeholders.acres").text,
      },
      buttons: {
        saving: t("app.farms.new.buttons.saving").text,
        save: t("app.farms.new.buttons.save").text,
      },
      demoNotice: t("app.farms.new.demoNotice").text,
      success: {
        heading: t("app.farms.new.success.heading").text,
        description: t("app.farms.new.success.description").text,
        goToFarms: t("app.farms.new.success.goToFarms").text,
        backToDashboard: t("app.farms.new.success.backToDashboard").text,
      },
      errors: {
        nameRequired: t("app.farms.new.errors.nameRequired").text,
        districtRequired: t("app.farms.new.errors.districtRequired").text,
        cropRequired: t("app.farms.new.errors.cropRequired").text,
        acresRequired: t("app.farms.new.errors.acresRequired").text,
      },
    },
    detail: {
      pageTitle: t("app.farms.detail.pageTitle").text,
      heroEyebrow: t("app.farms.detail.heroEyebrow").text,
      goodHealth: t("app.farms.detail.goodHealth").text,
      needsWatching: t("app.farms.detail.needsWatching").text,
      sownLabel: t("app.farms.detail.sownLabel").text,
      seasonHeading: t("app.farms.detail.seasonHeading").text,
      activityHeading: t("app.farms.detail.activityHeading").text,
      viewAllRecords: t("app.farms.detail.viewAllRecords").text,
      logFieldEvent: t("app.farms.detail.logFieldEvent").text,
      scanCrop: t("app.farms.detail.scanCrop").text,
    },
    records: {
      eyebrow: t("app.records.eyebrow").text,
      types: {
        irrigation: t("app.records.types.irrigation").text,
        fertilizer: t("app.records.types.fertilizer").text,
        pesticide: t("app.records.types.pesticide").text,
        disease: t("app.records.types.disease").text,
        harvest: t("app.records.types.harvest").text,
      },
      farmRecords: {
        pageTitle: t("app.records.farmRecords.pageTitle").text,
        heading: t("app.records.farmRecords.heading").text,
        description: t("app.records.farmRecords.description").text,
        demoNotice: t("app.records.farmRecords.demoNotice").text,
      },
      new: {
        pageTitle: t("app.records.new.pageTitle").text,
        heading: t("app.records.new.heading").text,
        description: t("app.records.new.description").text,
        fields: {
          type: t("app.records.new.fields.type").text,
          farm: t("app.records.new.fields.farm").text,
          date: t("app.records.new.fields.date").text,
          title: t("app.records.new.fields.title").text,
          optional: t("app.records.new.fields.optional").text,
          details: t("app.records.new.fields.details").text,
        },
        placeholders: {
          farm: t("app.records.new.placeholders.farm").text,
          titleIrrigation: t("app.records.new.placeholders.titleIrrigation").text,
          titleOther: t("app.records.new.placeholders.titleOther").text,
          details: t("app.records.new.placeholders.details").text,
        },
        buttons: {
          saving: t("app.records.new.buttons.saving").text,
          save: t("app.records.new.buttons.save").text,
        },
        demoNotice: t("app.records.new.demoNotice").text,
        success: {
          heading: t("app.records.new.success.heading").text,
          description: t("app.records.new.success.description").text,
          backToDashboard: t("app.records.new.success.backToDashboard").text,
          viewFarms: t("app.records.new.success.viewFarms").text,
        },
        errors: {
          farmRequired: t("app.records.new.errors.farmRequired").text,
          dateRequired: t("app.records.new.errors.dateRequired").text,
        },
      },
    },
  };
}

/**
 * Flat translation bundle for the advisor chat feature (sidebar + chat UI).
 * Built server-side and passed as props to client components.
 */
export async function getAdvisorBundle(): Promise<AdvisorBundle> {
  const locale = await getAppLocale();
  const dict = await getDictionary(locale);
  const t = dict.t;
  return {
    pageTitle: t("app.advisor.pageTitle").text,
    sidebar: {
      title: t("app.advisor.sidebar.title").text,
      newConversation: t("app.advisor.sidebar.newConversation").text,
      noConversations: t("app.advisor.sidebar.noConversations").text,
      rename: t("app.advisor.sidebar.rename").text,
      delete: t("app.advisor.sidebar.delete").text,
      deleteConfirm: t("app.advisor.sidebar.deleteConfirm").text,
      closeSidebar: t("app.advisor.sidebar.closeSidebar").text,
    },
    chat: {
      placeholder: t("app.advisor.chat.placeholder").text,
      send: t("app.advisor.chat.send").text,
      thinking: t("app.advisor.chat.thinking").text,
      openingGreeting: t("app.advisor.chat.openingGreeting").text,
      photoRedirect: t("app.advisor.chat.photoRedirect").text,
      nonFarmingRedirect: t("app.advisor.chat.nonFarmingRedirect").text,
    },
    errors: {
      serviceUnavailable: t("app.advisor.errors.serviceUnavailable").text,
      rateLimited: t("app.advisor.errors.rateLimited").text,
      network: t("app.advisor.errors.network").text,
      generic: t("app.advisor.errors.generic").text,
    },
    aria: {
      openSidebar: t("app.advisor.aria.openSidebar").text,
      sendMessage: t("app.advisor.aria.sendMessage").text,
      chatMessages: t("app.advisor.aria.chatMessages").text,
    },
  };
}

/** Flat prop bundle for the client SiteHeader (functions can't cross the RSC boundary). */
export function siteHeaderStrings(t: Translator) {
  return {
    whyAgropioo: t("nav.whyAgropioo").text,
    features: t("nav.features").text,
    howItWorks: t("nav.howItWorks").text,
    vision: t("nav.vision").text,
    signIn: t("nav.signIn").text,
    getEarlyAccess: t("nav.getEarlyAccess").text,
    openMenu: t("nav.openMenu").text,
    closeMenu: t("nav.closeMenu").text,
    languageSwitcher: t("common.languageSwitcherLabel").text,
  };
}
