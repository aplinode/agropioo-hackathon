/* Typed demo data for the AI advisor chat (UI-only demo build).
   Replies are canned samples matched by keyword until an LLM is wired. */

export type AdvisorReply = {
  keywords: string[];
  reply: string;
};

export const suggestedQuestions = [
  "Should I irrigate today?",
  "When should I spray for whitefly?",
  "Which fertilizer does wheat need now?",
] as const;

export const advisorReplies: AdvisorReply[] = [
  {
    keywords: ["irrigate", "irrigation", "pani", "water"],
    reply:
      "Hold off today. Rain is likely after 2 PM with a high chance of a good shower — your field will get the water naturally. If it stays dry tomorrow evening, give a light turn before 10 AM while it's still cool.",
  },
  {
    keywords: ["whitefly", "spray", "pest", "sundas"],
    reply:
      "Whitefly risk on cotton across Multan district is high this week. Spray in the early morning when the wind is low, cover the underside of leaves, and rotate your active ingredient so the pest doesn't build resistance. Re-scan the crop after five days.",
  },
  {
    keywords: ["fertilizer", "urea", "dap", "khad"],
    reply:
      "For vegetative-stage wheat, split nitrogen works best: half a bag of urea per acre now, broadcast before irrigation so it washes into the root zone. Hold the second split until first node is visible.",
  },
  {
    keywords: ["price", "rate", "mandi", "sell"],
    reply:
      "Wheat rates at Multan mandi are up about four percent this week. For a small lot, selling mid-week usually beats the Monday rush — check the Prices page for today's sample trend.",
  },
];

export const defaultReply =
  "Noted — I've written that against your farm's history. In the full build I'd answer from live weather, your records, and local crop trials. Try one of the questions below to see how guidance will read.";

/* Opening message shown in every fresh session. */
export const openingMessage =
  "Hello Ahmad. I have your three farms and this week's weather in front of me. Ask me anything about your crop.";
