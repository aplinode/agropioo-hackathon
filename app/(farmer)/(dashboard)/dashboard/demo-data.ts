/* Typed demo mock data for the dashboard (UI-only demo build).
   Pakistan-first realism: Pakistani names, Multan/Sahiwal-class locations,
   wheat/cotton/sugarcane/maize, °C. No invented proven results.
   Translatable strings are resolved from the server bundle via getDemoData().
   Static constants are kept for other pages that import them directly. */

import type { DashboardBundle } from "./dashboard-bundle";

export type AlertSeverity = "critical" | "warning" | "info";
export type FarmHealth = "good" | "watch";

export type DemoAlert = {
  id: string;
  severity: AlertSeverity;
  kind: "pest" | "weather" | "price";
  message: string;
  relativeTime: string;
};

export type DemoFarm = {
  id: string;
  name: string;
  location: string;
  acres: number;
  sownOn: string;
  crops: string;
  stage: string;
  health: FarmHealth;
};

export type DemoChecklistItem = {
  id: string;
  label: string;
  href: string;
};

/* ── Static constants (used by other pages directly) ─────────────────── */

export const demoFarmer = {
  firstName: "Ahmad",
  lastName: "Ali",
  initials: "MA",
  location: "Multan, Punjab",
  todayLabel: "Sunday, 23 Aug",
  unreadCount: 5,
  email: "ahmad.ali@agropioo.com",
};

export const demoAdvisory = {
  crop: "Wheat",
  stage: "Vegetative",
  action: "Delay irrigation today",
  why: "Heavy rain is expected this afternoon — your field will get the water naturally.",
};

export const demoSeasonTip = {
  action: "Walk your fields before the rains arrive",
  why: "A slow walk after dry spells shows you which patches drain poorly — note them before sowing.",
};

export const demoWeather = {
  location: "Multan",
  condition: "Cloudy",
  temperatureC: 24,
  highC: 28,
  lowC: 17,
  rainNote: "Rain likely after 2 PM · 80% chance",
};

export const demoAlerts: DemoAlert[] = [
  {
    id: "alert-whitefly",
    severity: "critical",
    kind: "pest",
    message: "Whitefly risk is high on cotton across Multan district this week.",
    relativeTime: "25 min ago",
  },
  {
    id: "alert-rain",
    severity: "warning",
    kind: "weather",
    message: "Rain expected after 2 PM today — postpone any spraying plans.",
    relativeTime: "1 hr ago",
  },
  {
    id: "alert-wheat-price",
    severity: "info",
    kind: "price",
    message: "Wheat prices at Multan mandi are up 4% compared to last week.",
    relativeTime: "3 hrs ago",
  },
];

export const demoFarms: DemoFarm[] = [
  {
    id: "farm-khalilpur",
    name: "Khalilpur Farm",
    location: "Khalilpur, Multan",
    acres: 12.5,
    sownOn: "20 Nov 2025",
    crops: "Wheat",
    stage: "Vegetative",
    health: "good",
  },
  {
    id: "farm-sahiwal",
    name: "Sahiwal Plot",
    location: "Depalpur Road, Sahiwal",
    acres: 8,
    sownOn: "15 May 2026",
    crops: "Cotton",
    stage: "Squaring",
    health: "watch",
  },
  {
    id: "farm-chak62",
    name: "Chak 62 GB",
    location: "Chak 62 GB, Faisalabad",
    acres: 15,
    sownOn: "10 Mar 2026",
    crops: "Sugarcane",
    stage: "Tillering",
    health: "good",
  },
];

export const checklistItems: DemoChecklistItem[] = [
  { id: "checklist-farm", label: "Add your first farm", href: "/farms/new" },
  { id: "checklist-advisor", label: "Ask the advisor once", href: "/advisor" },
  { id: "checklist-detect", label: "Run your first detection", href: "/detect" },
];

export const quickActions = [
  { id: "action-recommend", label: "Recommend crops", href: "/crops", icon: "sprout" },
  { id: "action-record", label: "Add record", href: "/records/new", icon: "clipboard" },
  { id: "action-advisor", label: "Ask advisor", href: "/advisor", icon: "chat" },
  { id: "action-scan", label: "Scan crop", href: "/detect", icon: "camera" },
  { id: "action-prices", label: "Check prices", href: "/prices", icon: "tag" },
] as const;

/* ── Bundle-aware factory (dashboard-view only) ──────────────────────── */

export function getDemoData(bundle: DashboardBundle) {
  const d = bundle.demo;
  const farmer = {
    firstName: demoFarmer.firstName,
    lastName: demoFarmer.lastName,
    initials: demoFarmer.initials,
    location: d.location,
    todayLabel: d.todayLabel,
    unreadCount: demoFarmer.unreadCount,
    email: demoFarmer.email,
  };

  const advisory = {
    crop: d.advisoryCrop,
    stage: d.advisoryStage,
    action: d.advisoryAction,
    why: d.advisoryWhy,
  };

  const seasonTip = {
    action: d.seasonAction,
    why: d.seasonWhy,
  };

  const weather = {
    location: d.weatherLocation,
    condition: d.weatherCondition,
    temperatureC: demoWeather.temperatureC,
    highC: demoWeather.highC,
    lowC: demoWeather.lowC,
    rainNote: d.rainNote,
  };

  const alerts: DemoAlert[] = [
    { ...demoAlerts[0], message: d.alertWhitefly },
    { ...demoAlerts[1], message: d.alertRain },
    { ...demoAlerts[2], message: d.alertPrice },
  ];

  const farms: DemoFarm[] = [
    { ...demoFarms[0], name: d.farm1Name, location: d.farm1Location, crops: d.farm1Crops, stage: d.farm1Stage },
    { ...demoFarms[1], name: d.farm2Name, location: d.farm2Location, crops: d.farm2Crops, stage: d.farm2Stage },
    { ...demoFarms[2], name: d.farm3Name, location: d.farm3Location, crops: d.farm3Crops, stage: d.farm3Stage },
  ];

  const checklistItems: DemoChecklistItem[] = [
    { id: "checklist-farm", label: bundle.addFirstFarm, href: "/farms/new" },
    { id: "checklist-advisor", label: d.checklistAdvisor, href: "/advisor" },
    { id: "checklist-detect", label: d.checklistDetect, href: "/detect" },
  ];

  const quickActions = [
    { id: "action-recommend", label: d.actionRecommend, href: "/crops", icon: "sprout" },
    { id: "action-record", label: d.actionRecord, href: "/records/new", icon: "clipboard" },
    { id: "action-advisor", label: d.actionAdvisor, href: "/advisor", icon: "chat" },
    { id: "action-scan", label: d.actionScan, href: "/detect", icon: "camera" },
    { id: "action-prices", label: d.actionPrices, href: "/prices", icon: "tag" },
  ] as const;

  return { farmer, advisory, seasonTip, weather, alerts, farms, checklistItems, quickActions };
}
