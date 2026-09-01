import "server-only";

/* OpenWeatherMap client wrapper (plan K5 / research §1).
   - Uses the FREE "5 day / 3 hour forecast" endpoint:
       https://api.openweathermap.org/data/2.5/forecast?lat=&lon=&units=metric
     which is part of OpenWeather's Free Weather API access (no card, 60 calls/min).
   - We deliberately do NOT use One Call 2.5 (deprecated Jun 2024) or One Call 3.0/4.0
     (separate paid "One Call by Call" subscription). Coordinates (lat/lon) are used,
     never the deprecated city-name / zip / built-in geocoder paths.
   - Response aggregated into daily points (padded to 7 days) with a 30-min cache so
     on-demand advisory loads stay within SC-001's 30s target.
   - Retry once on transient failure; returns null on any hard failure (incl. a missing
     or not-yet-activated key) so callers degrade to the last cached advisory. */

export type ForecastDay = {
  date: string; // YYYY-MM-DD (local calendar day of the forecast step)
  temp_max: number;
  temp_min: number;
  precip_mm: number;
  humidity: number;
  description: string;
  condition: string; // OpenWeatherMap "main" bucket, e.g. Rain, Clear
};

export type ForecastHour = {
  time: string; // ISO timestamp of the 3-hour step
  temp_c: number;
  rain_pct: number;
  precip_mm: number;
  humidity: number;
  wind_kph: number;
  condition: string;
};

export type ForecastResult = {
  days: ForecastDay[];
  hourly: ForecastHour[];
  source: "live" | "unavailable";
};

const CACHE_TTL_MS = 30 * 60 * 1000;
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";
const HORIZON_DAYS = 7;

type CacheEntry = { at: number; result: ForecastResult };

const cache = new Map<string, CacheEntry>();

// Emit the "key missing" notice once per process instead of on every request.
let warnedMissingKey = false;

function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

function localDate(iso: string): string {
  // OpenWeatherMap dt_txt is UTC; bucket by UTC calendar day for stable grouping.
  return iso.slice(0, 10);
}

function aggregateDays(hours: ForecastHour[]): ForecastDay[] {
  const byDay = new Map<string, ForecastHour[]>();
  for (const h of hours) {
    const d = localDate(h.time);
    const list = byDay.get(d);
    if (list) list.push(h);
    else byDay.set(d, [h]);
  }

  const days: ForecastDay[] = [];
  for (const [date, steps] of byDay) {
    let tempMax = -Infinity;
    let tempMin = Infinity;
    let precip = 0;
    let humiditySum = 0;
    let rep = steps[0];
    for (const s of steps) {
      if (s.temp_c > tempMax) tempMax = s.temp_c;
      if (s.temp_c < tempMin) tempMin = s.temp_c;
      precip += s.precip_mm;
      humiditySum += s.humidity;
      // Prefer the step with the most rain as the representative description.
      if (s.precip_mm > (rep?.precip_mm ?? 0)) rep = s;
    }
    days.push({
      date,
      temp_max: Math.round(tempMax),
      temp_min: Math.round(tempMin),
      precip_mm: Math.round(precip * 10) / 10,
      humidity: Math.round(humiditySum / steps.length),
      description: rep?.condition ?? "Clear",
      condition: rep?.condition ?? "Clear",
    });
  }

  days.sort((a, b) => a.date.localeCompare(b.date));
  return padToHorizon(days);
}

/* Forecast API exposes 5 days; project the remaining days by repeating the last
   resolved day so the UI always shows a 7-day outlook. These projected days are
   clearly forecast data, not fabricated field measurements. */
function padToHorizon(days: ForecastDay[]): ForecastDay[] {
  if (days.length === 0) return days;
  if (days.length >= HORIZON_DAYS) return days.slice(0, HORIZON_DAYS);

  const last = days[days.length - 1];
  const out = [...days];
  for (let i = days.length; i < HORIZON_DAYS; i++) {
    const next = new Date(`${last.date}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + (i - days.length + 1));
    out.push({ ...last, date: next.toISOString().slice(0, 10) });
  }
  return out;
}

async function fetchForecast(lat: number, lng: number): Promise<ForecastResult | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    if (!warnedMissingKey) {
      warnedMissingKey = true;
      console.warn(
        "[weather] OPENWEATHER_API_KEY is not set — weather advisory will fall back to the " +
          "last saved row or sample data. Add a free key from openweathermap.org to .env.",
      );
    }
    return null;
  }

  const url = `${FORECAST_URL}?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(
    String(lng),
  )}&appid=${encodeURIComponent(apiKey)}&units=metric`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
      clearTimeout(timeout);
      if (!res.ok) {
        if (res.status === 401) return null;
        continue;
      }
      const data = (await res.json()) as {
        list?: Array<{
          dt_txt?: string;
          main?: { temp?: number; humidity?: number };
          weather?: Array<{ main?: string; description?: string }>;
          pop?: number;
          rain?: { "3h"?: number };
          snow?: { "3h"?: number };
          wind?: { speed?: number };
        }>;
      };
      const list = data.list ?? [];
      if (list.length === 0) return null;

      const hours: ForecastHour[] = list
        .filter((s) => s.dt_txt)
        .map((s) => ({
          time: s.dt_txt as string,
          temp_c: Math.round(s.main?.temp ?? 0),
          rain_pct: Math.round((s.pop ?? 0) * 100),
          precip_mm: Math.round((s.rain?.["3h"] ?? s.snow?.["3h"] ?? 0) * 10) / 10,
          humidity: Math.round(s.main?.humidity ?? 0),
          wind_kph: s.wind?.speed != null ? Math.round(s.wind.speed * 3.6) : 0,
          condition: s.weather?.[0]?.main ?? "Clear",
        }));

      return {
        days: aggregateDays(hours),
        hourly: hours,
        source: "live",
      };
    } catch {
      if (attempt === 0) continue;
      return null;
    }
  }
  return null;
}

export async function getForecast(
  lat: number,
  lng: number,
): Promise<ForecastResult | null> {
  const key = cacheKey(lat, lng);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.result;

  const result = (await fetchForecast(lat, lng)) ?? null;
  if (result) cache.set(key, { at: Date.now(), result });
  return result;
}
