import "server-only";

import OpenAI from "openai";
import { query } from "@/lib/db";

let openaiClient: OpenAI | null = null;

export function getWeatherOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    });
  }
  return openaiClient;
}

export interface AIDayAdvice {
  advice_text: string;
  severity: "info" | "warning" | "critical";
  label: string;
}

export interface DayWeatherInput {
  date: string;
  temp_max: number;
  temp_min: number;
  precip_mm: number;
  humidity: number;
  description: string;
}

export async function generateAIAdviceBatch(params: {
  days: DayWeatherInput[];
  crop: string;
  growthStage: string;
  locale: string;
  farmName: string;
  recentActivities: string[];
}): Promise<Map<string, AIDayAdvice>> {
  const openai = getWeatherOpenAI();
  const model = process.env.ADVISOR_MODEL ?? "gpt-4o-mini";

  const localeMap: Record<string, string> = {
    en: "English",
    ur: "Urdu",
    pa: "Punjabi",
    ps: "Pashto",
    sd: "Sindhi",
    skr: "Saraiki",
    bal: "Balochi",
    hno: "Hindko",
  };

  const languageName = localeMap[params.locale] ?? "English";
  const stageLabel = params.growthStage.replace(/([A-Z])/g, " $1").trim();

  const daysBlock = params.days
    .map(
      (d, i) =>
        `${i + 1}. ${d.date}: H=${d.temp_max}°C L=${d.temp_min}°C rain=${d.precip_mm}mm humidity=${d.humidity}% condition=${d.description}`,
    )
    .join("\n");

  const systemPrompt = `You are a Pakistani farming advisor for smallholder farmers. Respond ONLY in ${languageName}. Be concise and actionable.`;

  const userPrompt = `Generate a short farming advisory for each day below.

Farm: ${params.farmName}
Crop: ${params.crop}
Growth stage: ${stageLabel}
Recent activities: ${params.recentActivities.length > 0 ? params.recentActivities.join(", ") : "none recorded"}

Days:
${daysBlock}

Rules per day:
1. Start with the most urgent weather risk (heat, frost, rain, humidity).
2. Keep each advice to ONE short sentence.
3. Use local farming terms.
4. Include approximate PKR cost only if relevant.
5. Output ONLY JSON:
{
  "advice": [
    { "date": "YYYY-MM-DD", "advice_text": "...", "severity": "info|warning|critical", "label": "2-3 word summary" }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 600,
      temperature: 0.4,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(content) as { advice?: Array<{ date: string; advice_text: string; severity: string; label: string }> };

    const result = new Map<string, AIDayAdvice>();
    for (const item of parsed.advice ?? []) {
      result.set(item.date, {
        advice_text: item.advice_text?.trim() ?? "Keep monitoring your crop and the forecast.",
        severity: (item.severity as AIDayAdvice["severity"]) ?? "info",
        label: item.label?.trim() ?? "Advisory",
      });
    }
    return result;
  } catch {
    return new Map();
  }
}

