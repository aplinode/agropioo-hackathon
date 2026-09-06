"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, ImageOverlay, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

import type { BoundaryData, SnapshotData } from "./satellite-types";
import type { SatelliteBundle } from "./satellite-bundle";
import { PAKISTAN_BBOX } from "@/lib/satellite/types";

interface SatelliteMapProps {
  farmCenter: L.LatLngExpression;
  boundary: BoundaryData | null;
  drawnGeojson: { type: "Polygon"; coordinates: number[][][] } | null;
  onBoundaryChange: (geojson: { type: "Polygon"; coordinates: number[][][] } | null) => void;
  drawMode: boolean;
  onCancelDraw: () => void;
  overlaySnapshot: SnapshotData | null;
  bundle: SatelliteBundle;
}

const OSM_TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

type GeoJsonPolygon = { type: "Polygon"; coordinates: number[][][] };

function polygonFromLayer(layer: L.Layer): GeoJsonPolygon | null {
  const path = layer as unknown as L.Layer & {
    toGeoJSON(precision?: number | false): {
      type: string;
      geometry: { type: string; coordinates: number[][][] };
    };
  };
  if (typeof path.toGeoJSON !== "function") return null;
  const feature = path.toGeoJSON(15);
  if (feature.geometry?.type === "Polygon") {
    return {
      type: "Polygon",
      coordinates: feature.geometry.coordinates,
    };
  }
  return null;
}

function DrawHandler({
  drawMode,
  onBoundaryChange,
}: {
  drawMode: boolean;
  onBoundaryChange: (geojson: GeoJsonPolygon | null) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const pmMap = map as unknown as {
      pm: {
        enableDraw: (shape: string, opts?: Record<string, unknown>) => void;
        disableDraw: () => void;
        disable: () => void;
        on: (event: string, cb: (e: { layer: L.Layer }) => void) => void;
        off: (event: string, cb: (e: { layer: L.Layer }) => void) => void;
      };
    };

    if (drawMode) {
      pmMap.pm.enableDraw("Polygon", { allowPoorPixelPainting: true });
    }

    function onCreate(e: { layer: L.Layer }) {
      const geojson = polygonFromLayer(e.layer);
      if (geojson) onBoundaryChange(geojson);
      pmMap.pm.disableDraw();
    }

    function onRemove() {
      onBoundaryChange(null);
    }

    pmMap.pm.on("pm:create", onCreate);
    pmMap.pm.on("pm:remove", onRemove);

    return () => {
      pmMap.pm.off("pm:create", onCreate);
      pmMap.pm.off("pm:remove", onRemove);
      pmMap.pm.disableDraw();
      pmMap.pm.disable();
    };
  }, [drawMode, map, onBoundaryChange]);

  return null;
}

function GeoJSONBoundary({ geojson }: { geojson: GeoJsonPolygon }) {
  const map = useMap();

  useEffect(() => {
    const layer = L.geoJSON(geojson as unknown as GeoJSON.GeoJsonObject, {
      style: {
        color: "#16a34a",
        weight: 3,
        fillColor: "#16a34a",
        fillOpacity: 0.15,
      },
    });
    layer.addTo(map);
    map.fitBounds(layer.getBounds().pad(0.2));

    return () => {
      map.removeLayer(layer);
    };
  }, [map, geojson]);

  return null;
}

export default function SatelliteMap({
  farmCenter,
  boundary,
  drawnGeojson: _drawnGeojson,
  onBoundaryChange,
  drawMode,
  onCancelDraw: _onCancelDraw,
  overlaySnapshot,
  bundle,
}: SatelliteMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  const overlayBounds: L.LatLngBoundsExpression | undefined = overlaySnapshot?.imageUrl
    ? ([
        [PAKISTAN_BBOX[1], PAKISTAN_BBOX[0]],
        [PAKISTAN_BBOX[3], PAKISTAN_BBOX[2]],
      ] as L.LatLngBoundsExpression)
    : undefined;

  return (
    <div className="relative h-72 w-full rounded-xl border border-agro-clay bg-agro-mint/10">
      <MapContainer
        ref={mapRef}
        center={farmCenter}
        zoom={13}
        style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}
        scrollWheelZoom={false}
      >
        <TileLayer url={OSM_TILES} attribution={OSM_ATTR} />

        {drawMode && (
          <DrawHandler drawMode={drawMode} onBoundaryChange={onBoundaryChange} />
        )}

        {overlaySnapshot && overlaySnapshot.imageUrl && overlayBounds && (
          <ImageOverlay url={overlaySnapshot.imageUrl} bounds={overlayBounds} opacity={0.7} />
        )}

        {boundary && <GeoJSONBoundary geojson={boundary.geojson} />}
      </MapContainer>

      {drawMode && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-xl bg-agro-canopy px-4 py-2 text-sm font-medium text-white shadow-lg">
          {bundle.drawing}
        </div>
      )}
    </div>
  );
}
