"use client";

import { useEffect, useRef, useState } from "react";
import type { DetectBundle } from "./detect-bundle";
import type { DiagnosisResult } from "./detect-types";
import { XIcon } from "@/components/icons";
import MarkdownRender from "../advisor/markdown-render";

type Role = "farmer" | "detect";

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  created_at?: string;
}

interface DetectChatProps {
  bundle: DetectBundle;
  chatId: string | null;
  initialMessages: ChatMessage[];
  initialDraft?: string;
  diagnosis: DiagnosisResult;
  onNewScan: () => void;
}

const MAX_TEXTAREA_HEIGHT = 160;

export default function DetectChat({
  bundle,
  chatId,
  initialMessages,
  initialDraft,
  diagnosis,
  onNewScan,
}: DetectChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState(() => {
    if (chatId) {
      try {
        const saved = localStorage.getItem(`detect-draft-${chatId}`);
        if (saved) return saved;
      } catch {
        // localStorage not available
      }
    }
    return initialDraft ?? "";
  });
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Reset local chat state when the active chat changes so the
  // composer and message list do not retain stale data from a previous session.
  /* eslint-disable react-hooks/set-state-in-effect -- required to sync local chat state with prop changes */
  /* eslint-disable react-hooks/exhaustive-deps -- intentional: reset when chatId or initialMessages change */
  useEffect(() => {
    setMessages(initialMessages);

    if (chatId) {
      try {
        const saved = localStorage.getItem(`detect-draft-${chatId}`);
        setDraft(saved ?? initialDraft ?? "");
      } catch {
        setDraft(initialDraft ?? "");
      }
    } else {
      setDraft("");
    }

    setError(null);
    setStreamingText("");
    setThinking(false);
    setPreviewOpen(false);
  }, [chatId, initialMessages]);
  /* eslint-enable react-hooks/exhaustive-deps */
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!chatId) return;
    try {
      if (draft) {
        localStorage.setItem(`detect-draft-${chatId}`, draft);
      } else {
        localStorage.removeItem(`detect-draft-${chatId}`);
      }
    } catch {
      // localStorage not available
    }
  }, [chatId, draft]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages, thinking, streamingText]);

  useEffect(() => {
    if (chatId && initialMessages.length === 0 && inputRef.current) {
      inputRef.current.focus();
    }
  }, [chatId, initialMessages.length]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    if (el.scrollHeight > MAX_TEXTAREA_HEIGHT) {
      el.style.height = `${MAX_TEXTAREA_HEIGHT}px`;
      el.style.overflowY = "auto";
    } else {
      el.style.height = `${el.scrollHeight}px`;
      el.style.overflowY = "hidden";
    }
  }, [draft]);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || thinking || !chatId) return;

    setDraft("");
    setError(null);

    const farmerMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "farmer",
      content: clean,
    };
    setMessages((prev) => [...prev, farmerMsg]);
    setThinking(true);
    setStreamingText("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/detect/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, message: clean }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error?.message || "Service temporarily unavailable.");
        setThinking(false);
        return;
      }

      if (!res.body) {
        setError("Service temporarily unavailable.");
        setThinking(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (!payload) continue;

          try {
            const event = JSON.parse(payload);
            if (event.type === "text") {
              accumulated += event.delta;
              setStreamingText(accumulated);
            } else if (event.type === "done") {
              accumulated = event.output || accumulated;
            } else if (event.type === "error") {
              setError(event.message || "Service temporarily unavailable.");
            }
          } catch {
            /* skip malformed SSE lines */
          }
        }
      }

      setThinking(false);
      setStreamingText("");

      if (accumulated) {
        const detectMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: "detect",
          content: accumulated,
        };
        setMessages((prev) => [...prev, detectMsg]);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError("Network error. Please try again.");
      setThinking(false);
      setStreamingText("");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(draft);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function handleNewScan() {
    onNewScan();
  }

  const showImageBubble = diagnosis.imageUrl && !thinking;

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-agro-sprout px-4 py-2">
        <div>
          <h1 className="text-sm font-semibold text-agro-ink">Detection Chat</h1>
          <p className="text-xs text-agro-slate">
            {diagnosis.diseaseName} — {diagnosis.crop}
          </p>
        </div>
        <button
          type="button"
          onClick={handleNewScan}
          className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg bg-agro-canopy px-4 text-xs font-semibold text-white transition-colors hover:bg-agro-forest"
        >
          {bundle.chat.newScan}
        </button>
      </div>

      {/* Messages */}
      <div
        aria-live="polite"
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {showImageBubble && (
          <div className="mb-3 flex justify-start">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="rounded-2xl rounded-es-md border border-agro-sprout bg-white p-1 transition-colors hover:border-agro-canopy"
              aria-label={bundle.chat.imagePreview}
            >
              <img
                src={diagnosis.imageUrl}
                alt="Scanned leaf"
                className="h-40 w-auto max-w-[200px] rounded-xl object-cover"
              />
            </button>
          </div>
        )}
        {messages.length === 0 && !thinking ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="max-w-sm text-sm leading-relaxed text-agro-slate">
              {bundle.chat.emptyState}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "farmer" ? "justify-end" : "justify-start"}`}
              >
                <div
                  dir="ltr"
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%] ${
                    message.role === "farmer"
                      ? "rounded-ee-md bg-agro-canopy text-white"
                      : "rounded-es-md border border-agro-sprout bg-white text-agro-ink"
                  }`}
                >
                  {message.role === "detect" ? (
                    <MarkdownRender text={message.content} />
                  ) : (
                    <p>{message.content}</p>
                  )}
                </div>
              </div>
            ))}

            {thinking && streamingText && (
              <div className="flex justify-start">
                <div
                  dir="ltr"
                  className="max-w-[85%] rounded-2xl rounded-es-md border border-agro-sprout bg-white px-4 py-3 text-sm leading-relaxed text-agro-ink sm:max-w-[75%]"
                >
                  <MarkdownRender text={streamingText} />
                  <span className="ms-1 inline-block h-4 w-0.5 animate-pulse bg-agro-canopy" />
                </div>
              </div>
            )}

            {thinking && !streamingText && (
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-agro-slate">
                {bundle.chat.thinking}
              </p>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 border-t border-agro-sprout bg-white/95 px-4 py-3 backdrop-blur"
      >
        <div className="flex items-end gap-2 rounded-2xl border border-agro-sprout bg-white p-2 shadow-md transition-colors duration-200 focus-within:border-agro-canopy focus-within:ring-2 focus-within:ring-agro-canopy/20 focus-within:ring-offset-1">
          <label htmlFor="detect-chat-input" className="sr-only">
            {bundle.chat.placeholder}
          </label>
          <textarea
            id="detect-chat-input"
            name="message"
            autoComplete="off"
            placeholder={bundle.chat.placeholder}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            ref={inputRef}
            className="max-h-[160px] min-h-[44px] min-w-0 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-agro-ink placeholder:text-agro-cloud outline-none"
            style={{ height: "auto", overflowY: "hidden" }}
          />
          <button
            type="submit"
            disabled={!draft.trim() || thinking}
            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-agro-canopy px-5 text-sm font-semibold text-white transition-colors hover:bg-agro-forest disabled:cursor-not-allowed disabled:opacity-50"
          >
            {bundle.chat.send}
          </button>
        </div>
      </form>

      {/* Image preview popup */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="absolute -top-10 right-0 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label={bundle.chat.closePreview}
            >
              <XIcon size={20} />
            </button>
            <img
              src={diagnosis.imageUrl}
              alt="Scanned leaf preview"
              className="max-h-[85vh] max-w-[85vw] rounded-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
