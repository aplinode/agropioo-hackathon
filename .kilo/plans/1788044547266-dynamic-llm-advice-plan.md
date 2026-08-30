# Plan: Dynamic LLM-Based Disease Advice for `/detect`

> Replace static `plantvillage-map.ts` catalog lookups with dynamic LLM-generated advice using the existing advisor infrastructure (Groq/OpenAI-compatible API). Keep Hugging Face for image classification; use LLM only for advice generation.

---

## Context

Current state:
- `POST /api/detect` → Hugging Face returns 38 PlantVillage labels
- `plantvillage-map.ts` maps each label to static catalog keys
- `getFastDictionary(locale)` resolves keys → translated strings
- Problem: only 38 diseases covered, Urdu translations incomplete, no dynamic detail

Advisor infrastructure already available:
- `lib/advisor/tools/knowledge-base.ts` → `getOpenAI()` client
- `lib/advisor/model.ts` → `advisorModel()` returns model name
- `.env` has `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `ADVISOR_MODEL=openai/gpt-oss-120b`
- `searchKnowledgeBase` tool searches pgvector for farming context

---

## Key Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | **Reuse `getOpenAI()` from advisor** | Zero new dependencies. Same client, same API key, same model. |
| D2 | **LLM generates advice, HF generates label** | HF is the visual classifier (unchanged). LLM enriches the label into structured, multilingual advice. |
| D3 | **Keep `plantvillage-map.ts` as severity/catalog-key fallback** | Severity levels and crop mappings remain static (verified data). LLM only generates causes + steps + rescan timing. |
| D4 | **Prompt instructs LLM to respond in farmer's locale** | `requestLocale()` already read in route. Pass locale to LLM prompt. |
| D5 | **Fallback to static catalog if LLM fails** | If LLM call errors, fall back to existing `resolveClass()` + `getFastDictionary()` path. No user-facing regression. |
| D6 | **No changes to DB schema** | `detect_scans` table already has all needed columns. |
| D7 | **Streaming not required for detect** | Detect is a single request/response. LLM call is ~1-2s, acceptable within 5s total budget (FR-3.3). |
| D8 | **Update spec FR-8.4 and FR-4.9** | Remove "prompted to respond in user's locale language" (HF can't do this). Add LLM advice generation step. |

---

## Ordered Task List

### Task 1: Add LLM advice generator module

**File:** `lib/detect/llm-advice.ts` (new)

```ts
import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    });
  }
  return openaiClient;
}

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
  const openai = getOpenAI();
  const model = process.env.ADVISOR_MODEL ?? "gpt-4o-mini";

  const systemPrompt = `You are a Pakistani crop disease specialist. Respond in the farmer's language (locale: ${params.locale}). Give concise, actionable advice for smallholder farmers. Use local context (Pakistani markets, commonly available chemicals, PKR costs where relevant).`;

  const userPrompt = `A farmer's leaf photo was analyzed by an AI image classifier.

Detected disease: ${params.diseaseLabel}
Affected crop: ${params.crop}
Severity: ${params.severity}
AI confidence: ${params.confidence}%

Provide structured advice in JSON format:
{
  "causes": "1-2 sentences explaining why this happens in simple language",
  "steps": ["3-4 numbered actionable treatment steps", "use local chemical names where possible", "include approximate PKR cost per acre if relevant"],
  "rescanTiming": "When to scan again (e.g., '7 din baad phir check karein')",
  "caution": "Safety warning: always confirm with local agriculture office before spraying"
}

Respond ONLY with valid JSON, no markdown, no extra text.`;

  const response = await openai.chat.completions.create({
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
```

### Task 2: Update `POST /api/detect` handler

**File:** `app/api/detect/route.ts`

Changes after line 119 (`const advice = resolveClass(top.label)`):

```ts
// Current: static catalog only
const advice = resolveClass(top.label);

// New: try LLM enrichment, fallback to static
let diseaseName: string;
let causes: string;
let steps: string[];
let rescanTiming: string;
let caution: string;

try {
  const llmAdvice = await generateAdvice({
    diseaseLabel: top.label,
    crop: crop, // from dict.t(advice.cropKey).text
    severity: advice.severity,
    locale,
    confidence: confidencePct,
  });
  diseaseName = top.label; // HF label as-is (can be refined by LLM if needed)
  causes = llmAdvice.causes;
  steps = llmAdvice.steps;
  rescanTiming = llmAdvice.rescanTiming;
  caution = llmAdvice.caution;
} catch {
  // Fallback to static catalog (FR-3.5 graceful degradation)
  diseaseName = dict.t(advice.diseaseNameKey).text;
  causes = dict.t(advice.causesKey).text;
  steps = advice.stepsKeys.map((k) => dict.t(k).text);
  rescanTiming = dict.t(advice.rescanKey).text;
  caution = dict.t(advice.cautionKey).text;
}
```

Import addition:
```ts
import { generateAdvice } from "@/lib/detect/llm-advice";
```

### Task 3: Update spec

**File:** `specs/ai-crop-disease-detection/spec.md`

- **FR-4.5**: Change from static causes to "Causes are explained in 1–2 plain-language sentences, generated by an AI advisor using the same LLM infrastructure as the advisor feature."
- **FR-4.6**: Change from static steps to "Treatment steps are generated dynamically by the AI advisor, personalized to Pakistani farming context with local chemical names and approximate PKR costs."
- **FR-8.4**: Add: "After classification, the detected disease label is sent to the advisor LLM (Groq/OpenAI-compatible) which generates structured treatment advice in the farmer's selected language."
- **FR-4.9**: Remove: "The Hugging Face model is prompted to respond in the user's locale language." (HF doesn't support this). Replace with: "The advisor LLM receives the locale preference and generates the full diagnosis in that language."

### Task 4: Update plan

**File:** `.kilo/plans/1788017105284-detect-feature-plan.md`

- Add D11: LLM advice generation via `lib/detect/llm-advice.ts` reusing `getOpenAI()`
- Update D8: Static catalog is fallback only; primary advice comes from LLM
- Update Task 9 (`POST /api/detect`): Add LLM call after `resolveClass()`, with try/catch fallback
- Add new Task: `lib/detect/llm-advice.ts` module
- Update Risks: Add "LLM API latency adds 1-3s" and "LLM may return non-JSON (mitigated by try/catch + fallback)"

### Task 5: Validation

| Check | How |
|---|---|
| AC-9 (5s analysis) | LLM adds ~1-2s; total should stay under 5s on normal network |
| AC-10 (all fields present) | LLM-generated fields still populate all required fields |
| AC-19 (service unavailable) | If LLM fails, static fallback ensures result still shows |
| `npm run lint` | Must pass |
| `npm run build` | Must pass |

---

## Out of Scope

- Multimodal LLM (image directly to LLM) — still using HF for vision
- Streaming LLM response for detect
- LLM-generated disease name (keep HF label for accuracy)
- Translating static catalog to all 8 locales (still needed for fallback)
