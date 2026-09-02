const PHOTON_BASE = "https://photon.komoot.io";

export interface PhotonResult {
  display_name: string;
  lat: number;
  lon: number;
  address?: Record<string, string>;
}

function buildDisplayName(props: Record<string, unknown>): string {
  const parts = [
    props.name,
    props.street,
    props.house_number ? `${props.house_number} ${props.street}` : undefined,
    props.city_district || props.city || props.town || props.village || props.county,
    props.state,
    props.country,
  ]
    .filter(Boolean)
    .map((s) => String(s));

  return parts.join(", ") || "Unknown location";
}

function toPhotonResult(
  feature: Record<string, unknown>
): PhotonResult | null {
  const geometry = feature.geometry as Record<string, unknown> | undefined;
  const props = (feature.properties as Record<string, unknown>) || {};

  if (!geometry || geometry.type !== "Point") return null;

  const coords = geometry.coordinates as [number, number];
  return {
    display_name: buildDisplayName(props),
    lat: coords[1],
    lon: coords[0],
    address: props as Record<string, string>,
  };
}

export async function photonSearch(
  query: string,
  limit = 6
): Promise<PhotonResult[]> {
  const url = new URL(`${PHOTON_BASE}/api/`);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) return [];

  const data = (await res.json()) as Record<string, unknown>;
  const features = (data.features || []) as Array<Record<string, unknown>>;

  return features.map(toPhotonResult).filter(Boolean) as PhotonResult[];
}

export async function photonReverse(
  lat: number,
  lon: number
): Promise<PhotonResult | null> {
  const url = new URL(`${PHOTON_BASE}/reverse`);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as Record<string, unknown>;
  const features = (data.features || []) as Array<Record<string, unknown>>;

  if (features.length === 0) return null;
  return toPhotonResult(features[0]);
}
