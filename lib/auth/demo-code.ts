/* Demo-code transport (FR17 data path): APIs attach demoCode ONLY when SMTP
   is unconfigured AND DEMO_MODE=true. Forms stash it here so /verify can
   render the clearly-labelled banner. In production this key is never
   written, so nothing renders anywhere. sessionStorage only — passes stay
   httpOnly; this is a display-only string that dies with the tab. */

const KEY = "agro-demo-code";

export function stashDemoCode(code: string | undefined | null): void {
  if (!code) return;
  try {
    sessionStorage.setItem(KEY, code);
  } catch {
    // Storage unavailable — banner simply won't render.
  }
}

export function peekDemoCode(): string | undefined {
  try {
    return sessionStorage.getItem(KEY) ?? undefined;
  } catch {
    return undefined;
  }
}
