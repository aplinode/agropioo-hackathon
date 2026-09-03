export function getSeasonStartDate(season: string): string {
  const now = new Date();
  const year = now.getFullYear();
  switch (season) {
    case 'Summer':
      return `${year}-05-01`;
    case 'Winter':
      return `${year}-11-01`;
    case 'Rainy':
      return `${year}-07-01`;
    case 'Dry':
      return `${year}-01-01`;
    default:
      return `${year}-01-01`;
  }
}

export function computeVariance(actualTotal: number, projectedTotal: number): { absolute: number; percentage: number | null } {
  const absolute = actualTotal - projectedTotal;
  const percentage = projectedTotal > 0 ? Math.round((absolute / projectedTotal) * 1000) / 10 : null;
  return { absolute, percentage };
}

export function computeROI(actualRevenue: number, totalActualCost: number): number | null {
  if (totalActualCost === 0) return null;
  return Math.round(((actualRevenue - totalActualCost) / totalActualCost) * 1000) / 10;
}

export function computeBreakEven(totalInvestment: number, expectedPricePerUnit: number | null, expectedYieldPerAcre: number | null, acres: number): { yield: string; price: string } | null {
  if (!expectedPricePerUnit || !expectedYieldPerAcre || expectedPricePerUnit <= 0 || expectedYieldPerAcre <= 0) {
    return null;
  }
  const totalExpectedYield = expectedYieldPerAcre * acres;
  const breakEvenYield = totalInvestment / expectedPricePerUnit;
  const breakEvenPrice = totalInvestment / totalExpectedYield;
  return {
    yield: `${Math.round(breakEvenYield * 100) / 100} units`,
    price: `PKR ${Math.round(breakEvenPrice * 100) / 100} per unit`,
  };
}

export function computePL(
  _params: {
    totalProjectedCost: number;
    totalActualCost: number;
    projectedRevenue: number;
    actualRevenue: number;
    totalInvestment: number;
  }
): {
  netProfitLoss: number;
  roi: number | null;
  variance: { absolute: number; percentage: number | null };
  status: 'profit' | 'loss' | 'break_even';
} {
  const totalProjectedCost = _params.totalProjectedCost;
  const totalActualCost = _params.totalActualCost;
  const actualRevenue = _params.actualRevenue;
  const netProfitLoss = actualRevenue - totalActualCost;
  const roi = computeROI(actualRevenue, totalActualCost);
  const variance = computeVariance(totalActualCost, totalProjectedCost);
  let status: 'profit' | 'loss' | 'break_even' = 'break_even';
  if (netProfitLoss > 0) status = 'profit';
  else if (netProfitLoss < 0) status = 'loss';

  return { netProfitLoss, roi, variance, status };
}

export function getCropUnit(cropId: string): string {
  const units: Record<string, string> = {
    wheat: 'Maund',
    cotton: 'Maund',
    sugarcane: 'Mann',
    maize: 'Maund',
    rice: 'Mann',
    barley: 'Maund',
    mustard: 'Maund',
    sunflower: 'Maund',
    sesame: 'Maund',
    peanut: 'Maund',
    millet: 'Maund',
    sorghum: 'Maund',
    gram: 'Maund',
    lentil: 'Maund',
    'mung bean': 'Maund',
    onion: 'Maund',
    potato: 'Maund',
    tomato: 'Maund',
    cauliflower: 'Maund',
    cabbage: 'Maund',
    carrot: 'Maund',
    radish: 'Maund',
    spinach: 'Maund',
    okra: 'Maund',
    chili: 'Maund',
    cucumber: 'Maund',
    watermelon: 'Maund',
    muskmelon: 'Maund',
    citrus: 'Maund',
    mango: 'Dozen',
    banana: 'Dozen',
    apple: 'Dozen',
    grape: 'Maund',
    olive: 'Kg',
    'date palm': 'Kg',
  };
  return units[cropId] ?? 'Maund';
}

export type PLSummary = {
  netProfitLoss: number;
  roi: number | null;
  variance: { absolute: number; percentage: number | null };
  status: 'profit' | 'loss' | 'break_even';
};

export type BreakEvenResult = {
  yield: string;
  price: string;
} | null;
