/**
 * Transport cost estimation for market comparisons.
 *
 * Flat per-km rate calibrated to local freight norms for a 40 kg Maund
 * load on a typical Pakistani inter-district truck route. This is a
 * heuristic, not a live logistics quote; it is shown as "estimated"
 * in the UI.
 */

export const TRANSPORT_COST_PER_KM_PKR = 15;

export function estimateTransportCost(distanceKm: number | null | undefined): number | null {
  if (distanceKm == null || Number.isNaN(distanceKm)) return null;
  return Math.round(distanceKm * TRANSPORT_COST_PER_KM_PKR * 100) / 100;
}
