import { tool } from "@openai/agents";
import { z } from "zod";
import { queryOne } from "@/lib/db";
import { fetchCurrentWeather } from "@/lib/farms/weather";

export const getWeatherSummary = tool({
  name: "get_weather_summary",
  description:
    "Get current weather conditions. Use this when the farmer asks about weather, rain, temperature, or forecasts.",
  parameters: z.object({
    farmId: z.string().optional().describe("Specific farm ID to get weather for, or omit for general weather"),
  }),
  async execute({ farmId }) {
    if (farmId) {
      const farm = await queryOne<{ lat: number; lng: number; name: string; location: string }>(
        `SELECT lat, lng, name, location FROM farms WHERE id = $1 AND archived_at IS NULL`,
        [farmId]
      );
      if (!farm) {
        return "Farm not found.";
      }

      const weather = await fetchCurrentWeather(farm.lat, farm.lng);
      if (weather.temp_c === null && !weather.condition) {
        return `Weather data temporarily unavailable for ${farm.name}.`;
      }

      const parts = [`Weather for ${farm.name} (${farm.location}):`];
      if (weather.temp_c !== null) parts.push(`• Temperature: ${weather.temp_c}°C`);
      if (weather.condition) parts.push(`• Condition: ${weather.condition}`);
      if (weather.humidity !== null) parts.push(`• Humidity: ${weather.humidity}%`);
      if (weather.wind_kph !== null) parts.push(`• Wind: ${weather.wind_kph} km/h`);

      return parts.join("\n");
    }

    return "Please specify a farm ID to get weather for that location, or ask me to show your farms first.";
  },
});
