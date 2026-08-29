"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function MapPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, Math.max(map.getZoom(), 10));
  }, [center, map]);
  return null;
}

function DraggableMarker({
  position,
  onDragEnd,
}: {
  position: [number, number];
  onDragEnd: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<L.Marker>(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          onDragEnd(latLng.lat, latLng.lng);
        }
      },
    }),
    [onDragEnd]
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
}

export function FarmMap({
  marker,
  onPickLocation,
}: {
  marker: { lat: number; lng: number };
  onPickLocation: (lat: number, lng: number) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-agro-ink mb-1">
        Farm Location (Google Maps Pin)
      </label>
      <div className="relative h-[320px] w-full overflow-hidden rounded-2xl border border-agro-sprout shadow-sm">
        <MapContainer
          center={[marker.lat, marker.lng]}
          zoom={8}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; Google Maps'
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          />
          <MapRecenter center={[marker.lat, marker.lng]} />
          <MapPicker onPick={onPickLocation} />
          <DraggableMarker
            position={[marker.lat, marker.lng]}
            onDragEnd={onPickLocation}
          />
        </MapContainer>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-agro-slate">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        Click or drag pin on map to set exact farm position
      </p>
    </div>
  );
}
