/**
 * Typed translation bundle for the shell (sidebar + bottom tabs).
 * Built server-side and passed as props to client components —
 * avoids "use server" boundaries and keeps client bundles small.
 */

export type ShellBundle = {
  nav: {
    dashboard: string;
    farms: string;
    profitLoss: string;
    advisor: string;
    detect: string;
    pest: string;
    crops: string;
    prices: string;
    weather: string;
    notifications: string;
    settings: string;
    more: string;
  };
  signOut: string;
  aria: {
    farmerTools: string;
    currentPage: string;
  };
  productOf: string;
  builtForPakistan: string;
  /** Unread weather-alert count (weather_alerts.read_at IS NULL) for the badge. */
  alertsUnread: number;
};
