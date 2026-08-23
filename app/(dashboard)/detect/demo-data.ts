/* Typed demo data for the crop detection screen (UI-only demo build). */

export type ScanOutcome = "treated" | "monitor" | "clear";

export type DemoScan = {
  id: string;
  crop: string;
  finding: string;
  outcome: ScanOutcome;
  when: string;
};

export const scanOutcomeLabel = {
  treated: "Treated",
  monitor: "Monitoring",
  clear: "Clear",
} as const;

export const demoScanHistory: DemoScan[] = [
  {
    id: "scan-01",
    crop: "Cotton · Sahiwal Plot",
    finding: "Whitefly stress on lower leaves",
    outcome: "treated",
    when: "19 Aug 2026",
  },
  {
    id: "scan-02",
    crop: "Wheat · Khalilpur Farm",
    finding: "Early yellowing near watercourse",
    outcome: "monitor",
    when: "14 Aug 2026",
  },
  {
    id: "scan-03",
    crop: "Sugarcane · Chak 62 GB",
    finding: "No disease signs found",
    outcome: "clear",
    when: "2 Aug 2026",
  },
];

/* The sample result returned for any uploaded photo in the demo build.
   Agronomy steps are the generic extension-service advice for leaf rust. */
export const sampleDiagnosis = {
  condition: "Leaf rust (sample)",
  crop: "Wheat",
  confidencePct: 87,
  severityWord: "Watch",
  steps: [
    "Mark the worst patches with a stick so you can re-check the same spots.",
    "Avoid overhead watering — wet leaves help rust spread overnight.",
    "If patches grow, buy a certified fungicide from your dealer and follow the label dose.",
    "Scan the same field again in seven days to confirm it's not spreading.",
  ],
};
