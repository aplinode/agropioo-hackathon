/**
 * Typed translation bundle for the shell (sidebar + bottom tabs).
 * Built server-side and passed as props to client components —
 * avoids "use server" boundaries and keeps client bundles small.
 */

export type ShellBundle = {
  nav: {
    dashboard: string;
    farms: string;
    advisor: string;
    detect: string;
    prices: string;
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
};
