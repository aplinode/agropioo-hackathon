/**
 * Copernicus Sentinel-2 data access.
 *
 * Uses the Copernicus Data Space Ecosystem STAC API to:
 *  - Search for the clearest Sentinel-2 scene over a bbox in the last N days
 *  - Download individual band assets (16-bit GeoTIFF)
 *
 * Sentinel-2 L2A bands (10m resolution):
 *   B02 = Blue   (10m)
 *   B03 = Green  (10m)
 *   B04 = Red    (10m)
 *   B08 = NIR    (10m)
 *
 * NDVI = (NIR − Red) / (NIR + Red)
 */

const STAC_API = "https://zipper.copernicus.eu/stac";
const SENTINEL_COLLECTION = "sentinel-2-l2a";

interface StacAsset {
  href: string;
  type: string;
  title?: string;
}

interface StacItem {
  id: string;
  properties: {
    cloud_cover: number;
    datetime: string;
  };
  assets: Record<string, StacAsset>;
}

async function stacFetch(path: string): Promise<unknown> {
  const res = await fetch(`${STAC_API}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.COPERNICUS_API_KEY ?? ""}`,
    },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    throw new Error(`STAC request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function findClearScene(
  geojson: { type: "Polygon"; coordinates: number[][][] },
  maxCloudCover = 0.3,
  daysBack = 14,
) {
  const ring = geojson.coordinates[0];
  const lngs = ring.map((c) => c[0]);
  const lats = ring.map((c) => c[1]);
  const bbox: [number, number, number, number] = [
    Math.min(...lngs),
    Math.min(...lats),
    Math.max(...lngs),
    Math.max(...lats),
  ];

  const now = new Date();
  const past = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  const start = past.toISOString().split("T")[0];
  const end = now.toISOString().split("T")[0];
  const datetime = `${start}/${end}`;

  const searchReq = {
    collections: [SENTINEL_COLLECTION],
    bbox,
    datetime,
    limit: 10,
  };

  const res = await fetch(`${STAC_API}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.COPERNICUS_API_KEY ?? ""}`,
    },
    body: JSON.stringify(searchReq),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`STAC search failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as { features: StacItem[] };
  const items = data.features;

  const clear = items
    .filter((item) => item.properties.cloud_cover <= maxCloudCover * 100)
    .sort((a, b) => a.properties.cloud_cover - b.properties.cloud_cover);

  if (clear.length === 0) return null;

  const best = clear[0];
  return {
    id: best.id,
    cloudCover: best.properties.cloud_cover / 100,
    datetime: best.properties.datetime,
    bbox,
  };
}

export async function downloadBand(
  sceneId: string,
  band: "B04" | "B08",
  bbox: [number, number, number, number],
): Promise<Buffer> {
  const item = (await stacFetch(
    `/collections/${SENTINEL_COLLECTION}/items/${sceneId}`,
  )) as StacItem;

  const assetKey = band;
  const asset = item.assets[assetKey];
  if (!asset) {
    throw new Error(`No ${assetKey} asset for scene ${sceneId}`);
  }

  const res = await fetch(asset.href, {
    headers: {
      Authorization: `Bearer ${process.env.COPERNICUS_API_KEY ?? ""}`,
    },
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`Band download failed: ${res.status} ${res.statusText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
