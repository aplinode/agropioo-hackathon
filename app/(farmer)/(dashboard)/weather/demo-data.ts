/* Demo fallback data for the weather advisory screen (spec T038). Used only when
   the live forecast is unavailable and there is no cached advisory — keeps the
   page honest and populated instead of blank (constitution Principle VI). */

export type DemoDay = {
  date: string;
  weather: { temp_max: number; temp_min: number; precip_mm: number; humidity: number; description: string };
  growthStageLabel: string;
  adviceText: string;
  severity: "info" | "warning" | "critical";
};

export const demoWeather = {
  farmName: "North Field",
  today: {
    growthStageLabel: "Flowering",
    adviceText: "Humidity favours disease — apply preventive fungicide in the dry morning window.",
    severity: "warning" as const,
  },
  days: [
    {
      date: new Date().toISOString().slice(0, 10),
      weather: { temp_max: 34, temp_min: 22, precip_mm: 0, humidity: 85, description: "Humid" },
      growthStageLabel: "Flowering",
      adviceText: "Humidity favours disease — apply preventive fungicide in the dry morning window.",
      severity: "warning",
    },
    {
      date: shiftDate(1),
      weather: { temp_max: 33, temp_min: 21, precip_mm: 12, humidity: 80, description: "Rain" },
      growthStageLabel: "Flowering",
      adviceText: "Skip irrigation today — rain is expected. Save water and avoid waterlogging.",
      severity: "warning",
    },
    {
      date: shiftDate(2),
      weather: { temp_max: 30, temp_min: 19, precip_mm: 2, humidity: 60, description: "Partly cloudy" },
      growthStageLabel: "Flowering",
      adviceText: "Good window to apply fertiliser ahead of steady weather.",
      severity: "info",
    },
    {
      date: shiftDate(3),
      weather: { temp_max: 33, temp_min: 20, precip_mm: 0, humidity: 55, description: "Sunny" },
      growthStageLabel: "Maturation",
      adviceText: "Steady growth stage — keep up regular irrigation and weeding.",
      severity: "info",
    },
    {
      date: shiftDate(4),
      weather: { temp_max: 41, temp_min: 24, precip_mm: 0, humidity: 35, description: "Hot" },
      growthStageLabel: "Maturation",
      adviceText: "Extreme heat — increase irrigation and avoid field work midday.",
      severity: "warning",
    },
    {
      date: shiftDate(5),
      weather: { temp_max: 34, temp_min: 21, precip_mm: 0, humidity: 50, description: "Sunny" },
      growthStageLabel: "Maturation",
      adviceText: "Steady growth stage — keep up regular irrigation and weeding.",
      severity: "info",
    },
    {
      date: shiftDate(6),
      weather: { temp_max: 32, temp_min: 18, precip_mm: 4, humidity: 65, description: "Showers" },
      growthStageLabel: "Harvest ready",
      adviceText: "Crops near harvest — plan the harvest for a dry day and protect ripe produce from rain.",
      severity: "info",
    },
  ] as DemoDay[],
};

function shiftDate(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
