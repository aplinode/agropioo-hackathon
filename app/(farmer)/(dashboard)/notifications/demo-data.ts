import type { AlertKind } from "./notifications-bundle";

export type DemoNotification = {
  id: string;
  kind: AlertKind;
  severity: "critical" | "warning" | "info";
  message: string;
  relativeTime: string;
};

export const demoNotifications: DemoNotification[] = [
  {
    id: "1",
    kind: "price",
    severity: "warning",
    message: "Wheat prices in Multan rose 4% this week. Consider selling if storage is limited.",
    relativeTime: "2h ago",
  },
  {
    id: "2",
    kind: "weather",
    severity: "critical",
    message: "Heavy rain expected in Lahore tomorrow. Secure harvested cotton bales.",
    relativeTime: "5h ago",
  },
  {
    id: "3",
    kind: "pest",
    severity: "info",
    message: "Pink bollworm risk is moderate in Bahawalpur cotton fields this week.",
    relativeTime: "1d ago",
  },
];
