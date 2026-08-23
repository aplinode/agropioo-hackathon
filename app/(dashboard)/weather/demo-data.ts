/* Typed demo data for the weather screen (UI-only demo build).
   Values stay internally consistent with the dashboard's advisory
   (rain after 2 PM, Multan, cloudy). */

export type HourlyPoint = {
  time: string;
  tempC: number;
  rainPct: number;
};

export type DailyPoint = {
  day: string;
  condition: string;
  hiC: number;
  loC: number;
  rainPct: number;
};

export type LocationWeather = {
  label: string;
  condition: string;
  temperatureC: number;
  highC: number;
  lowC: number;
  rainChance: number;
  rainNote: string;
  sprayWindow: string;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
};

export const weatherLocations = ["multan", "sahiwal", "faisalabad"] as const;
export type WeatherLocationId = (typeof weatherLocations)[number];

export const demoWeatherByLocation: Record<WeatherLocationId, LocationWeather> = {
  multan: {
    label: "Multan",
    condition: "Cloudy",
    temperatureC: 24,
    highC: 28,
    lowC: 17,
    rainChance: 80,
    rainNote: "Rain likely after 2 PM · 80% chance",
    sprayWindow:
      "Spray window tomorrow: 6–10 AM. Wind stays low and leaves will be dry.",
    hourly: [
      { time: "9 AM", tempC: 21, rainPct: 10 },
      { time: "11 AM", tempC: 24, rainPct: 20 },
      { time: "1 PM", tempC: 26, rainPct: 45 },
      { time: "3 PM", tempC: 24, rainPct: 80 },
      { time: "5 PM", tempC: 22, rainPct: 85 },
      { time: "7 PM", tempC: 20, rainPct: 60 },
    ],
    daily: [
      { day: "Today", condition: "Cloudy, rain later", hiC: 28, loC: 17, rainPct: 80 },
      { day: "Mon", condition: "Showers", hiC: 27, loC: 18, rainPct: 70 },
      { day: "Tue", condition: "Partly sunny", hiC: 30, loC: 19, rainPct: 25 },
      { day: "Wed", condition: "Sunny", hiC: 33, loC: 20, rainPct: 5 },
      { day: "Thu", condition: "Sunny", hiC: 34, loC: 21, rainPct: 5 },
    ],
  },
  sahiwal: {
    label: "Sahiwal",
    condition: "Light showers",
    temperatureC: 23,
    highC: 27,
    lowC: 16,
    rainChance: 65,
    rainNote: "Passing showers through the evening · 65% chance",
    sprayWindow:
      "Hold sprays today — rain will wash them off. Tomorrow 6–10 AM looks right.",
    hourly: [
      { time: "9 AM", tempC: 20, rainPct: 20 },
      { time: "11 AM", tempC: 23, rainPct: 35 },
      { time: "1 PM", tempC: 25, rainPct: 50 },
      { time: "3 PM", tempC: 24, rainPct: 60 },
      { time: "5 PM", tempC: 22, rainPct: 55 },
      { time: "7 PM", tempC: 19, rainPct: 40 },
    ],
    daily: [
      { day: "Today", condition: "Light showers", hiC: 27, loC: 16, rainPct: 65 },
      { day: "Mon", condition: "Cloudy", hiC: 28, loC: 17, rainPct: 40 },
      { day: "Tue", condition: "Partly sunny", hiC: 31, loC: 18, rainPct: 20 },
      { day: "Wed", condition: "Sunny", hiC: 33, loC: 20, rainPct: 5 },
      { day: "Thu", condition: "Sunny", hiC: 34, loC: 20, rainPct: 10 },
    ],
  },
  faisalabad: {
    label: "Faisalabad",
    condition: "Humid, building cloud",
    temperatureC: 26,
    highC: 31,
    lowC: 19,
    rainChance: 45,
    rainNote: "Evening drizzle possible · 45% chance",
    sprayWindow:
      "Spray window today: finish by 11 AM before cloud builds. Avoid evening sprays.",
    hourly: [
      { time: "9 AM", tempC: 23, rainPct: 10 },
      { time: "11 AM", tempC: 27, rainPct: 15 },
      { time: "1 PM", tempC: 29, rainPct: 25 },
      { time: "3 PM", tempC: 29, rainPct: 30 },
      { time: "5 PM", tempC: 27, rainPct: 40 },
      { time: "7 PM", tempC: 24, rainPct: 45 },
    ],
    daily: [
      { day: "Today", condition: "Humid, cloud building", hiC: 31, loC: 19, rainPct: 45 },
      { day: "Mon", condition: "Drizzle", hiC: 29, loC: 19, rainPct: 55 },
      { day: "Tue", condition: "Showers", hiC: 29, loC: 20, rainPct: 60 },
      { day: "Wed", condition: "Partly sunny", hiC: 32, loC: 21, rainPct: 20 },
      { day: "Thu", condition: "Sunny", hiC: 34, loC: 22, rainPct: 5 },
    ],
  },
};
