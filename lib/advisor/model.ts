/* Single source of truth for the model every advisor agent runs on. Every
   agent must set this explicitly — the Agents SDK falls back to its own
   OpenAI default model for agents without one, which sends GPT-5-only request
   fields (text.verbosity, reasoning.effort) that OpenAI-compatible providers
   like Groq reject. */

export function advisorModel(): string {
  return process.env.ADVISOR_MODEL ?? "gpt-4o-mini";
}
