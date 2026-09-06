import "server-only";

import OpenAI from "openai";
import { query, queryOne } from "@/lib/db";

let openaiClient: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

export type Treatment = {
  id: string;
  pest_type: string;
  treatment_name: string;
  type: "chemical" | "organic";
  base_cost_pkr: number;
  unit: string;
  description_key: string | null;
  active: boolean;
};

export type TreatmentWithPrice = Treatment & { price_pkr: number; source: string; fetched_at: string };

export async function getTreatmentsForPest(pestType: string): Promise<Treatment[]> {
  const rows = await query<Treatment>(
    `SELECT id, pest_type, treatment_name, type, base_cost_pkr, unit, description_key, active FROM pest_treatments WHERE pest_type = $1 AND active = true`,
    [pestType],
  );
  if (rows.length > 0) return rows;
  return await query<Treatment>(
    `SELECT id, pest_type, treatment_name, type, base_cost_pkr, unit, description_key, active FROM pest_treatments WHERE pest_type = 'default' AND active = true`,
  );
}

export async function getTreatmentWithPrice(treatmentId: string): Promise<TreatmentWithPrice | null> {
  const treatment = await queryOne<Treatment>(
    `SELECT id, pest_type, treatment_name, type, base_cost_pkr, unit, description_key, active FROM pest_treatments WHERE id = $1`,
    [treatmentId],
  );
  if (!treatment) return null;

  const snapshot = await queryOne<{ price_pkr: number; source: string; fetched_at: string }>(
    `SELECT price_pkr, source, fetched_at FROM pest_price_snapshots WHERE treatment_id = $1 ORDER BY fetched_at DESC LIMIT 1`,
    [treatmentId],
  );

  return {
    ...treatment,
    price_pkr: snapshot?.price_pkr ?? treatment.base_cost_pkr,
    source: snapshot?.source ?? "base",
    fetched_at: snapshot?.fetched_at ?? new Date().toISOString(),
  };
}

export async function refreshPriceSnapshot(treatmentId: string, source = "manual"): Promise<number | null> {
  const treatment = await queryOne<Treatment>(
    `SELECT id, base_cost_pkr FROM pest_treatments WHERE id = $1`,
    [treatmentId],
  );
  if (!treatment) return null;

  const price = treatment.base_cost_pkr;
  await query(
    `INSERT INTO pest_price_snapshots (treatment_id, price_pkr, source) VALUES ($1,$2,$3)`,
    [treatmentId, price, source],
  );
  return price;
}

export async function buildRecommendation(pestType: string, locale: string, farmName: string, crop: string): Promise<{ text: string; translationKey: string }> {
  const treatments = await getTreatmentsForPest(pestType);
  const chemical = treatments.find((t) => t.type === "chemical");
  const organic = treatments.find((t) => t.type === "organic");

  const chemicalPrice = chemical ? await getTreatmentWithPrice(chemical.id) : null;
  const organicPrice = organic ? await getTreatmentWithPrice(organic.id) : null;

  const client = getClient();
  if (!client) {
    const lines: string[] = [
      `${pestType.charAt(0).toUpperCase() + pestType.slice(1)} risk detected on ${farmName}.`,
      chemical ? `Chemical: ${chemical.treatment_name} — approx PKR ${chemicalPrice?.price_pkr ?? chemical.base_cost_pkr}/${chemical.unit}.` : "",
      organic ? `Organic: ${organic.treatment_name} — approx PKR ${organicPrice?.price_pkr ?? organic.base_cost_pkr}/${organic.unit}.` : "",
      "Consult your local agriculture office before applying.",
    ].filter(Boolean);
    return { text: lines.join("\n"), translationKey: `app.pest.recommendations.${pestType}` };
  }

  const languageName = locale === "en" ? "English" : locale.toUpperCase();

  const prompt = `You are a Pakistani crop pest advisor. Respond in ${languageName}. Be concise and actionable for smallholder farmers.

Pest: ${pestType}
Crop: ${crop}
Farm: ${farmName}

Available treatments:
${chemical ? `- Chemical: ${chemical.treatment_name} (approx PKR ${chemicalPrice?.price_pkr ?? chemical.base_cost_pkr}/${chemical.unit})` : ""}
${organic ? `- Organic: ${organic.treatment_name} (approx PKR ${organicPrice?.price_pkr ?? organic.base_cost_pkr}/${organic.unit})` : ""}

Provide 2-3 sentences of plain-language recommendation mentioning both options with costs.`;

  try {
    const response = await client.chat.completions.create({
      model: process.env.ADVISOR_MODEL ?? "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.3,
    });
    const text = response.choices[0]?.message?.content?.trim() ?? "Consult your local agriculture office.";
    return { text, translationKey: `app.pest.recommendations.${pestType}` };
  } catch {
    const lines: string[] = [
      `${pestType.charAt(0).toUpperCase() + pestType.slice(1)} risk detected on ${farmName}.`,
      chemical ? `Chemical: ${chemical.treatment_name} — approx PKR ${chemicalPrice?.price_pkr ?? chemical.base_cost_pkr}/${chemical.unit}.` : "",
      organic ? `Organic: ${organic.treatment_name} — approx PKR ${organicPrice?.price_pkr ?? organic.base_cost_pkr}/${organic.unit}.` : "",
      "Consult your local agriculture office before applying.",
    ].filter(Boolean);
    return { text: lines.join("\n"), translationKey: `app.pest.recommendations.${pestType}` };
  }
}
