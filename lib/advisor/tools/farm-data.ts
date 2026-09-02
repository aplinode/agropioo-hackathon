import { tool } from "@openai/agents";
import { z } from "zod";
import { query } from "@/lib/db";
import { fetchCurrentWeather } from "@/lib/farms/weather";

type FarmRow = {
  id: string;
  name: string;
  location: string;
  district: string;
  lat: number;
  lng: number;
  acres: string;
  crops: string | string[];
  growth_stages: Record<string, string>;
};

type RecordRow = {
  id: string;
  farm_id: string;
  farm_name: string;
  type: string;
  event_date: string;
  title: string | null;
  note: string | null;
  yield_qty: string | null;
  labor_cost: string | null;
  transport_cost: string | null;
  weather: Record<string, unknown> | null;
};

type WeatherRecordRow = {
  farm_id: string;
  farm_name: string;
  event_date: string;
  type: string;
  title: string | null;
  weather: Record<string, unknown>;
};

function formatCrops(crops: string | string[]): string {
  if (Array.isArray(crops)) return crops.join(", ");
  if (typeof crops === "string") {
    try {
      const parsed = JSON.parse(crops);
      if (Array.isArray(parsed)) return parsed.join(", ");
    } catch { /* not JSON, use as-is */ }
  }
  return String(crops);
}

function formatGrowthStage(stages: Record<string, string>): string {
  const entries = Object.entries(stages);
  if (entries.length === 0) return "unknown";
  return entries.map(([crop, stage]) => `${crop}: ${stage}`).join(", ");
}

export function createFarmDataTools(accountId: string) {
  const getMyFarms = tool({
    name: "get_my_farms",
    description:
      "Get the farmer's registered farms with location, size, crop types, current growth stage, and health status. Use this when the farmer asks about their farms, land, fields, or 'how are my farms doing'.",
    parameters: z.object({
      farmName: z.string().optional().describe("Specific farm name to filter by, or omit for all farms"),
    }),
    async execute({ farmName }) {
      let sql = `SELECT id, name, location, district, acres, crops, growth_stages FROM farms WHERE account_id = $1 AND archived_at IS NULL ORDER BY created_at DESC`;
      const params: (string)[] = [accountId];

      if (farmName) {
        sql = `SELECT id, name, location, district, acres, crops, growth_stages FROM farms WHERE account_id = $1 AND archived_at IS NULL AND lower(name) LIKE $2 ORDER BY created_at DESC`;
        params.push(`%${farmName.toLowerCase()}%`);
      }

      const farms = await query<FarmRow>(sql, params);

      if (farms.length === 0) {
        return farmName
          ? `No farm found matching "${farmName}". Suggest the farmer check their Farms section or add a new farm.`
          : "The farmer has no farms registered yet. Suggest they add a farm through the Farms section.";
      }

      return `Farmer's farms:\n${farms.map(f => {
        const crops = formatCrops(f.crops);
        const stage = formatGrowthStage(f.growth_stages);
        return `• ${f.name} (${f.location}, ${f.district}): ${f.acres} acres, ${crops}, current stage: ${stage}`;
      }).join("\n")}`;
    },
  });

  const getMyRecords = tool({
    name: "get_my_records",
    description:
      "Get the farmer's farm activity records — irrigation, fertilizer applications, pesticide sprays, disease observations, and harvests. Use this when the farmer asks about their farming history, what they've done, or when they last did something.",
    parameters: z.object({
      farmId: z.string().optional().describe("Specific farm ID to filter records, or omit for all farms"),
      recordType: z.enum(["sowing", "planting", "irrigation", "fertilizer", "pesticide", "disease", "harvest"]).optional().describe("Filter by record type"),
    }),
    async execute({ farmId, recordType }) {
      const conditions: string[] = ["r.account_id = $1"];
      const params: string[] = [accountId];
      let paramIdx = 2;

      if (farmId) {
        // Defense-in-depth: verify the farm belongs to this farmer before querying records
        const farmOwner = await query<{ id: string }>(
          `SELECT id FROM farms WHERE id = $1 AND account_id = $2 AND archived_at IS NULL`,
          [farmId, accountId]
        );
        if (farmOwner.length === 0) {
          return "Farm not found or does not belong to you. Please check your farm list.";
        }
        conditions.push(`r.farm_id = $${paramIdx++}`);
        params.push(farmId);
      }
      if (recordType) {
        conditions.push(`r.type = $${paramIdx++}`);
        params.push(recordType);
      }

      const sql = `SELECT r.id, r.farm_id, f.name AS farm_name, r.type, r.event_date, r.title, r.note, r.yield_qty, r.labor_cost, r.transport_cost
        FROM records r
        JOIN farms f ON f.id = r.farm_id AND f.account_id = $1
        WHERE ${conditions.join(" AND ")}
        ORDER BY r.event_date DESC, r.created_at DESC
        LIMIT 50`;

      const records = await query<RecordRow>(sql, params);

      if (records.length === 0) {
        return farmId
          ? `No records found for this farm${recordType ? ` (type: ${recordType})` : ""}. The farmer may not have logged any activities yet.`
          : `No ${recordType ?? "farm"} records found. The farmer hasn't logged any activities yet.`;
      }

      return `Farm records:\n${records.map(r => {
        const parts = [`• [${r.farm_name}] ${r.title ?? r.type} (${r.type}) — ${r.event_date}`];
        if (r.note) parts.push(`: ${r.note}`);
        const costs: string[] = [];
        if (r.labor_cost) costs.push(`labor Rs ${r.labor_cost}`);
        if (r.transport_cost) costs.push(`transport Rs ${r.transport_cost}`);
        if (r.yield_qty) parts.push(` | Yield: ${r.yield_qty}`);
        if (costs.length > 0) parts.push(` | Costs: ${costs.join(", ")}`);
        return parts.join("");
      }).join("\n")}`;
    },
  });

  const getMyWeatherRecords = tool({
    name: "get_my_weather_records",
    description:
      "Get weather data recorded at the time of the farmer's past farming activities. Shows what weather conditions were like when the farmer sowed, irrigated, sprayed, or harvested. Use this to understand weather patterns affecting the farmer's operations.",
    parameters: z.object({
      farmId: z.string().optional().describe("Specific farm ID, or omit for all farms"),
      days: z.number().optional().describe("Number of past days to look back (default 30)"),
    }),
    async execute({ farmId, days }) {
      const lookbackDays = days ?? 30;
      const conditions: string[] = ["r.account_id = $1", "r.weather != '{}'::jsonb", "r.event_date >= current_date - $2::int"];
      const params: (string | number)[] = [accountId, lookbackDays];
      let paramIdx = 3;

      if (farmId) {
        const farmOwner = await query<{ id: string }>(
          `SELECT id FROM farms WHERE id = $1 AND account_id = $2 AND archived_at IS NULL`,
          [farmId, accountId]
        );
        if (farmOwner.length === 0) {
          return "Farm not found or does not belong to you.";
        }
        conditions.push(`r.farm_id = $${paramIdx++}`);
        params.push(farmId);
      }

      const sql = `SELECT r.farm_id, f.name AS farm_name, r.event_date, r.type, r.title, r.weather
        FROM records r
        JOIN farms f ON f.id = r.farm_id AND f.account_id = $1
        WHERE ${conditions.join(" AND ")}
        ORDER BY r.event_date DESC
        LIMIT 20`;

      const records = await query<WeatherRecordRow>(sql, params);

      if (records.length === 0) {
        return `No weather data found in your farm records for the last ${lookbackDays} days. Weather is recorded automatically when you log farming activities.`;
      }

      return `Weather conditions from your farm activities (last ${lookbackDays} days):\n${records.map(r => {
        const w = r.weather;
        const temp = w.temp_c ?? w.temp ?? w.temperature;
        const humidity = w.humidity;
        const condition = w.condition ?? w.weather ?? w.description;
        const wind = w.wind_kph ?? w.wind;
        const parts = [`• [${r.farm_name}] ${r.title ?? r.type} on ${r.event_date}`];
        const details: string[] = [];
        if (temp != null) details.push(`${temp}°C`);
        if (humidity != null) details.push(`${humidity}% humidity`);
        if (condition) details.push(`${condition}`);
        if (wind != null) details.push(`wind ${wind} km/h`);
        if (details.length > 0) parts.push(`  Weather: ${details.join(", ")}`);
        return parts.join("");
      }).join("\n")}`;
    },
  });

  const getMyFarmWeather = tool({
    name: "get_my_farm_weather",
    description:
      "Get current live weather for the farmer's own farm locations. Automatically uses the farm's coordinates (lat/lng) to fetch real-time temperature, humidity, wind, and conditions. Use this when the farmer asks 'what's the weather at my farm' or 'how's the weather on my fields'.",
    parameters: z.object({
      farmName: z.string().optional().describe("Specific farm name, or omit for all farms"),
    }),
    async execute({ farmName }) {
      let sql = `SELECT id, name, location, district, lat, lng, crops, growth_stages FROM farms WHERE account_id = $1 AND archived_at IS NULL ORDER BY created_at DESC`;
      const params: string[] = [accountId];

      if (farmName) {
        sql = `SELECT id, name, location, district, lat, lng, crops, growth_stages FROM farms WHERE account_id = $1 AND archived_at IS NULL AND lower(name) LIKE $2 ORDER BY created_at DESC`;
        params.push(`%${farmName.toLowerCase()}%`);
      }

      const farms = await query<FarmRow>(sql, params);

      if (farms.length === 0) {
        return farmName
          ? `No farm found matching "${farmName}".`
          : "No farms registered. Add a farm first to get weather data.";
      }

      const results: string[] = [];
      for (const farm of farms) {
        const snapshot = await fetchCurrentWeather(farm.lat, farm.lng);
        const crops = formatCrops(farm.crops);
        const stage = formatGrowthStage(farm.growth_stages);

        if (!snapshot.condition && snapshot.temp_c === null) {
          results.push(`• ${farm.name} (${farm.location}): Weather data temporarily unavailable`);
          continue;
        }

        const parts = [`• ${farm.name} (${farm.location}) — ${crops}, ${stage}:`];
        if (snapshot.temp_c !== null) parts.push(`  ${snapshot.temp_c}°C`);
        if (snapshot.condition) parts.push(`  ${snapshot.condition}`);
        if (snapshot.humidity !== null) parts.push(`  ${snapshot.humidity}% humidity`);
        if (snapshot.wind_kph !== null) parts.push(`  wind ${snapshot.wind_kph} km/h`);

        // Add farming-specific alerts
        if (snapshot.temp_c !== null && snapshot.humidity !== null) {
          if (snapshot.temp_c > 38) parts.push(`  ⚠ Heat stress risk — ensure irrigation`);
          if (snapshot.temp_c < 5) parts.push(`  ⚠ Frost risk — protect young crops`);
          if (snapshot.humidity > 80 && snapshot.temp_c > 20) parts.push(`  ⚠ High humidity — fungal disease risk`);
        }
        if (snapshot.condition?.toLowerCase().includes("rain")) {
          parts.push(`  ⚠ Rain — delay sprays`);
        }

        results.push(parts.join("\n"));
      }

      return `Current weather at your farms:\n${results.join("\n")}`;
    },
  });

  return { getMyFarms, getMyRecords, getMyWeatherRecords, getMyFarmWeather };
}
