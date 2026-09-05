"use client";

import { useEffect, useState, useCallback } from "react";
import { PlusIcon, XIcon, CheckIcon, RefreshCwIcon } from "@/components/icons";
import type { SatelliteBundle } from "./satellite-bundle";
import type { FarmOption, BoundaryData, SnapshotData, StatusData } from "./satellite-types";
import SatelliteMap from "./satellite-map";
import NdviLegend from "./ndvi-legend";
import NdviStatsCard from "./ndvi-stats-card";
import HistoryStrip from "./history-strip";
import { NDVI_LEGEND_BANDS } from "@/lib/satellite/types";

type GeoJsonPolygon = { type: "Polygon"; coordinates: number[][][] };

interface SatelliteViewProps {
  bundle: SatelliteBundle;
  farms: FarmOption[];
}

export default function SatelliteView({ bundle, farms }: SatelliteViewProps) {
  const [selectedFarm, setSelectedFarm] = useState<FarmOption | null>(
    farms.length > 0 ? farms[0] : null,
  );
  const [boundary, setBoundary] = useState<BoundaryData | null>(null);
  const [drawnGeojson, setDrawnGeojson] = useState<GeoJsonPolygon | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [snapshots, setSnapshots] = useState<SnapshotData[]>([]);
  const [status, setStatus] = useState<StatusData["status"]>("no_boundary");
  const [activeJob, setActiveJob] = useState<StatusData["job"] | null>(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState<SnapshotData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const computeAreaHa = useCallback((geojson: GeoJsonPolygon): number => {
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
  }, []);

  const fetchBoundary = useCallback(async (farmId: string) => {
    const res = await fetch(`/api/satellite/boundaries?farmId=${farmId}`);
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      if (res.status === 404) return { ok: false as const, noFarm: true };
      throw new Error(err?.error?.message || "Failed to load boundary");
    }
    const data = await res.json() as { boundary: BoundaryData | null };
    return { ok: true as const, boundary: data.boundary };
  }, []);

  const fetchStatus = useCallback(async (farmId: string) => {
    const res = await fetch(`/api/satellite/snapshots/status?farmId=${farmId}`);
    if (!res.ok) throw new Error("Failed to load status");
    const data = await res.json();
    return data as StatusData;
  }, []);

  const fetchSnapshots = useCallback(async (boundaryId: string) => {
    const res = await fetch(`/api/satellite/snapshots?boundaryId=${boundaryId}&weeks=12`);
    if (!res.ok) throw new Error("Failed to load snapshots");
    const data = await res.json();
    return data.snapshots as SnapshotData[];
  }, []);

  const loadFarmData = useCallback(
    async (farmId: string) => {
      try {
        const [boundaryData, statusData] = await Promise.all([
          fetchBoundary(farmId),
          fetchStatus(farmId),
        ]);

        if (boundaryData.ok) {
          setError(null);
          setBoundary(boundaryData.boundary);
          setDrawnGeojson(null);
          setDrawMode(false);
        } else if (boundaryData.noFarm) {
          setError(bundle.errorNoFarm);
        }

        setStatus(statusData.status);
        setActiveJob(statusData.job);

        if (boundaryData.ok && boundaryData.boundary) {
          const snaps = await fetchSnapshots(boundaryData.boundary.id);
          setSnapshots(snaps);
          if (snaps.length > 0 && !selectedSnapshot) {
            setSelectedSnapshot(snaps[0]);
          }
        } else {
          setSnapshots([]);
          setSelectedSnapshot(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    },
    [bundle.errorNoFarm, fetchBoundary, fetchStatus, fetchSnapshots, selectedSnapshot],
  );

  useEffect(() => {
    if (!selectedFarm) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loadFarmData awaits before setState
    void loadFarmData(selectedFarm.id);
  }, [selectedFarm, loadFarmData]);

  useEffect(() => {
    let poll: NodeJS.Timeout | undefined;
    if (activeJob && (activeJob.status === "pending" || activeJob.status === "processing")) {
      poll = setInterval(() => {
        if (selectedFarm) {
          void fetchStatus(selectedFarm.id).then((data) => {
            setStatus(data.status);
            setActiveJob(data.job);
            if (data.status !== "pending" && data.status !== "processing") {
              void loadFarmData(selectedFarm.id);
            }
          }).catch(() => {});
        }
      }, 8000);
    }
    return () => {
      if (poll) clearInterval(poll);
    };
  }, [activeJob, selectedFarm, loadFarmData, fetchStatus]);

  const farmCenter: L.LatLngExpression = selectedFarm
    ? ([selectedFarm.lat, selectedFarm.lng] as L.LatLngExpression)
    : ([27.5, 68] as L.LatLngExpression);

  const activeBoundary = boundary ?? (drawnGeojson
    ? {
        id: "draft",
        geojson: drawnGeojson,
        areaHa: computeAreaHa(drawnGeojson),
        updatedAt: new Date().toISOString(),
      }
    : null);

  const handleSave = async () => {
    if (!selectedFarm || !drawnGeojson) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/satellite/boundaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmId: selectedFarm.id,
          geojson: drawnGeojson,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        const msg = err?.error?.message || "Failed to save boundary";
        setError(msg);
        setIsSaving(false);
        return;
      }

      await res.json();
      setDrawMode(false);
      setDrawnGeojson(null);
      await loadFarmData(selectedFarm.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!boundary) return;
    if (!confirm(bundle.clearBoundaryBtn)) return;
    try {
      const res = await fetch(`/api/satellite/boundaries/${boundary.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete boundary");
      setBoundary(null);
      setDrawnGeojson(null);
      setSnapshots([]);
      setSelectedSnapshot(null);
      setStatus("no_boundary");
      setActiveJob(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const handleRefreshStatus = async () => {
    if (!selectedFarm) return;
    await loadFarmData(selectedFarm.id);
  };

  if (!selectedFarm) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-canopy">
          {bundle.eyebrow}
        </p>
        <h1 className="mt-2 display-heading text-3xl font-semibold text-agro-forest sm:text-4xl">
          {bundle.title}
        </h1>
        <p className="mt-3 text-agro-slate">{bundle.description}</p>

        <div className="mt-8">
          <label className="block font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-canopy">
            {bundle.farmSelectorLabel}
          </label>
          <select
            className="mt-2 block w-full rounded-xl border border-agro-clay px-3 py-2 text-agro-ink focus:border-agro-leaf focus:ring-1 focus:ring-agro-leaf"
            value=""
            onChange={(e) => {
              const farm = farms.find((f) => f.id === e.target.value);
              if (farm) setSelectedFarm(farm);
            }}
          >
            <option value="" disabled>
              {bundle.selectFarmPrompt}
            </option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {farms.length === 0 && (
          <p className="mt-4 text-sm text-agro-slate">{bundle.noFarms}</p>
        )}
      </div>
    );
  }

  const showStats = boundary && !drawMode && status === "idle";
  const latestSnapshot = snapshots[0];
  const statsMeanNdvi = latestSnapshot?.meanNdvi ?? null;
  const statsCloudCover = latestSnapshot?.cloudCover ?? true;
  const statsDate = latestSnapshot?.snapshotDate ?? null;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-canopy">
            {bundle.eyebrow}
          </p>
          <h1 className="display-heading text-2xl font-semibold text-agro-forest">
            {bundle.title}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setSelectedFarm(null)}
          className="rounded-lg bg-agro-mint px-3 py-1.5 text-xs font-medium text-agro-canopy hover:bg-agro-sprout"
        >
          Change farm
        </button>
      </div>

      <select
        className="block w-full rounded-xl border border-agro-clay px-3 py-2 text-agro-ink focus:border-agro-leaf focus:ring-1 focus:ring-agro-leaf"
        value={selectedFarm.id}
        onChange={(e) => {
          const farm = farms.find((f) => f.id === e.target.value);
          if (farm) setSelectedFarm(farm);
        }}
      >
        {farms.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>

      {error && (
        <div className="rounded-xl border border-agro-error/20 bg-agro-error/5 px-4 py-3 text-sm text-agro-error">
          {error}
          {error === bundle.errorServiceUnavailable && (
            <button
              type="button"
              onClick={handleRefreshStatus}
              className="ml-2 underline"
            >
              {bundle.retry}
            </button>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-agro-slate">
            {bundle.eyebrow}
          </h2>
          <div className="flex items-center gap-2">
            {boundary && !drawMode && (
              <button
                type="button"
                onClick={() => setDrawMode(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-sm font-medium text-agro-ink shadow-sm ring-1 ring-agro-clay hover:bg-agro-mint"
              >
                <PlusIcon size={16} /> {bundle.drawBoundaryBtn}
              </button>
            )}
            {boundary && !drawMode && (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-sm font-medium text-agro-error shadow-sm ring-1 ring-agro-clay hover:bg-agro-error/5"
              >
                <XIcon size={16} /> {bundle.clearBoundaryBtn}
              </button>
            )}
            {drawMode && !drawnGeojson && (
              <button
                type="button"
                onClick={() => setDrawMode(false)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-agro-mint px-3 py-1.5 text-sm font-medium text-agro-canopy"
              >
                <XIcon size={16} /> {bundle.cancelDrawBtn}
              </button>
            )}
            {drawnGeojson && drawMode && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-agro-canopy px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-agro-leaf disabled:opacity-50"
              >
                <CheckIcon size={16} /> {isSaving ? bundle.savingBoundary : bundle.saveBoundaryBtn}
              </button>
            )}
            {!boundary && !drawnGeojson && !drawMode && (
              <button
                type="button"
                onClick={() => setDrawMode(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-agro-canopy px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-agro-leaf"
              >
                <PlusIcon size={16} /> {bundle.drawBoundaryBtn}
              </button>
            )}
            {status === "idle" && boundary && (
              <button
                type="button"
                onClick={handleRefreshStatus}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-sm font-medium text-agro-ink shadow-sm ring-1 ring-agro-clay hover:bg-agro-mint"
              >
                <RefreshCwIcon size={16} /> {bundle.refreshStatus}
              </button>
            )}
          </div>
        </div>

        {drawMode && !drawnGeojson && (
          <p className="text-xs text-agro-slate">{bundle.drawInstructions}</p>
        )}

        {(status === "pending" || status === "processing") && activeJob && (
          <div className="rounded-2xl border border-agro-clay bg-white p-5 shadow-sm">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.220em] text-agro-slate">
              {bundle.processingTitle}
            </h3>
            <p className="mt-1 text-sm text-agro-ink">{bundle.processingBody}</p>
            <p className="mt-2 text-xs text-agro-slate">
              {bundle.jobProcessing} — {activeJob.createdAt?.slice(0, 10)}
            </p>
          </div>
        )}

        {status === "failed" && activeJob && (
          <div className="rounded-2xl border border-agro-error/20 bg-agro-error/5 p-5 shadow-sm">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.220em] text-agro-error">
              {bundle.jobFailed}
            </h3>
            <p className="mt-1 text-sm text-agro-ink">{bundle.jobFailedBody}</p>
            {activeJob.errorMessage && (
              <p className="mt-1 text-xs text-agro-slate">{activeJob.errorMessage}</p>
            )}
            <button
              type="button"
              onClick={handleRefreshStatus}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-agro-canopy px-3 py-1.5 text-sm font-medium text-white hover:bg-agro-leaf"
            >
              <RefreshCwIcon size={16} /> {bundle.retry}
            </button>
          </div>
        )}

        <SatelliteMap
          farmCenter={farmCenter}
          boundary={boundary}
          drawnGeojson={drawnGeojson}
          onBoundaryChange={setDrawnGeojson}
          drawMode={drawMode}
          onCancelDraw={() => {
            setDrawMode(false);
            setDrawnGeojson(null);
          }}
          overlaySnapshot={selectedSnapshot}
          bundle={bundle}
        />
      </div>

      {showStats && latestSnapshot && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-agro-clay bg-white p-5 shadow-sm">
            <NdviStatsCard
              bundle={bundle}
              meanNdvi={statsMeanNdvi}
              snapshotDate={statsDate}
              cloudCover={statsCloudCover}
              areaHa={activeBoundary?.areaHa ?? 0}
            />
            <div className="mt-4">
              <NdviLegend bands={NDVI_LEGEND_BANDS} />
            </div>
          </div>

          <HistoryStrip
            bundle={bundle}
            snapshots={snapshots}
            onSelect={(snap) => setSelectedSnapshot(snap)}
            selectedId={selectedSnapshot?.id ?? null}
          />
        </div>
      )}
    </div>
  );
}
