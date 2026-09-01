"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AdvisorBundle } from "./advisor-bundle";
import AdvisorSidebar, { type ConversationMeta } from "./advisor-sidebar";
import MarkdownRender from "./markdown-render";
import {
  MenuIcon,
  SendIcon,
  SparklesIcon,
  SproutIcon,
} from "@/components/icons";
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

function Dots() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-agro-leaf" style={{ animationDelay: "0ms" }} />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-agro-leaf" style={{ animationDelay: "150ms" }} />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-agro-leaf" style={{ animationDelay: "300ms" }} />
    </span>
  );
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

  const hasContent = messages.length > 0 || streamingText;

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
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-agro-sprout bg-gradient-to-br from-agro-mint via-white to-agro-stone px-4 py-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-agro-canopy transition-colors hover:bg-agro-mint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-agro-canopy lg:hidden"
            aria-label={bundle.aria.openSidebar}
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-agro-leaf to-agro-forest text-white shadow-sm">
            <SproutIcon className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-base font-semibold text-agro-ink">
              {bundle.pageTitle}
            </h1>
            <p className="flex items-center gap-1.5 text-xs text-agro-slate">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-agro-success opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-agro-success" />
              </span>
              {bundle.chat.onlineStatus}
            </p>
          </div>
        </header>

        {/* Messages */}
        <div
          aria-live="polite"
          aria-label={bundle.aria.chatMessages}
          className="flex-1 overflow-y-auto bg-gradient-to-b from-agro-stone/50 to-white px-4 py-5"
        >
          {!hasContent && !error ? (
            /* Empty state hero */
            <div className="mx-auto flex max-w-xl flex-col items-center justify-center py-10 text-center">
              <div className="relative">
                <span className="absolute -inset-3 rounded-full bg-agro-leaf/15 blur-xl" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-agro-leaf to-agro-forest text-white shadow-lg">
                  <SparklesIcon className="h-8 w-8" />
                </div>
              </div>

              <p className="mt-6 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-agro-leaf">
                {bundle.chat.emptyEyebrow}
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-agro-forest sm:text-4xl">
                {bundle.chat.emptyTitle}
              </h2>
              <p
                dir={textDirection(bundle.chat.emptyBody)}
                className="mt-3 max-w-md text-sm leading-relaxed text-agro-slate"
              >
                {bundle.chat.emptyBody}
              </p>

              <div className="mt-8 w-full">
                <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-agro-cloud">
                  {bundle.chat.tryAsking}
                </p>
                <ul className="mt-4 flex flex-wrap justify-center gap-2">
                  {suggestedQuestions.map((q, i) => (
                    <li key={q}>
                      <button
                        type="button"
                        onClick={() => send(q)}
                        dir={textDirection(q)}
                        className="group inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border border-agro-sprout bg-white px-4 text-sm font-medium text-agro-canopy shadow-sm transition-all hover:-translate-y-0.5 hover:border-agro-leaf hover:bg-agro-mint hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-agro-canopy"
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <SparklesIcon className="h-3.5 w-3.5 text-agro-leaf" />
                        <span>{q}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.map((message) =>
                message.role === "farmer" ? (
                  <div
                    key={message.id}
                    className="flex justify-end gap-2"
                    dir={localeDir}
                  >
                    <div
                      dir={textDirection(message.text)}
                      className="max-w-[85%] rounded-2xl rounded-ee-md bg-gradient-to-br from-agro-canopy to-agro-forest px-4 py-3 text-sm leading-relaxed text-white shadow-sm sm:max-w-[75%]"
                    >
                      <p className="mb-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-white/70">
                        {bundle.chat.farmerYou}
                      </p>
                      <p>{message.text}</p>
                    </div>
                  </div>
                ) : (
                  <div key={message.id} className="flex items-start gap-2.5" dir={localeDir}>
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-agro-leaf to-agro-forest text-white shadow-sm">
                      <SproutIcon className="h-4 w-4" />
                    </div>
                    <div
                      dir={textDirection(message.text)}
                      className="max-w-[85%] rounded-2xl rounded-es-md border border-agro-sprout bg-white px-4 py-3 text-sm leading-relaxed text-agro-ink shadow-sm sm:max-w-[75%]"
                    >
                      <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-wider text-agro-leaf">
                        {bundle.pageTitle}
                      </p>
                      <MarkdownRender text={message.text} />
                    </div>
                  </div>
                ),
              )}

              {/* Streaming advisor message in progress */}
              {thinking && (
                <div className="flex items-start gap-2.5" dir={localeDir}>
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-agro-leaf to-agro-forest text-white shadow-sm">
                    <SproutIcon className="h-4 w-4" />
                  </div>
                  {streamingText ? (
                    <div
                      dir={textDirection(streamingText)}
                      className="max-w-[85%] rounded-2xl rounded-es-md border border-agro-sprout bg-white px-4 py-3 text-sm leading-relaxed text-agro-ink shadow-sm sm:max-w-[75%]"
                    >
                      <MarkdownRender text={streamingText} />
                      <span className="ms-1 inline-block h-4 w-0.5 animate-pulse bg-agro-canopy align-text-bottom" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 rounded-2xl rounded-es-md border border-agro-sprout bg-white px-4 py-3 shadow-sm">
                      <Dots />
                      <span className="sr-only">{bundle.chat.typing}</span>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="mx-auto flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
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
          dir={localeDir}
          className="sticky bottom-0 border-t border-agro-sprout bg-white/95 px-4 pb-3 pt-2 backdrop-blur"
        >
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-2 rounded-2xl border border-agro-sprout bg-white p-1.5 shadow-md transition-colors duration-200 focus-within:border-agro-canopy focus-within:ring-2 focus-within:ring-agro-canopy/20">
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
                aria-label={bundle.aria.sendMessage}
                className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-agro-canopy to-agro-forest px-5 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="hidden sm:inline">{bundle.chat.send}</span>
                <SendIcon className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 px-2 text-center text-[0.7rem] text-agro-cloud sm:text-start">
              {bundle.chat.composerHint}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
