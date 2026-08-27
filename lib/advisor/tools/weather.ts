import { tool } from "@openai/agents";
import { z } from "zod";
import { demoWeatherByLocation } from "@/app/(farmer)/(dashboard)/weather/demo-data";
import type { WeatherLocationId } from "@/app/(farmer)/(dashboard)/weather/demo-data";

const LOCATION_MAP: Record<string, WeatherLocationId> = {
  multan: "multan",
  sahiwal: "sahiwal",
  faisalabad: "faisalabad",
};

export const getWeather = tool({
  name: "get_weather",
  description:
    "Get the current weather forecast for a location in Pakistan. Returns current conditions, hourly forecast, and 5-day daily forecast. Use this when the farmer asks about weather, rain, temperature, or spray windows.",
  parameters: z.object({
    location: z.string().describe("City or district name (e.g. Multan, Sahiwal, Faisalabad)"),
    days: z.number().min(1).max(5).optional().describe("Number of forecast days to include (1-5, default 3)"),
  }),
  async execute({ location, days = 3 }) {
    const locKey = location.toLowerCase().trim() as string;
    const mappedKey = LOCATION_MAP[locKey] ?? "multan";
    const weather = demoWeatherByLocation[mappedKey];

    if (!weather) {
      return `Weather data not available for "${location}". Currently available for: Multan, Sahiwal, Faisalabad.`;
    }

    const dailyForecast = weather.daily.slice(0, days);

    return `Weather for ${weather.label}:
Current: ${weather.condition}, ${weather.temperatureC}°C (High: ${weather.highC}°C, Low: ${weather.lowC}°C)
Rain chance: ${weather.rainChance}% — ${weather.rainNote}
Spray window: ${weather.sprayWindow}

Hourly forecast:
${weather.hourly.map(h => `  ${h.time}: ${h.tempC}°C, ${h.rainPct}% rain chance`).join("\n")}

${days}-day forecast:
${dailyForecast.map(d => `  ${d.day}: ${d.condition}, ${d.loC}–${d.hiC}°C, ${d.rainPct}% rain`).join("\n")}`;
  },
});
