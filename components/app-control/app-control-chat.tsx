"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { PlusIcon, MenuIcon } from "@/components/icons";
import ChatBubble from "@/components/app-control/chat-bubble";
import ChatComposer from "@/components/app-control/chat-composer";
import ConfirmDialog from "@/app/(farmer)/(dashboard)/advisor/confirm-dialog";
import type { AppControlBundle } from "@/components/app-control/app-control-bundle";

type ChatMessage = {
  id: string;
  role: "farmer" | "agent" | "system";
  content: string;
  attachments?: Array<{ type: string; url: string; name: string }>;
};

type ConversationMeta = {
  id: string;
  title: string;
  updated_at: string;
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
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef(1);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/app-control/conversations");
    if (res.ok) {
      const data = await res.json();
      setConversations(data.conversations ?? []);
    }
  }, []);

  const loadMessages = useCallback(async (convId: string) => {
    const res = await fetch(`/api/app-control/messages/${convId}`);
    if (res.ok) {
      const data = await res.json();
      const msgs: ChatMessage[] = (data.messages ?? []).map((m: { id: string; role: string; content: string; attachments?: unknown }) => ({
        id: m.id,
        role: m.role as ChatMessage["role"],
        content: m.content,
        attachments: Array.isArray(m.attachments)
          ? m.attachments.map((a: { type?: string; url?: string; name?: string }) => ({ type: a.type ?? "image/jpeg", url: a.url ?? "", name: a.name ?? "image" }))
          : undefined,
      }));
      setMessages(msgs);
    }
  }, []);

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

  const openConversation = async (conv: ConversationMeta) => {
    setConversationId(conv.id);
    setMessages([]);
    setStreamingText("");
    setError(null);
    setSidebarOpen(false);
    await loadMessages(conv.id);
  };

  const handleNewConversation = async () => {
    const convId = await createConversation();
    setConversationId(convId);
    setMessages([]);
    setStreamingText("");
    setError(null);
    setSidebarOpen(false);
    await loadConversations();
  };

  const toggleSidebar = async () => {
    if (!sidebarOpen && conversations.length === 0) {
      await loadConversations();
    }
    setSidebarOpen(!sidebarOpen);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/app-control/conversations/${id}`, { method: "DELETE" });
    setDeleteId(null);
    if (conversationId === id) {
      setConversationId(null);
      setMessages([]);
    }
    await loadConversations();
  };

  const sendMessage = async (text: string, attachments: Array<{ type: string; url: string; name: string; size: number }>) => {
    if (thinking) return;

    let convId = conversationId;
    if (!convId) {
      try {
        convId = await createConversation();
        setConversationId(convId);
        await loadConversations();
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
              await loadConversations();
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
    <div className="flex h-full">
      {sidebarOpen && (
        <div className="w-64 border-e border-agro-sprout bg-white flex flex-col">
          <div className="flex items-center justify-between border-b border-agro-sprout px-3 py-2">
            <h3 className="text-sm font-semibold text-agro-ink">Conversations</h3>
            <button
              type="button"
              onClick={handleNewConversation}
              className="rounded-lg p-1.5 text-agro-ink/70 hover:bg-agro-stone/30"
              aria-label="New conversation"
            >
              <PlusIcon size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="px-3 py-2 text-xs text-agro-ink/50">No conversations yet</p>
            ) : (
              <ul className="py-1">
                {conversations.map((conv) => (
                  <li key={conv.id} className="group flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openConversation(conv)}
                      className={`flex-1 truncate px-3 py-2 text-start text-sm ${
                        conversationId === conv.id ? "bg-agro-leaf/15 text-agro-forest" : "text-agro-ink hover:bg-agro-stone/20"
                      }`}
                    >
                      <span className="truncate">{conv.title}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(conv.id)}
                      className="hidden rounded p-1 text-agro-ink/50 hover:text-agro-error group-hover:block"
                      aria-label="Delete conversation"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-agro-sprout px-3 py-2">
          <button
            type="button"
            onClick={toggleSidebar}
            className="rounded-lg p-1.5 text-agro-ink/70 hover:bg-agro-stone/30"
            aria-label="Toggle conversations"
          >
            <MenuIcon size={18} />
          </button>
          <h3 className="text-sm font-medium text-agro-ink">
            {conversationId ? conversations.find((c) => c.id === conversationId)?.title ?? "Chat" : "New chat"}
          </h3>
        </div>

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

      {deleteId && (
        <ConfirmDialog
          title={bundle.sidebar.deleteTitle}
          message={bundle.sidebar.deleteConfirm}
          confirmLabel={bundle.sidebar.delete}
          cancelLabel={bundle.sidebar.cancel}
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
