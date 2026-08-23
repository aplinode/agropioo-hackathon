/* Typed demo data for the prices screen (UI-only demo build).
   Rates are sample values for the walkthrough — clearly labelled in UI. */

export type PriceSignal = "hold" | "sell";

export type DemoPrice = {
  id: string;
  crop: string;
  urduName: string;
  pricePer40kg: number;
  /** Change vs last week, in rupees per 40 kg */
  changeRs: number;
  direction: "up" | "down";
  signal: PriceSignal;
  signalNote: string;
  /** Last seven sessions of rates, oldest first (for the trend line) */
  trend: number[];
};

export const demoMandi = "Multan";

export const demoPrices: DemoPrice[] = [
  {
    id: "price-wheat",
    crop: "Wheat",
    urduName: "گندم",
    pricePer40kg: 3900,
    changeRs: 150,
    direction: "up",
    signal: "hold",
    signalNote: "Rate still climbing — hold a week if storage is dry.",
    trend: [3700, 3720, 3750, 3760, 3800, 3850, 3900],
  },
  {
    id: "price-cotton",
    crop: "Cotton (phutti)",
    urduName: "کپاس",
    pricePer40kg: 7800,
    changeRs: 250,
    direction: "down",
    signal: "hold",
    signalNote: "Small dip on fresh arrival pressure — watch two more sessions.",
    trend: [8150, 8100, 8050, 7980, 7920, 7860, 7800],
  },
  {
    id: "price-sugarcane",
    crop: "Sugarcane",
    urduName: "گنا",
    pricePer40kg: 1810,
    changeRs: 30,
    direction: "up",
    signal: "sell",
    signalNote: "Mills are lifting at this rate — book your slip this week.",
    trend: [1760, 1770, 1775, 1780, 1790, 1800, 1810],
  },
  {
    id: "price-maize",
    crop: "Maize",
    urduName: "مکئی",
    pricePer40kg: 2900,
    changeRs: 80,
    direction: "down",
    signal: "hold",
    signalNote: "Poultry demand usually lifts rates after monsoon — hold.",
    trend: [3040, 3010, 2990, 2970, 2950, 2920, 2900],
  },
];
