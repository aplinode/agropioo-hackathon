export type WeatherSnapshot = {
  condition: string | null;
  temp_c: number | null;
  humidity: number | null;
  wind_kph: number | null;
  fetched_at: string | null;
};

const DEFAULT_SNAPSHOT: WeatherSnapshot = {
  condition: null,
  temp_c: null,
  humidity: null,
  wind_kph: null,
  fetched_at: null,
};

export async function fetchCurrentWeather(lat: number, lng: number, date?: string): Promise<WeatherSnapshot> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return DEFAULT_SNAPSHOT;

  let url = `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}&appid=${encodeURIComponent(apiKey)}&units=metric`;
  if (date) {
    const ts = Math.floor(new Date(date).getTime() / 1000);
    url += `&dt=${ts}`;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return DEFAULT_SNAPSHOT;
    const data = await response.json();
    return {
      condition: data.weather?.[0]?.main ?? null,
      temp_c: data.main?.temp ?? null,
      humidity: data.main?.humidity ?? null,
      wind_kph: data.wind?.speed != null ? Math.round(data.wind.speed * 3.6) : null,
      fetched_at: new Date().toISOString(),
    };
  } catch {
    return DEFAULT_SNAPSHOT;
  }
}

export function emptySnapshot(): WeatherSnapshot {
  return { ...DEFAULT_SNAPSHOT };
}
