/**
 * Typed translation bundle for the notifications feature.
 */
export type AlertKind = "pest" | "weather" | "price";

export type NotificationsBundle = {
  alertsHeading: string;
  noAlerts: string;
  viewAllAlerts: string;
};
