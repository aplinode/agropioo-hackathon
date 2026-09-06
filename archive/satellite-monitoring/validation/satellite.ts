import { z } from "zod";
import { PAKISTAN_BBOX } from "@/lib/satellite/types";

const MAX_AREA_HA = 500;

const polygonCoordinateSchema = z.tuple([z.number(), z.number()]);
const linearRingSchema = z
  .array(polygonCoordinateSchema)
  .min(4, "A polygon ring needs at least 4 coordinate pairs");
const geoJsonPolygonSchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z.array(linearRingSchema),
});

export const saveBoundarySchema = z.object({
  farmId: z.string().uuid(),
  geojson: geoJsonPolygonSchema.refine(
    (g) => {
      // Ring must be closed: first point === last point
      const ring = g.coordinates[0];
      const first = ring[0];
      const last = ring[ring.length - 1];
      return first[0] === last[0] && first[1] === last[1];
    },
    { message: "Polygon ring must be closed" },
  ),
});

export const updateBoundarySchema = saveBoundarySchema;

export const boundaryIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const farmIdQuerySchema = z.object({
  farmId: z.string().uuid(),
});

export const snapshotsQuerySchema = z.object({
  boundaryId: z.string().uuid(),
  weeks: z.coerce.number().int().min(1).max(52).default(12),
});

export const statusQuerySchema = z.object({
  farmId: z.string().min(1),
});

export type SaveBoundaryInput = z.infer<typeof saveBoundarySchema>;
export type UpdateBoundaryInput = z.infer<typeof updateBoundarySchema>;

/** Compute the area of a GeoJSON polygon in hectares (FR-5.2 — area ≥ 0.01 ha). */
export function bboxAreaHa(geojson: {
  type: "Polygon";
  coordinates: number[][][];
}): number {
  const ring = geojson.coordinates[0];
  let minLng = Infinity,
    minLat = Infinity,
    maxLng = -Infinity,
    maxLat = -Infinity;
  for (const [lng, lat] of ring) {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }
  const meanLatRad = ((minLat + maxLat) / 2) * (Math.PI / 180);
  const width = (maxLng - minLng) * 111320 * Math.cos(meanLatRad);
  const height = (maxLat - minLat) * 110574;
  return (width * height) / 10000;
}

/** Validate that coordinates fall within Pakistan's bounding box. */
export function isWithinPakistan(geojson: {
  type: "Polygon";
  coordinates: number[][][];
}): boolean {
  const [minLng, minLat, maxLng, maxLat] = PAKISTAN_BBOX;
  const ring = geojson.coordinates[0];
  for (const [lng, lat] of ring) {
    if (lng < minLng || lng > maxLng || lat < minLat || lat > maxLat) {
      return false;
    }
  }
  return true;
}

/** Area-based validation guard for boundary submissions. */
export function areaExceedsLimit(areaHa: number): boolean {
  return areaHa > MAX_AREA_HA;
}
