import type { NdviJob } from "@/lib/satellite/types";

export interface FarmOption {
  id: string;
  name: string;
  lat: number;
  lng: number;
  district: string;
}

export interface BoundaryData {
  id: string;
  geojson: { type: "Polygon"; coordinates: number[][][] };
  areaHa: number;
  updatedAt: string;
}

export interface SnapshotData {
  id: string;
  snapshotDate: string;
  meanNdvi: number;
  cloudCover: boolean;
  imageUrl: string;
  areaHa: number | null;
}

export interface StatusData {
  status: "no_boundary" | "idle" | "pending" | "processing" | "completed" | "failed";
  job: {
    id: string;
    status: NdviJob["status"];
    createdAt: string;
    completedAt: string | null;
    errorMessage?: string | null;
  } | null;
}
