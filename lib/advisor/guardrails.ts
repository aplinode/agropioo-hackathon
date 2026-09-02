import type { InputGuardrail, OutputGuardrail } from "@openai/agents";

// ─── Input Guardrails ────────────────────────────────────────────────────────

/**
 * Blocks non-farming queries. Uses keyword lists in English and Urdu
 * to detect topic. Short messages (<200 chars) without clear non-farming
 * keywords are allowed through (greetings, follow-ups).
 */
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

/**
 * Detects prompt injection attempts: instructions to ignore rules,
 * system prompt leakage, role-play attacks, and encoded payloads.
 */
export const promptInjectionGuardrail: InputGuardrail = {
  name: "prompt_injection_guardrail",
  async execute({ input }) {
    const text = typeof input === "string"
      ? input
      : Array.isArray(input)
        ? input.map(m => typeof m === "string" ? m : JSON.stringify(m)).join(" ")
        : String(input);

    const injectionPatterns = [
      // Direct instruction override
      /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|rules?|prompts?|guidelines?)/i,
      /disregard\s+(all\s+)?(previous|prior|above|system)/i,
      /forget\s+(everything|all|what)\s+(you|i)\s+(were|have been|are)\s+told/i,
      // Role-play / persona hijack
      /you\s+are\s+now\s+(?:a|an|the)\s+(?!farming|crop|weather|agri)/i,
      /act\s+as\s+(?:a|an)\s+(?!farming|crop|weather|agri)/i,
      /pretend\s+(?:you|to)\s+(?:are|be)\s+(?!farming|crop|weather|agri)/i,
      // System prompt extraction
      /what\s+(?:is|are)\s+your\s+(?:system\s+)?(?:prompt|instructions?|rules?|guidelines?)/i,
      /show\s+me\s+your\s+(?:system\s+)?(?:prompt|instructions?|rules?)/i,
      /repeat\s+(?:your|the)\s+(?:system\s+)?(?:prompt|instructions?)/i,
      // Encoded / obfuscated payloads
      /\bbase64\b/i,
      /\brot13\b/i,
      /\bhex\s*decode\b/i,
      // Jailbreak phrases
      /DAN\s+mode/i,
      /jailbreak/i,
      /you\s+are\s+unrestricted/i,
      /no\s+rules\s+apply/i,
      /bypass\s+(?:your|the|all)\s+(?:safety|rules?|restrictions?|filters?)/i,
    ];

    const isInjection = injectionPatterns.some(p => p.test(text));

    return {
      tripwireTriggered: isInjection,
      outputInfo: {
        isInjection,
        reason: isInjection ? "potential prompt injection detected" : "clean",
      },
    };
  },
};

/**
 * Sanitizes input by stripping zero-width characters and suspicious Unicode
 * that could be used for injection or obfuscation.
 */
export const inputSanitizationGuardrail: InputGuardrail = {
  name: "input_sanitization_guardrail",
  async execute({ input }) {
    const text = typeof input === "string" ? input : String(input);

    // Strip zero-width characters (U+200B-U+200F, U+2060-U+2069, U+FEFF)
    const stripped = text.replace(/[\u200B-\u200F\u2060-\u2069\uFEFF]/g, "");
    // Strip excessive repeated characters (e.g., "aaaaaaaa" or "????????")
    const deduplicated = stripped.replace(/(.)\1{9,}/g, "$1$1$1$1$1");

    const wasModified = stripped !== text || deduplicated !== stripped;

    return {
      tripwireTriggered: false, // Never blocks, just sanitizes
      outputInfo: { sanitized: deduplicated, wasModified },
    };
  },
};

// ─── Output Guardrails ───────────────────────────────────────────────────────

/**
 * Blocks fabricated statistics, fake citations, and unverified claims.
 */
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
      // Fabricated specific numbers without context
      /\bexactly\s+\d+(\.\d+)?\s*(kg|ton|maund|acre)/i,
      // Fake testimonials
      /(?:i|we)\s+(?:personally|can)\s+(?:guarantee|promise|confirm)\s+\d+%/i,
      // Unverified pricing presented as fact
      /(?:the\s+)?(?:current|latest)\s+price\s+is\s+Rs\s*\d+/i,
    ];

    const text = typeof agentOutput === "string" ? agentOutput : JSON.stringify(agentOutput);
    const hasFabrication = fabricationPatterns.some(pattern => pattern.test(text));

    return {
      tripwireTriggered: hasFabrication,
      outputInfo: { hasFabrication, reason: hasFabrication ? "contains unverified claims" : "clean" },
    };
  },
};

/**
 * Ensures language consistency in responses. Detects if the response
 * contains significant mixing of English and Urdu script.
 */
export const languageConsistencyGuardrail: OutputGuardrail = {
  name: "language_consistency_guardrail",
  async execute({ agentOutput }) {
    const text = typeof agentOutput === "string" ? agentOutput : JSON.stringify(agentOutput);
    if (!text || text.length < 20) {
      return { tripwireTriggered: false, outputInfo: { consistent: true } };
    }

    const urduScriptRe = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
    const hasUrdu = urduScriptRe.test(text);

    if (!hasUrdu) {
      return { tripwireTriggered: false, outputInfo: { consistent: true, language: "en" } };
    }

    // Check for significant English mixing in what should be an Urdu response
    const sentences = text.split(/[.!؟\n]+/).filter(s => s.trim().length > 0);
    let mixedSentences = 0;

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length < 5) continue;

      const urduChars = (trimmed.match(urduScriptRe) || []).length;
      const totalChars = trimmed.replace(/\s/g, "").length;
      if (totalChars === 0) continue;

      const urduRatio = urduChars / totalChars;
      // Sentence has less than 30% Urdu but is longer than 10 chars — likely English mixing
      if (urduRatio < 0.3 && trimmed.length > 10) {
        mixedSentences++;
      }
    }

    const mixingDetected = mixedSentences > 0;
    return {
      tripwireTriggered: false, // Log but don't block — the prompt already enforces consistency
      outputInfo: {
        consistent: !mixingDetected,
        mixedSentences,
        reason: mixingDetected ? `Detected ${mixedSentences} sentences with language mixing` : "consistent",
      },
    };
  },
};

/**
 * Safety boundary guardrail: blocks responses that contain dangerous
 * advice like specific pesticide dosages not from the knowledge base,
 * or recommendations that could cause harm.
 */
export const safetyBoundaryGuardrail: OutputGuardrail = {
  name: "safety_boundary_guardrail",
  async execute({ agentOutput }) {
    const text = typeof agentOutput === "string" ? agentOutput : JSON.stringify(agentOutput);

    const dangerousPatterns = [
      // Specific dosages that aren't hedged (should say "approximately" or come from KB)
      /(?:apply|use|inject|give)\s+\d+(\.\d+)?\s*(ml|g|kg|tablet|dose)\s+(?:per|each|every)\s+(?:animal|plant|tree|acre)/i,
      // Recommendations to use prescription-only chemicals
      /(?:use|apply|give)\s+(?:chlorpyrifos|monocrotophos|phosphamidon|phorate)\s+(?:\d|tablet|dose)/i,
      // Medical advice for humans
      /(?:human|person|you|your)\s+(?:should|must|take|use)\s+(?:medicine|tablet|drug|antibiotic)/i,
      // Electrical/hazardous advice
      /(?:connect|wire|install)\s+(?:directly|without)\s+(?:earthing|grounding|breaker)/i,
    ];

    const isDangerous = dangerousPatterns.some(p => p.test(text));

    return {
      tripwireTriggered: isDangerous,
      outputInfo: {
        isDangerous,
        reason: isDangerous ? "potentially dangerous advice detected" : "safe",
      },
    };
  },
};

/**
 * Output length guardrail: warns when response exceeds expected length.
 * Does not block but logs for cost monitoring.
 */
export const outputLengthGuardrail: OutputGuardrail = {
  name: "output_length_guardrail",
  async execute({ agentOutput }) {
    const text = typeof agentOutput === "string" ? agentOutput : JSON.stringify(agentOutput);
    const charCount = text.length;

    // Warn if response is excessively long (>4000 chars for a chat response)
    const isExcessive = charCount > 4000;
    // Block if absurdly long (>10000 chars — likely an error)
    const isAbsurd = charCount > 10000;

    return {
      tripwireTriggered: isAbsurd,
      outputInfo: {
        charCount,
        isExcessive,
        isAbsurd,
        reason: isAbsurd
          ? "response exceeds maximum length"
          : isExcessive
            ? "response is longer than typical"
            : "within bounds",
      },
    };
  },
};

// ─── Exported guardrail bundles ──────────────────────────────────────────────

/** All input guardrails applied to every advisor request. */
export const advisorInputGuardrails: InputGuardrail[] = [
  inputSanitizationGuardrail,
  farmingOnlyGuardrail,
  promptInjectionGuardrail,
];

/** All output guardrails applied to every advisor response. */
export const advisorOutputGuardrails: OutputGuardrail[] = [
  noFabricationGuardrail,
  safetyBoundaryGuardrail,
  languageConsistencyGuardrail,
  outputLengthGuardrail,
];
