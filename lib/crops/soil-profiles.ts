import { query } from "@/lib/db";
import type { SoilType } from "./api-types";

/** Fallback when the farmer picks "other" AND the district is unknown. */
export const NATIONAL_DEFAULT_SOIL: SoilType = "loamy";

type SoilProfileRow = {
  dominant_soil_type: SoilType;
  secondary_soil_type: SoilType | null;
  province: string;
};

/** District → dominant soil type lookup for the "Not sure / Other" fallback. */
export async function getDistrictSoilProfile(
  district: string,
): Promise<SoilProfileRow | null> {
  const row = await query<SoilProfileRow>(
    `SELECT dominant_soil_type, secondary_soil_type, province
     FROM soil_profiles WHERE lower(district) = lower($1)
     ORDER BY created_at DESC LIMIT 1`,
    [district],
  );
  return row[0] ?? null;
}

export type ResolvedSoil = {
  soilType: SoilType;
  isRegionalDefault: boolean;
  note: "exact" | "regional" | "national";
};

/**
 * Resolves the effective soil type for scoring:
 * - declared soil (not "other") → used as-is.
 * - "other" → district lookup; fall back to national default if district unknown.
 */
export async function resolveSoilType(
  declaredSoil: SoilType,
  district: string,
): Promise<ResolvedSoil> {
  if (declaredSoil !== "other") {
    return { soilType: declaredSoil, isRegionalDefault: false, note: "exact" };
  }
  const profile = await getDistrictSoilProfile(district);
  if (profile) {
    return { soilType: profile.dominant_soil_type, isRegionalDefault: true, note: "regional" };
  }
  return { soilType: NATIONAL_DEFAULT_SOIL, isRegionalDefault: true, note: "national" };
}
