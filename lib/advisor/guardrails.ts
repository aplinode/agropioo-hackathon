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
      // English
      "crop", "farm", "plant", "sow", "harvest", "irrigat", "fertiliz", "pesticid",
      "disease", "pest", "weed", "seed", "soil", "water", "rain", "weather",
      "spray", "urea", "dap", "zinc", "rust", "blight", "bollworm", "whitefly",
      "vegetable", "fruit", "orchard", "livestock", "cattle", "buffalo", "goat",
      "poultry", "chicken", "milk", "egg", "feed", "vaccin", "dairy",
      "tractor", "tube well", "canal", "land", "acre", "plot", "field",
      "mandi", "price", "rate", "scheme", "subsidy", "loan", "kissan",
      "organic", "compost", "greenhouse", "tunnel", "drip",
      // Major crops (English + Urdu)
      "wheat", "cotton", "rice", "maize", "sugarcane",
      "gandum", "kapaas", "chawal", "makai", "ganna", "khet", "sinchai",
      // Vegetables (Urdu transliteration)
      "tamatar", "pyaaz", "mirch", "aaloo", "bhindi", "tori", "karela",
      "gobi", "shalgam", "mooli", "baingan", "lauki", "tinda", "kaddu",
      // Fruits (Urdu transliteration)
      "aam", "kinnow", "malta", "anaar", "angoor", "seeb", "amrood",
      // Pulses (Urdu transliteration)
      "moong", "mash", "masoor", "chana", "arhar", "lobia",
      // Livestock (Urdu transliteration)
      "bhains", "gaye", "bakri", "murgi", "murghi", "anda", "doodh",
      "chara", "wanda", "khurak",
      // Farm-related phrases
      "farm record", "my farm", "how are my farms",
    ];

    const nonFarmingKeywords = [
      "politics", "election", "vote", "cricket", "football", "movie", "song",
      "joke", "who won", "stock market", "bitcoin", "crypto", "medical diagnosis",
      "prescription", "love advice", "relationship", "dating", "horoscope",
      "astrology", "lottery", "gambling", "betting", "religion", "prayer",
      "recipe", "cooking", "fashion", "makeup", "travel booking",
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
