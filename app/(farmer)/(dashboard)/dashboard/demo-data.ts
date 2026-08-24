/* Typed demo mock data for the dashboard (UI-only demo build).
   Pakistan-first realism: Pakistani names, Multan/Sahiwal-class locations,
   wheat/cotton/sugarcane/maize, °C. No invented proven results. */

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

export const demoFarmer = {
  firstName: "Ahmad",
  lastName: "Ali",
  initials: "MA",
  location: "Multan, Punjab",
  /** Static demo date shown beside the location in the header. */
  todayLabel: "Sunday, 23 Aug",
  /** ALL unread notifications — the bell badge reflects this total,
      even when the alerts strip shows only the top 3. */
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
  { id: "action-record", label: "Add record", href: "/records/new", icon: "clipboard" },
  { id: "action-advisor", label: "Ask advisor", href: "/advisor", icon: "chat" },
  { id: "action-scan", label: "Scan crop", href: "/detect", icon: "camera" },
  { id: "action-prices", label: "Check prices", href: "/prices", icon: "tag" },
] as const;
