import { tool } from "@openai/agents";
import { z } from "zod";
import { getForecast } from "@/lib/weather/openweather";

export const getWeatherForecast = tool({
  name: "get_weather_forecast",
  description:
    "Get the 7-day weather forecast for any location in Pakistan. Returns daily temperature range (min/max), rainfall, humidity, and conditions. Use this for crop planning, sowing timing, irrigation scheduling, and weather-aware recommendations. Always use the farmer's farm coordinates (lat/lng).",
  parameters: z.object({
    lat: z.number().describe("Latitude of the farm location"),
    lng: z.number().describe("Longitude of the farm location"),
    locationName: z.string().optional().describe("Human-readable location name for display (e.g. 'Multan')"),
  }),
  async execute({ lat, lng, locationName }) {
    const forecast = await getForecast(lat, lng);
    const label = locationName ?? `${lat.toFixed(2)}, ${lng.toFixed(2)}`;

    if (!forecast || forecast.source === "unavailable" || forecast.days.length === 0) {
      return `Weather forecast is currently unavailable for ${label}. The weather service may be temporarily down. Please try again later.`;
    }

    const lines = [`7-day weather forecast for ${label}:`, ""];

    for (const day of forecast.days) {
      const date = new Date(day.date);
      const dayName = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

      lines.push(`**${dayName}**: ${day.temp_min}°C – ${day.temp_max}°C, ${day.condition}`);

      if (day.precip_mm > 0) {
        lines.push(`  Rainfall: ${day.precip_mm}mm`);
      }
      lines.push(`  Humidity: ${day.humidity}%`);
    }

    // Farming interpretations
    lines.push("");
    lines.push("## Farming interpretations:");

    const today = forecast.days[0];
    if (today) {
      if (today.temp_max > 40) {
        lines.push("- Extreme heat expected today — irrigate early morning or late evening. Avoid midday field work.");
      }
      if (today.temp_min < 5) {
        lines.push("- Frost risk tonight — irrigate before sunset to raise soil temperature. Cover young crops.");
      }
      if (today.precip_mm > 10) {
        lines.push("- Heavy rain expected — delay irrigation and spraying. Ensure field drainage is clear.");
      }
      if (today.humidity > 80 && today.temp_min > 20 && today.temp_max < 35) {
        lines.push("- High humidity with moderate temperature — elevated fungal disease risk. Scout crops for early signs.");
      }
    }

    // Check for rain in the next 3 days
    const next3Days = forecast.days.slice(1, 4);
    const rainDays = next3Days.filter(d => d.precip_mm > 5);
    if (rainDays.length > 0) {
      const rainDates = rainDays.map(d => d.date).join(", ");
      lines.push(`- Rain expected on ${rainDates} — plan spraying and irrigation around these days.`);
    }

    // Check for temperature trends
    const temps = forecast.days.slice(0, 5).map(d => d.temp_max);
    const rising = temps.every((t, i) => i === 0 || t >= temps[i - 1]);
    const falling = temps.every((t, i) => i === 0 || t <= temps[i - 1]);

    if (rising && temps[temps.length - 1] - temps[0] > 5) {
      lines.push("- Temperature rising over the next few days — monitor heat stress for sensitive crops.");
    }
    if (falling && temps[0] - temps[temps.length - 1] > 5) {
      lines.push("- Temperature dropping over the next few days — consider frost protection for young crops.");
    }

    return lines.join("\n");
  },
});
