"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AdvisorBundle } from "./advisor-bundle";
import AdvisorSidebar, { type ConversationMeta } from "./advisor-sidebar";
import MarkdownRender from "./markdown-render";
import { MenuIcon } from "@/components/icons";
import { LOCALE_REGISTRY, type Locale } from "@/lib/i18n/config";

type Props = { bundle: AdvisorBundle; appLocale?: Locale; initialDraft?: string };

type ChatMessage = {
  id: string;
  role: "advisor" | "farmer";
  text: string;
  streaming?: boolean;
};

const ARABIC_URDU_RE = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

function textDirection(text: string): "rtl" | "ltr" {
  return ARABIC_URDU_RE.test(text) ? "rtl" : "ltr";
}

export default function AdvisorChat({ bundle, appLocale, initialDraft }: Props) {
  const localeDir = appLocale ? LOCALE_REGISTRY[appLocale].dir : "ltr";
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState(initialDraft ?? "");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const nextIdRef = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (initialDraft && inputRef.current) {
      inputRef.current.focus();
    }
  }, [initialDraft]);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/advisor/conversations");
      if (!res.ok) return;
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } catch {
      /* silent — sidebar shows empty state */
    }
  }, []);

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/advisor/messages/${convId}`);
      if (!res.ok) return;
      const data = await res.json();
      const loaded: ChatMessage[] = (data.messages ?? []).map(
        (m: { id: string; role: string; content: string }) => ({
          id: m.id,
          role: m.role === "farmer" ? "farmer" as const : "advisor" as const,
          text: m.content,
        }),
      );
      setMessages(loaded);
      nextIdRef.current = loaded.length + 1;
    } catch {
      /* silent — empty chat */
    }
  }, []);

  useEffect(() => {
    // Initial sidebar load: setState only inside the promise callback
    // (allowed pattern for syncing with an external system).
    fetch("/api/advisor/conversations")
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null)
      .then((data: { conversations?: ConversationMeta[] } | null) => {
        if (data?.conversations) setConversations(data.conversations);
      });
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages, thinking, streamingText]);

  async function selectConversation(id: string) {
    abortRef.current?.abort();
    setActiveConvId(id);
    setThinking(false);
    setStreamingText("");
    setError(null);
    await loadMessages(id);
  }

  async function newConversation() {
    abortRef.current?.abort();
    setActiveConvId(null);
    setMessages([]);
    setThinking(false);
    setStreamingText("");
    setError(null);
    setDraft("");
  }

  async function handleRename(id: string, title: string) {
    try {
      const res = await fetch(`/api/advisor/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, title } : c)),
        );
      }
    } catch {
      /* silent */
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/advisor/conversations/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeConvId === id) {
          setActiveConvId(null);
          setMessages([]);
        }
      }
    } catch {
      /* silent */
    }
  }

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || thinking) return;

    setDraft("");
    setError(null);

    const farmerMsg: ChatMessage = {
      id: `msg-${nextIdRef.current++}`,
      role: "farmer",
      text: clean,
    };
    setMessages((prev) => [...prev, farmerMsg]);
    setThinking(true);
    setStreamingText("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/advisor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(activeConvId ? { conversationId: activeConvId } : {}),
          message: clean,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const status = res.status;
        if (status === 503) setError(bundle.errors.serviceUnavailable);
        else if (status === 429) setError(bundle.errors.rateLimited);
        else setError(bundle.errors.generic);
        setThinking(false);
        return;
      }

      if (!res.body) {
        setError(bundle.errors.generic);
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

        // SSE events can split across chunk boundaries — keep the trailing
        // partial line buffered until its newline arrives.
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (!payload) continue;

          try {
            const event = JSON.parse(payload);

            if (event.type === "conversation") {
              // Bind follow-up messages to this conversation (FR-10.7) unless
              // the farmer switched away mid-stream.
              if (!controller.signal.aborted) setActiveConvId(event.id);
            } else if (event.type === "text") {
              accumulated += event.delta;
              setStreamingText(accumulated);
            } else if (event.type === "done") {
              accumulated = event.output || accumulated;
            } else if (event.type === "error") {
              setError(event.message || bundle.errors.generic);
            }
          } catch {
            /* skip malformed SSE lines */
          }
        }
      }

      setThinking(false);
      setStreamingText("");

      if (accumulated) {
        const advisorMsg: ChatMessage = {
          id: `msg-${nextIdRef.current++}`,
          role: "advisor",
          text: accumulated,
        };
        setMessages((prev) => [...prev, advisorMsg]);
      }

      await loadConversations();
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(bundle.errors.network);
      setThinking(false);
      setStreamingText("");
    }
  }

  const suggestedQuestions = [
    bundle.chat.suggested1,
    bundle.chat.suggested2,
    bundle.chat.suggested3,
    bundle.chat.suggested4,
  ];

  return (
    <div className="flex flex-1 overflow-hidden">
      <AdvisorSidebar
        bundle={bundle}
        conversations={conversations}
        activeId={activeConvId}
        onSelect={selectConversation}
        onNew={newConversation}
        onRename={handleRename}
        onDelete={handleDelete}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header with sidebar toggle */}
        <div className="flex items-center gap-3 border-b border-agro-sprout px-4 py-2">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-agro-slate transition-colors hover:bg-agro-mint"
            aria-label={bundle.aria.openSidebar}
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <h1 className="text-sm font-semibold text-agro-ink">{bundle.pageTitle}</h1>
        </div>

        {/* Messages */}
        <div
          aria-live="polite"
          aria-label={bundle.aria.chatMessages}
          className="flex-1 overflow-y-auto px-4 py-4"
        >
          {messages.length === 0 && !thinking ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="max-w-sm text-sm leading-relaxed text-agro-slate">
                {bundle.chat.openingGreeting}
              </p>
              <div className="mt-6">
                <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-agro-cloud">
                  {bundle.chat.tryAsking}
                </p>
                <ul className="mt-3 flex flex-wrap justify-center gap-2">
                  {suggestedQuestions.map((q) => (
                    <li key={q}>
                      <button
                        type="button"
                        onClick={() => send(q)}
                        dir={textDirection(q)}
                        className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-agro-sprout bg-white px-3.5 text-sm font-medium text-agro-canopy transition-colors hover:bg-agro-mint"
                      >
                        {q}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "farmer" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    dir={textDirection(message.text)}
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%] ${
                      message.role === "farmer"
                        ? "rounded-ee-md bg-agro-canopy text-white"
                        : "rounded-es-md border border-agro-sprout bg-white text-agro-ink"
                    }`}
                  >
                    {message.role === "advisor" ? (
                      <MarkdownRender text={message.text} />
                    ) : (
                      <p>{message.text}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Streaming message in progress */}
              {thinking && streamingText && (
                <div className="flex justify-start">
                  <div
                    dir={textDirection(streamingText)}
                    className="max-w-[85%] rounded-2xl rounded-es-md border border-agro-sprout bg-white px-4 py-3 text-sm leading-relaxed text-agro-ink sm:max-w-[75%]"
                  >
                    <MarkdownRender text={streamingText} />
                    <span className="ms-1 inline-block h-4 w-0.5 animate-pulse bg-agro-canopy" />
                  </div>
                </div>
              )}

              {/* Thinking indicator (before any text arrives) */}
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
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
          className="sticky bottom-0 border-t border-agro-sprout bg-white/95 px-4 py-3 backdrop-blur"
        >
          <div className="flex items-center gap-2 rounded-2xl border border-agro-sprout bg-white p-2 shadow-md transition-colors duration-200 focus-within:border-agro-canopy focus-within:ring-2 focus-within:ring-agro-canopy/20">
            <label htmlFor="advisor-input" className="sr-only">
              {bundle.chat.placeholder}
            </label>
            <input
              id="advisor-input"
              name="message"
              type="text"
              autoComplete="off"
              dir={localeDir}
              placeholder={bundle.chat.placeholder}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              ref={inputRef}
              className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm text-agro-ink placeholder:text-agro-cloud outline-none"
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
      </div>
    </div>
  );
}
