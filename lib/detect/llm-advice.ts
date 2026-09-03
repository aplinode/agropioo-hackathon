import OpenAI from "openai";

const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface LlmAdvice {
  causes: string;
  steps: string[];
  rescanTiming: string;
  caution: string;
}

export async function generateAdvice(params: {
  diseaseLabel: string;
  crop: string;
  severity: string;
  locale: string;
  confidence: number;
}): Promise<LlmAdvice> {
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

  const systemPrompt = `You are a Pakistani crop disease specialist. Respond ONLY in ${languageName}. Give concise, actionable advice for smallholder farmers. Use local context (Pakistani markets, commonly available chemicals, PKR costs where relevant).`;

  const userPrompt = `A farmer's leaf photo was analyzed by an AI image classifier.

Detected disease: ${params.diseaseLabel}
Affected crop: ${params.crop}
Severity: ${params.severity}
AI confidence: ${params.confidence}%

Provide structured advice in JSON format:
{
  "causes": "1-2 sentences explaining why this happens in simple language",
  "steps": ["3-4 numbered actionable treatment steps", "use local chemical names where possible", "include approximate PKR cost per acre if relevant"],
  "rescanTiming": "When to scan again (e.g., 7 din baad phir check karein)",
  "caution": "Safety warning: always confirm with local agriculture office before spraying"
}

Respond ONLY with valid JSON, no markdown, no extra text.`;

  const response = await openaiClient.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 500,
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content ?? "";
  try {
    const parsed = JSON.parse(content) as LlmAdvice;
    return {
      causes: parsed.causes ?? "Consult local agriculture office.",
      steps: Array.isArray(parsed.steps) ? parsed.steps.slice(0, 4) : ["Consult local agriculture office."],
      rescanTiming: parsed.rescanTiming ?? "7 din baad phir check karein",
      caution: parsed.caution ?? "Pehle local agriculture office se salah lein.",
    };
  } catch {
    throw new Error("LLM returned invalid JSON");
  }
}
