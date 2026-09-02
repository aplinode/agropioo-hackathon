export interface FarmSummary {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  acres: number;
  crops: string;
  stage: string;
  health: "good" | "watch";
}

export interface FarmerContext {
  accountId: string;
  farmerName: string;
  language: string;
  farms: FarmSummary[];
  currentSeason: "Kharif" | "Rabi";
  seasonPhase: "early" | "mid" | "late";
  currentDate: string;
  currentMonth: number;
  district: string;
  conversationHistory?: string;
  recentSummaries?: string;
}

export type SeasonInfo = {
  season: "Kharif" | "Rabi";
  phase: "early" | "mid" | "late";
};

export function getCurrentSeason(): SeasonInfo {
  const month = new Date().getMonth();
  if (month >= 3 && month <= 5) return { season: "Kharif", phase: "early" };
  if (month >= 6 && month <= 7) return { season: "Kharif", phase: "mid" };
  if (month >= 8 && month <= 9) return { season: "Kharif", phase: "late" };
  if (month === 10 || month === 11) return { season: "Rabi", phase: "early" };
  if (month === 0 || month === 1) return { season: "Rabi", phase: "mid" };
  return { season: "Rabi", phase: "late" };
}

export function getCropCalendar(month: number, season: string): string {
  if (season === "Kharif") {
    if (month >= 3 && month <= 4) return "Land preparation and sowing window for cotton, maize, and moong. Pre-sowing irrigation and basal fertilizer (DAP + SOP). Nursery preparation for rice.";
    if (month === 5) return "Cotton germination and early growth. Direct-seeded rice establishment. Maize vegetative growth. Watch for cutworm and jassid in cotton.";
    if (month === 6) return "Cotton vegetative to square formation — critical for jassid, thrips, and CLCV scouting. Rice transplanting window. Sugarcane grand growth phase begins. First hoeing for maize.";
    if (month === 7) return "Cotton flowering — peak bollworm and whitefly risk. Rice tillering — apply nitrogen top dressing. Monsoon rain may delay sprays. Sugarcane continued growth.";
    if (month === 8) return "Cotton boll formation — protect from bollworm and pink bollworm. Rice booting to heading — blast and sheath blight risk. Late monsoon disease peak.";
    if (month === 9) return "Cotton picking begins (early varieties). Rice grain filling — drain fields 15 days before harvest. Maize harvest. Sugarcane maturity.";
    return "Cotton picking continues. Rice harvest. Sugarcane ready for harvest. Land preparation for Rabi sowing begins.";
  }
  // Rabi
  if (month === 10) return "Land preparation for wheat sowing. Basal fertilizer (DAP). Mustard and gram sowing window. Fodder (berseem) establishment.";
  if (month === 11) return "Peak wheat sowing window (Nov 1–25 optimal). Late sowing reduces yield significantly. Gram and mustard vegetative growth. Watch for aphids in mustard.";
  if (month === 0) return "Wheat tillering — first irrigation (CRI stage, 20-25 days after sowing). Weed management. Cold stress risk for young crops. Gram flowering begins.";
  if (month === 1) return "Wheat crown root initiation — second irrigation. Top dress urea. Frost risk for vegetables and potato. Gram pod formation.";
  return "Wheat jointing to booting — third/fourth irrigation. Rust scouting critical (yellow rust peaks Feb–Mar). Gram harvest. Mustard harvest.";
}

export function getSeasonalRisks(month: number): string {
  const risks: Record<number, string> = {
    0: "Frost risk for potato, vegetables, and young wheat. Ensure adequate soil moisture to reduce frost damage. Citrus fruit drop in Kinnow orchards.",
    1: "Fog and smog reduce sunlight — slows wheat growth. Continue frost protection. Sugarcane harvest in full swing.",
    2: "Yellow rust peak in wheat — scout every 5 days. Wheat aphid risk. Pre-harvest irrigation for wheat.",
    3: "Heat stress begins for Rabi crops nearing maturity. Wheat heading — high temperatures cause shriveled grain. Start Kharif land prep.",
    4: "Heat stress risk for wheat grain filling — irrigate to cool canopy. Cotton sowing. Hailstorm risk for standing crops.",
    5: "Peak temperatures — heat stress for cotton and young crops. Ensure adequate irrigation. Thrips and jassid active in cotton.",
    6: "Monsoon onset — high humidity increases fungal disease risk (CLCV, leaf curl). Delay sprays if rain expected. Waterlogging in low-lying fields.",
    7: "Monsoon peak — bollworm, whitefly, and disease pressure highest. Spray timing critical between rain events. Flood risk in river-adjacent farms.",
    8: "Continued monsoon disease pressure. Cotton boll rot in humid conditions. Rice blast and sheath blight. Begin Rabi land prep in rain-fed areas.",
    9: "Monsoon receding — last window for cotton late-season pest management. Rice maturation. Wheat land preparation. Whitefly migration to Rabi crops.",
    10: "Wheat sowing urgency — delayed sowing = yield loss. Residual moisture from monsoon aids germination. Aphid risk in mustard and gram.",
    11: "Wheat emergence and early growth. Cold nights slow growth — avoid irrigation during freezing temperatures. Termite risk in wheat.",
  };
  return risks[month] ?? "No specific seasonal risks for this month.";
}

export function buildFarmerInstructions(ctx: FarmerContext): string {
  const farmList = ctx.farms.length > 0
    ? ctx.farms.map(f => `• ${f.name}: ${f.acres} acres, ${f.crops}, ${f.stage} stage, health: ${f.health}`).join("\n")
    : "No farms registered yet.";

  const langInstruction = ctx.language === "ur"
    ? "Respond in Urdu script (not Roman Urdu). Use natural, conversational Urdu suitable for Pakistani farmers."
    : ctx.language === "en"
      ? "Respond in English."
      : `Respond in ${ctx.language}.`;

  const cropCalendar = getCropCalendar(ctx.currentMonth, ctx.currentSeason);
  const seasonalRisks = getSeasonalRisks(ctx.currentMonth);

  return `You are Agropioo Advisor — a trusted farming companion for Pakistani farmers.

## Your personality
- Warm and encouraging in greetings and follow-ups — you genuinely care about the farmer's success
- Direct and actionable when delivering farming advice — lead with what to do, not theory
- Never condescending — treat the farmer as a knowledgeable practitioner
- Use plain language, short sentences, and local measurements (maunds, kanals, marlas)
- When recommending inputs (fertilizer, pesticide, seed), include approximate costs in PKR per acre where possible

## The farmer you are advising
- Name: ${ctx.farmerName}
- Today's date: ${ctx.currentDate}
- Current season: ${ctx.currentSeason} (${ctx.seasonPhase} phase)
- Language: ${ctx.language}
- Location: ${ctx.district}, Pakistan

## Their farms
${farmList}

## Current crop calendar
${cropCalendar}

## Seasonal risks to watch
${seasonalRisks}

${ctx.conversationHistory ? `## Recent conversation history\n${ctx.conversationHistory}` : ""}
${ctx.recentSummaries ? `## Previous conversations\n${ctx.recentSummaries}` : ""}

## Language rules — CRITICAL: Language Consistency
${langInstruction}
- **NEVER switch languages mid-sentence or mid-paragraph.** Every response must be 100% in one language.
- If the farmer writes in Roman Urdu (e.g. "meri gandum mein zang lag gaya"), respond 100% in proper Urdu script — not a mix of Urdu and English.
- If the farmer writes in English, respond 100% in English — not a mix of English and Urdu.
- If the farmer mixes languages in one message, respond in the dominant language of their message.
- Only exception: technical terms with no local equivalent (GPS, pH, NPK, DAP) may stay as-is.
- Before finalizing your response, verify: "Is this entirely in one language?" If you find any words from the other language, translate them.
- Match the farmer's language per-message — they may switch between messages, but NEVER within a single response.

## Response length
- For simple questions (greetings, quick facts): 2-3 sentences
- For moderate questions (single topic advice): medium length with structured format
- For complex questions (multi-farm analysis, detailed planning): detailed with sections

## Response format for farming advice
When giving agricultural advice, use this structured format with markdown:

**Problem:** [what is happening]
**Cause:** [why it is happening]
**What to do:**
1. [first step]
2. [second step]
3. [third step]
**When:** [timing]
**Caution:** [safety warnings if any]

## Proactive alerts
If you notice from farm data or weather that something needs attention, mention it even if the farmer didn't ask — overdue irrigation, pest scouting windows, weather risks during planned activities.

## Important rules
- ONLY give farming advice grounded in the knowledge base or verified sources — never invent statistics, research citations, or testimonials
- Use local Pakistani measurements (maund = 40kg, kanal = 1/8 acre, marla = 1/160 acre) alongside metric
- When the farmer asks about their own farms or records, use the farm data tools to retrieve real data and provide smart summaries with advice
- Proactively cross-reference data: if you notice a risk (e.g. rain forecast during spray window), mention it
- For safety-critical unknowns (chemical dosages, unknown diseases) where you lack verified data: say "I don't have verified information on this. Please consult your local extension officer." — do NOT guess
- For general farming knowledge (common practices, well-known techniques): answer confidently from your knowledge
- Stay on farming topics only — politely redirect non-farming queries
- Never recommend specific pesticide dosages unless sourced from verified knowledge base content
- Suggest 2-3 follow-up questions after your response, specific to the farmer's farms, crops, and current season`;
}
