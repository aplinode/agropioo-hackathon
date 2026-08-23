/* Typed demo data for the notifications screen (UI-only demo build).
   The three dashboard alerts come first — same ids, so both screens
   stay consistent — plus two older items to reach the 5-unread total
   shown by the dashboard bell. */

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertKind = "pest" | "weather" | "price";

export type DemoNotification = {
  id: string;
  severity: AlertSeverity;
  kind: AlertKind;
  message: string;
  relativeTime: string;
};

export const demoNotifications: DemoNotification[] = [
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
  {
    id: "alert-cotton-price",
    severity: "warning",
    kind: "price",
    message:
      "Cotton (phutti) rates dipped Rs 250 per maund on fresh arrivals at Sahiwal mandi.",
    relativeTime: "Yesterday",
  },
  {
    id: "alert-humidity",
    severity: "info",
    kind: "weather",
    message:
      "Humidity stays high this week — watch for rust after the rain passes.",
    relativeTime: "Yesterday",
  },
];
