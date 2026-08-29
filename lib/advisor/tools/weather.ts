import { tool } from "@openai/agents";
import { z } from "zod";
import { fetchCurrentWeather } from "@/lib/farms/weather";

export const getWeather = tool({
  name: "get_weather",
  description:
    "Get the current weather for any location in Pakistan using live data. Returns current temperature, humidity, and conditions with farming interpretations. Use the farmer's farm coordinates (lat/lng) or district name.",
  parameters: z.object({
    lat: z.number().describe("Latitude of the location (from farm data or farmer's district)"),
    lng: z.number().describe("Longitude of the location (from farm data or farmer's district)"),
    locationName: z.string().optional().describe("Human-readable location name for display (e.g. 'Multan')"),
  }),
  async execute({ lat, lng, locationName }) {
    const snapshot = await fetchCurrentWeather(lat, lng);
    const label = locationName ?? `${lat.toFixed(2)}, ${lng.toFixed(2)}`;

    if (!snapshot.condition && snapshot.temp_c === null) {
      return `Weather data is currently unavailable for ${label}. The weather service may be temporarily down.`;
    }

    const lines = [`Current weather for ${label}:`];

    if (snapshot.temp_c !== null) {
      lines.push(`Temperature: ${snapshot.temp_c}°C`);
    }
    if (snapshot.condition) {
      lines.push(`Conditions: ${snapshot.condition}`);
    }
    if (snapshot.humidity !== null) {
      lines.push(`Humidity: ${snapshot.humidity}%`);
    }

    if (snapshot.temp_c !== null && snapshot.humidity !== null) {
      const tempC = snapshot.temp_c;
      const humid = snapshot.humidity;
      if (tempC > 30 && humid > 70) {
        lines.push("⚠ High temperature + high humidity = elevated fungal disease risk (blight, rust). Scout crops closely.");
      }
      if (tempC > 38) {
        lines.push("⚠ Heat stress alert: ensure adequate irrigation, especially for wheat at grain filling and cotton at flowering.");
      }
      if (tempC < 5) {
        lines.push("⚠ Frost risk: protect young crops and vegetables. Irrigate to raise soil temperature.");
      }
      if (humid > 80 && tempC > 20 && tempC < 35) {
        lines.push("High humidity favors whitefly, aphids, and fungal diseases. Monitor pest levels.");
      }
    }

    if (snapshot.condition?.toLowerCase().includes("rain") || snapshot.condition?.toLowerCase().includes("drizzle")) {
      lines.push("Rain detected or expected — delay any planned sprays. If rain is light, it may benefit soil moisture.");
    }

    return lines.join("\n");
  },
});
