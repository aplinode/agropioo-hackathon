"use client";

import { useState, useSyncExternalStore } from "react";

import { splitLocalePrefix, switchedPathname } from "@/lib/i18n/logic";

const CHOICE_COOKIE = "agro_locale";
const DISMISS_COOKIE = "agro_lang_chip_dismissed";

let notifyStoreChange: (() => void) | null = null;

function subscribeToCookies(onStoreChange: () => void): () => void {
  notifyStoreChange = onStoreChange;
  return () => {
    notifyStoreChange = null;
  };
}

function neverShow(): boolean {
  return false;
}

function hasCookie(name: string): boolean {
  return document.cookie.split(";").some((pair) => pair.trim().startsWith(`${name}=`));
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
  notifyStoreChange?.();
}

/** The chip is shown exactly once: English page + no stored choice + not dismissed. */
function shouldShow(): boolean {
  if (splitLocalePrefix(window.location.pathname).locale !== null) return false;
  return !hasCookie(CHOICE_COOKIE) && !hasCookie(DISMISS_COOKIE);
}

/**
 * One-time dismissible suggestion chip for first-time visitors (spec FR-20).
 * Appears only on English pages when no language choice exists yet. The label
 * is intentionally hardcoded Urdu — it is an invitation *into* the Urdu site,
 * not UI chrome, and never renders on localized pages.
 */
export function SuggestionChip() {
  // Cookies are an external store: read reactively via useSyncExternalStore
  // instead of setting state inside an effect (no hydration mismatch, no
  // cascading renders). Writes call back into the store explicitly.
  const visible = useSyncExternalStore(subscribeToCookies, shouldShow, neverShow);
  const [leaving, setLeaving] = useState(false);

  if (!visible) return null;

  const dismiss = () => {
    setCookie(DISMISS_COOKIE, "1");
  };

  const accept = () => {
    if (leaving) return;
    setLeaving(true);
    setCookie(CHOICE_COOKIE, "ur");
    window.location.assign(
      switchedPathname(window.location.pathname, "ur") +
        window.location.search +
        window.location.hash,
    );
  };

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div
        role="status"
        className="flex items-center gap-2 rounded-full border border-agro-sprout bg-agro-paper/95 py-1.5 pe-1.5 ps-5 shadow-lg backdrop-blur"
      >
        <p lang="ur" dir="rtl" className="text-sm font-medium text-agro-ink">
          اردو میں دیکھیں
        </p>
        <button
          type="button"
          onClick={accept}
          disabled={leaving}
          className="inline-flex h-9 cursor-pointer items-center rounded-full bg-agro-canopy px-3.5 text-xs font-semibold text-white transition-colors hover:bg-agro-forest disabled:cursor-wait"
        >
          View in Urdu
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss language suggestion"
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-agro-slate transition-colors hover:bg-agro-mint hover:text-agro-forest"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
