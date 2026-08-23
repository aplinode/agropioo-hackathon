"use client";

import { useEffect, useRef, useState } from "react";
import {
  demoAdvisory,
  demoFarmer,
} from "@/app/(dashboard)/dashboard/demo-data";
import {
  advisorReplies,
  defaultReply,
  openingMessage,
  suggestedQuestions,
} from "./demo-data";

type ChatMessage = {
  id: number;
  role: "advisor" | "farmer";
  text: string;
};

/* AI Advisor chat (UI-only demo): a seeded conversation, suggestion chips,
   and canned keyword-matched replies. Voice is out of scope — text only. */
export default function AdvisorChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, role: "advisor", text: openingMessage },
  ]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const nextIdRef = useRef(1);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  /* Keep the newest message in view as the conversation grows. */
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages, thinking]);

  function replyFor(question: string): string {
    const lowered = question.toLowerCase();
    const match = advisorReplies.find((candidate) =>
      candidate.keywords.some((keyword) => lowered.includes(keyword))
    );
    return match?.reply ?? defaultReply;
  }

  function send(text: string) {
    const clean = text.trim();
    if (!clean || thinking) return;
    setDraft("");
    setMessages((current) => [
      ...current,
      { id: nextIdRef.current++, role: "farmer", text: clean },
    ]);
    setThinking(true);
    // Canned demo reply. Swap for POST /api/advisor once wired.
    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        { id: nextIdRef.current++, role: "advisor", text: replyFor(clean) },
      ]);
      setThinking(false);
    }, 1100);
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Demo affordance */}
      <p className="rounded-xl border border-dashed border-agro-cloud/70 bg-agro-stone px-4 py-2.5 text-center font-mono text-xs tracking-wide text-agro-slate">
        DEMO · replies are canned samples, no model is connected yet
      </p>

      {/* Transcript */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-label="Advisor conversation"
        className="mt-5 space-y-3"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "farmer" ? "justify-end" : "justify-start"}`}
          >
            <p
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%] ${
                message.role === "farmer"
                  ? "rounded-ee-md bg-agro-canopy text-white"
                  : "rounded-es-md border border-agro-clay bg-white text-agro-ink"
              }`}
            >
              {message.text}
            </p>
          </div>
        ))}
        {thinking && (
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-agro-cloud">
            Advisor is writing…
          </p>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggestion chips */}
      <div className="mt-6">
        <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-agro-slate">
          Try asking
        </p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {suggestedQuestions.map((question) => (
            <li key={question}>
              <button
                type="button"
                onClick={() => send(question)}
                disabled={thinking}
                className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-agro-sprout bg-white px-3.5 text-sm font-medium text-agro-canopy transition-colors hover:bg-agro-mint disabled:cursor-not-allowed disabled:opacity-50"
              >
                {question}
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() =>
                send(`What should I do about my ${demoAdvisory.crop.toLowerCase()} at ${demoFarmer.location}?`)
              }
              disabled={thinking}
              className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-agro-sprout bg-white px-3.5 text-sm font-medium text-agro-canopy transition-colors hover:bg-agro-mint disabled:cursor-not-allowed disabled:opacity-50"
            >
              About my farm today?
            </button>
          </li>
        </ul>
      </div>

      {/* Composer */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(draft);
        }}
        className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] mt-4 flex items-center gap-2 rounded-2xl border border-agro-clay bg-white/95 p-2 shadow-md backdrop-blur lg:bottom-4"
      >
        <label htmlFor="advisor-input" className="sr-only">
          Ask the advisor
        </label>
        <input
          id="advisor-input"
          name="message"
          type="text"
          autoComplete="off"
          placeholder="Ask anything about your crop…"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm text-agro-ink placeholder:text-agro-cloud focus:outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim() || thinking}
          className="inline-flex h-11 w-14 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-agro-canopy text-sm font-semibold text-white transition-colors hover:bg-agro-forest disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
          <span className="sr-only">message</span>
        </button>
      </form>
    </div>
  );
}
