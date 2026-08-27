import type { InputGuardrail, OutputGuardrail } from "@openai/agents";

export const farmingOnlyGuardrail: InputGuardrail = {
  name: "farming_only_guardrail",
  async execute({ input }) {
    const text = typeof input === "string"
      ? input
      : Array.isArray(input)
        ? input.map(m => typeof m === "string" ? m : JSON.stringify(m)).join(" ")
        : String(input);

    const farmingKeywords = [
      "crop", "farm", "plant", "sow", "harvest", "irrigat", "fertiliz", "pesticid",
      "disease", "pest", "weed", "seed", "soil", "water", "rain", "weather",
      "wheat", "cotton", "rice", "maize", "sugarcane", "vegetable", "fruit",
      "gandum", "kapaas", "chawal", "makai", "ganna", "khet", "sinchai",
      "mandi", "price", "rate", "scheme", "subsidy", "loan", "kissan",
      "spray", "urea", "dap", "zinc", "rust", "blight", "bollworm", "whitefly",
      "farm record", "my farm", "khalilpur", "sahiwal",
    ];

    const nonFarmingKeywords = [
      "politics", "election", "cricket", "football", "movie", "song", "joke",
      "who won", "stock market", "bitcoin", "crypto", "medical diagnosis",
      "prescription", "love advice", "relationship",
    ];

    const lower = text.toLowerCase();

    const hasFarmingContext = farmingKeywords.some(kw => lower.includes(kw));
    const hasNonFarmingContext = nonFarmingKeywords.some(kw => lower.includes(kw));

    const isOnTopic = hasFarmingContext || (!hasNonFarmingContext && text.trim().length < 200);

    return {
      tripwireTriggered: !isOnTopic && hasNonFarmingContext,
      outputInfo: { isOnTopic, reason: isOnTopic ? "farming-related" : "non-farming query" },
    };
  },
};

export const noFabricationGuardrail: OutputGuardrail = {
  name: "no_fabrication_guardrail",
  async execute({ agentOutput }) {
    const fabricationPatterns = [
      /research\s+shows\s+\d+%/i,
      /studies\s+prove/i,
      /according\s+to\s+a\s+(recent\s+)?study\s+by\s+(?!Punjab|Sindh|Pakistan|FAO|ICARDA|PAR)/i,
      /\d{2,3}%\s+increase\s+in\s+yield/i,
      /guaranteed\s+results/i,
      /scientifically\s+proven/i,
    ];

    const text = typeof agentOutput === "string" ? agentOutput : JSON.stringify(agentOutput);
    const hasFabrication = fabricationPatterns.some(pattern => pattern.test(text));

    return {
      tripwireTriggered: hasFabrication,
      outputInfo: { hasFabrication, reason: hasFabrication ? "contains unverified claims" : "clean" },
    };
  },
};
