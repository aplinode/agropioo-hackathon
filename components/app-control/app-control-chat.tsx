"use client";
import { useEffect, useRef, useState } from "react";
import ChatBubble from "@/components/app-control/chat-bubble";
import ChatComposer from "@/components/app-control/chat-composer";
import type { AppControlBundle } from "@/components/app-control/app-control-bundle";

type ChatMessage = {
  id: string;
  role: "farmer" | "agent" | "system";
  content: string;
  attachments?: Array<{ type: string; url: string; name: string }>;
};

type Props = {
  bundle: AppControlBundle;
};

export default function SimpleAppControlChat({ bundle }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef(1);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const createConversation = async (): Promise<string> => {
    const res = await fetch("/api/app-control/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: "en" }),
    });
    if (!res.ok) throw new Error("Failed to create conversation");
    const data = await res.json();
    return data.conversation.id;
  };

  const sendMessage = async (text: string, attachments: Array<{ type: string; url: string; name: string; size: number }>) => {
    if (thinking) return;

    let convId = conversationId;
    if (!convId) {
      try {
        convId = await createConversation();
        setConversationId(convId);
      } catch {
        setError("Could not start conversation. Please refresh.");
        return;
      }
    }

    const farmerMessage: ChatMessage = {
      id: `local-${nextIdRef.current++}`,
      role: "farmer",
      content: text,
      attachments: attachments.map((a) => ({ type: a.type, url: a.url, name: a.name })),
    };

    setMessages((prev) => [...prev, farmerMessage]);
    setThinking(true);
    setError(null);
    setStreamingText("");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const formData = new FormData();
      formData.append("message", text);
      formData.append("conversationId", convId);
      for (const att of attachments) {
        const blob = await fetch(att.url).then((r) => r.blob());
        formData.append("attachments", blob, att.name);
      }

      const res = await fetch("/api/app-control/chat", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message ?? "Failed to send message");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullOutput = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") continue;
          try {
            const event = JSON.parse(payload);
            if (event.type === "text") {
              fullOutput += event.delta;
              setStreamingText(fullOutput);
            } else if (event.type === "done") {
              const agentMessage: ChatMessage = {
                id: `local-${nextIdRef.current++}`,
                role: "agent",
                content: event.output,
              };
              setMessages((prev) => [...prev, agentMessage]);
              setStreamingText("");
            } else if (event.type === "error") {
              setError(event.message);
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message ?? "Something went wrong.");
      }
    } finally {
      setThinking(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-agro-stone/50 to-white px-4 py-3">
        {messages.length === 0 && !streamingText && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-3xl bg-gradient-to-br from-agro-leaf to-agro-forest p-4 text-white">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <p className="text-sm font-medium text-agro-ink/70">{bundle.chat.emptyEyebrow}</p>
            <h3 className="mt-1 text-lg font-semibold text-agro-ink">{bundle.chat.emptyTitle}</h3>
            <p className="mt-2 text-sm text-agro-ink/60">{bundle.chat.emptyBody}</p>
            <div className="mt-6 grid grid-cols-2 gap-2 text-left">
              {[bundle.chat.suggested1, bundle.chat.suggested2, bundle.chat.suggested3, bundle.chat.suggested4].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(suggestion, [])}
                  className="rounded-xl border border-agro-sprout bg-white px-3 py-2 text-xs text-agro-ink hover:border-agro-canopy hover:text-agro-canopy"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}

        {thinking && (
          <div className="mb-3 flex justify-start">
            <div className="rounded-2xl rounded-es-md border border-agro-sprout bg-white px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-agro-canopy [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-agro-canopy [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-agro-canopy" />
                <span className="ml-2 text-xs text-agro-ink/60">{bundle.chat.thinking}</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-3 flex justify-start">
            <div className="rounded-2xl rounded-es-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <ChatComposer onSend={sendMessage} disabled={thinking} placeholder={bundle.chat.composerHint} />
    </div>
  );
}
