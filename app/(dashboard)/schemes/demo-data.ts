/* Typed demo data for the government schemes screen (UI-only demo build).
   Programme names are well-known Pakistani schemes; details are generic
   and the UI directs farmers to verify locally before acting. */

export type SchemeType = "subsidy" | "loan" | "equipment";

export type DemoScheme = {
  id: string;
  title: string;
  department: string;
  type: SchemeType;
  benefits: string[];
  status: "Open";
};

export const schemeTypeLabel = {
  subsidy: "Subsidy",
  loan: "Loan",
  equipment: "Equipment",
} as const;

export const demoSchemes: DemoScheme[] = [
  {
    id: "scheme-kissan-card",
    title: "Kissan Card",
    department: "Provincial agriculture department",
    type: "subsidy",
    benefits: [
      "Subsidised inputs — seed, fertilizer — bought on credit through your card",
      "Repayment aligned with harvest, not fixed monthly dates",
      "Apply with your CNIC at the local agriculture office or through the helpline",
    ],
    status: "Open",
  },
  {
    id: "scheme-solar-tubewell",
    title: "Solar Tube Well Scheme",
    department: "Provincial energy & agriculture departments",
    type: "equipment",
    benefits: [
      "Cost-sharing on converting diesel tube wells to solar power",
      "Cuts diesel bills and keeps irrigation running through load-shedding",
      "Priority for small holdings and tail-end watercourses",
    ],
    status: "Open",
  },
  {
    id: "scheme-interest-free-loan",
    title: "Interest-Free Kisan Loan",
    department: "Provincial agriculture department",
    type: "loan",
    benefits: [
      "Short-season crop loans without interest for registered farmers",
      "Group guarantee accepted where land papers are incomplete",
      "Disbursed through partner banks after office verification",
    ],
    status: "Open",
  },
];
