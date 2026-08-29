"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { APP_LOCALE_COOKIE, LOCALES, LOCALE_REGISTRY, type Locale } from "@/lib/i18n/config";
import { splitLocalePrefix, switchedPathname } from "@/lib/i18n/logic";
import { CheckIcon, LanguagesIcon } from "./icons";

/**
 * Full page load on switch (spec edge case: unsaved input loss accepted):
 * a client-side push would not reliably re-render <html lang>/<dir>/fonts
 * when only the [locale] param changes.
 */
function navigateToLocale(target: Locale) {
  if (typeof window === "undefined") return;
  window.location.assign(
    switchedPathname(window.location.pathname, target) +
      window.location.search +
      window.location.hash,
  );
}

/** Remembers the explicit choice (FR-21); the cookie never overrides URLs. */
function persistChoice(target: Locale) {
  document.cookie = `${APP_LOCALE_COOKIE}=${target}; path=/; max-age=31536000; samesite=lax`;
}

export function LanguageSwitcher({
  label,
  currentLocale,
}: {
  label: string;
  /** App mode (dashboard-i18n FR-3): the server passes the cookie-resolved
   * locale — bare app URLs carry no slug, so URL parsing would always read
   * "en". Switching then reloads the SAME path; the group layout re-emits
   * <html> from the freshly written cookie. */
  currentLocale?: Locale;
}) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const currentSlug = currentLocale ?? splitLocalePrefix(pathname).locale;
  const current = LOCALE_REGISTRY[currentSlug ?? "en"];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const choose = useCallback((target: Locale) => {
    if (target === current.code || leaving) return;
    setLeaving(true);
    persistChoice(target);
    if (currentLocale) {
      // App mode: the cookie updated; a same-path full reload lets the
      // server re-read it and re-emit <html lang/dir/fonts> (ADR 0004).
      window.location.assign(window.location.pathname + window.location.search + window.location.hash);
    } else {
      navigateToLocale(target);
    }
  }, [current.code, leaving, currentLocale]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className="inline-flex h-11 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border border-agro-clay bg-white/70 px-4 text-sm font-semibold text-agro-forest transition-colors hover:bg-agro-mint"
      >
        <LanguagesIcon size={18} />
        <span lang={current.htmlLang}>{current.nativeName}</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label={label}
          aria-busy={leaving}
          className="absolute end-0 z-[70] mt-2 w-60 max-w-[calc(100vw-2rem)] rounded-2xl border border-agro-sprout bg-agro-paper p-1.5 shadow-xl"
        >
          {LOCALES.map((code) => {
            const entry = LOCALE_REGISTRY[code];
            const active = entry.code === current.code;
            return (
              <button
                key={code}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                disabled={leaving}
                lang={entry.htmlLang}
                onClick={() => choose(entry.code)}
                className={`flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3.5 py-2 text-start text-sm font-medium transition-colors ${
                  active
                    ? "bg-agro-mint font-semibold text-agro-canopy"
                    : "text-agro-ink hover:bg-agro-mint"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  {active && <CheckIcon size={16} className="shrink-0 text-agro-canopy" />}
                  <span lang={entry.htmlLang}>{entry.nativeName}</span>
                </span>
                <span lang="en" dir="ltr" className="shrink-0 text-xs text-agro-cloud">
                  {entry.englishName}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
