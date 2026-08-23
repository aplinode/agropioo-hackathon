import { notFound } from "next/navigation";

/**
 * Catch-all under every locale prefix: unmatched paths like /ur/nonexistent
 * throw notFound() here so they render through app/[locale]/not-found.tsx
 * with the right <html lang>/<dir> chrome (spec FR-5, AC-5).
 */
export default function LocaleCatchAll() {
  notFound();
}
