/**
 * Domain types and shared constants for the satellite monitoring feature.
 */
import type { Feature, Polygon } from "geojson";

/* ── Core domain types ─────────────────────────────────────────────── */

export interface FieldBoundary {
  id: string;
  farmId: string;
  accountId: string;
  geojson: GeoJsonPolygon;
  areaHa: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NdviSnapshot {
  id: string;
  boundaryId: string;
  accountId: string;
  snapshotDate: string;
  meanNdvi: number;
  cloudCover: boolean;
  imageUrl: string;
  areaHa?: number;
  createdAt: Date;
}

export interface NdviJob {
  id: string;
  boundaryId: string;
  accountId: string;
  status: "pending" | "processing" | "completed" | "failed";
  errorMessage?: string | null;
  createdAt: Date;
  completedAt?: Date | null;
}

/* ── API response shapes ──────────────────────────────────────────── */

export interface SentinelScene {
  id: string;
  cloudCover: number;
  datetime: string;
  bbox: [number, number, number, number];
}

export interface StatusData {
  status: "no_boundary" | "idle" | "pending" | "processing" | "completed" | "failed";
  job: NdviJob | null;
}

/* ── GeoJSON ──────────────────────────────────────────────────────── */

export type GeoJsonPolygon = {
  type: "Polygon";
  coordinates: number[][][];
};

/* ── Constants ────────────────────────────────────────────────────── */

export const PAKISTAN_BBOX: [number, number, number, number] = [61, 22, 75, 37];

export const NDVI_LEGEND_BANDS = [
  { min: -1, max: 0, color: "#2c001e" },
  { min: 0, max: 0.1, color: "#3c0033" },
  { min: 0.1, max: 0.2, color: "#4c004a" },
  { min: 0.2, max: 0.3, color: "#5c0061" },
  { min: 0.3, max: 0.4, color: "#6c0078" },
  { min: 0.4, max: 0.5, color: "#7c008f" },
  { min: 0.5, max: 0.6, color: "#8d00a6" },
  { min: 0.6, max: 0.7, color: "#9e00bd" },
  { min: 0.7, max: 0.8, color: "#af00d4" },
  { min: 0.8, max: 1, color: "#c000eb" },
] as const;

/* FR-5.1 — health classification for NDVI values */
export function ndviHealthLabel(ndvi: number): "stressed" | "moderate" | "healthy" {
  if (ndvi < 0.3) return "stressed";
  if (ndvi < 0.6) return "moderate";
  return "healthy";
}

export function ndviHealthColor(ndvi: number): string {
  return NDVI_LEGEND_BANDS.find((b) => ndvi >= b.min && ndvi < b.max)?.color ?? "#2c001e";
}

export function bboxFromGeojson(geojson: GeoJsonPolygon): [number, number, number, number] {
  const ring = geojson.coordinates[0];
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const [lng, lat] of ring) {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }
  return [minLng, minLat, maxLng, maxLat] as [number, number, number, number];
}

export function featureToGeojson(feature: Feature<Polygon>): GeoJsonPolygon {
  return { type: "Polygon", coordinates: feature.geometry.coordinates };
}
