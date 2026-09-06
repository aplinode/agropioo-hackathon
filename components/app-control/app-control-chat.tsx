"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { AppControlBundle } from "@/components/app-control/app-control-bundle";
import type { ConversationMeta } from "@/components/app-control/app-control-sidebar";
import AppControlSidebar from "@/components/app-control/app-control-sidebar";
import AppControlTabs from "@/components/app-control/app-control-tabs";
import ChatBubble from "@/components/app-control/chat-bubble";
import ChatComposer from "@/components/app-control/chat-composer";
import { usePageContext } from "@/lib/app-control/page-context";

type TabState = {
  conversationId: string;
  messages: Array<{ id: string; role: "farmer" | "agent" | "system"; content: string; attachments?: Array<{ type: string; url: string; name: string }> }>;
  streamingText: string;
  thinking: boolean;
  error: string | null;
};

type Props = {
  bundle: AppControlBundle;
};

export default function AppControlChat({ bundle }: Props) {
  const pageContext = usePageContext();
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [tabs, setTabs] = useState<TabState[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef(1);

  const activeTab = tabs[activeTabIndex];

  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/app-control/conversations");
    if (res.ok) {
      const data = await res.json();
      setConversations(data.conversations ?? []);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    const res = await fetch(`/api/app-control/messages/${conversationId}`);
    if (res.ok) {
      const data = await res.json();
      const messages: ChatMessage[] = (data.messages ?? []).map((m: { id: string; role: string; content: string; attachments?: unknown; created_at?: string }) => ({
        id: m.id,
        role: m.role as ChatMessage["role"],
        content: m.content,
        attachments: Array.isArray(m.attachments) ? m.attachments.map((a: { type?: string; url?: string; name?: string }) => ({ type: a.type ?? "image/jpeg", url: a.url ?? "", name: a.name ?? "image" })) : undefined,
        created_at: m.created_at,
      }));
      setTabs((prev) => prev.map((tab) => (tab.conversationId === conversationId ? { ...tab, messages } : tab)));
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeTab?.messages, activeTab?.streamingText]);

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

  const openTab = async (conversationId?: string) => {
    let convId = conversationId;
    if (!convId) {
      convId = await createConversation();
    }
    setTabs((prev) => {
      const exists = prev.find((t) => t.conversationId === convId);
      if (exists) {
        const idx = prev.indexOf(exists);
        setActiveTabIndex(idx);
        return prev;
      }
      const newTab: TabState = { conversationId: convId, messages: [], streamingText: "", thinking: false, error: null };
      const newTabs = [...prev, newTab];
      setActiveTabIndex(newTabs.length - 1);
      return newTabs;
    });
    await loadConversations();
    await loadMessages(convId);
  };

  const closeTab = async (index: number) => {
    const tab = tabs[index];
    abortControllersRef.current.get(tab.conversationId)?.abort();
    abortControllersRef.current.delete(tab.conversationId);
    const newTabs = tabs.filter((_, i) => i !== index);
    setTabs(newTabs);
    if (activeTabIndex >= newTabs.length) {
      setActiveTabIndex(Math.max(0, newTabs.length - 1));
    }
  };

  const sendMessage = async (text: string, attachments: Array<{ type: string; url: string; name: string; size: number }>) => {
    if (!activeTab) return;
    const convId = activeTab.conversationId;

    const farmerMessage: ChatMessage = {
      id: `local-${nextIdRef.current++}`,
      role: "farmer",
      content: text,
      attachments: attachments.map((a) => ({ type: a.type, url: a.url, name: a.name })),
    };

    setTabs((prev) => prev.map((tab) => (tab.conversationId === convId ? { ...tab, messages: [...tab.messages, farmerMessage], thinking: true, error: null } : tab)));

    const controller = new AbortController();
    abortControllersRef.current.set(convId, controller);

    try {
      const formData = new FormData();
      formData.append("message", text);
      formData.append("conversationId", convId);
      for (const att of attachments) {
        const blob = await fetch(att.url).then((r) => r.blob());
        formData.append("attachments", blob, att.name);
      }

      const pageCtx = pageContext || { currentPath: "", pageState: {} };
      const res = await fetch("/api/app-control/chat", {
        method: "POST",
        body: formData,
        headers: { "X-Page-Context": JSON.stringify(pageCtx) },
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
              setTabs((prev) => prev.map((tab) => (tab.conversationId === convId ? { ...tab, streamingText: fullOutput } : tab)));
            } else if (event.type === "action_card") {
              const agentMsg: ChatMessage = {
                id: `local-${nextIdRef.current++}`,
                role: "agent",
                content: fullOutput || "Action card",
              };
              setTabs((prev) => prev.map((tab) => (tab.conversationId === convId ? { ...tab, messages: [...tab.messages, agentMsg], streamingText: "", thinking: false, actionCard: event.card } : tab)));
              fullOutput = "";
            } else if (event.type === "navigation_button") {
              const agentMsg: ChatMessage = {
                id: `local-${nextIdRef.current++}`,
                role: "agent",
                content: fullOutput || `Navigate to ${event.path}`,
              };
              setTabs((prev) => prev.map((tab) => (tab.conversationId === convId ? { ...tab, messages: [...tab.messages, agentMsg], streamingText: "", thinking: false, navigation: event } : tab)));
              fullOutput = "";
            } else if (event.type === "retry") {
              setTabs((prev) => prev.map((tab) => (tab.conversationId === convId ? { ...tab, error: event.message } : tab)));
            } else if (event.type === "done") {
              const agentMsg: ChatMessage = {
                id: `local-${nextIdRef.current++}`,
                role: "agent",
                content: event.output,
              };
              setTabs((prev) => prev.map((tab) => (tab.conversationId === convId ? { ...tab, messages: [...tab.messages, agentMsg], streamingText: "", thinking: false } : tab)));
              await loadMessages(convId);
              await loadConversations();
            } else if (event.type === "error") {
              setTabs((prev) => prev.map((tab) => (tab.conversationId === convId ? { ...tab, error: event.message, thinking: false } : tab)));
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setTabs((prev) => prev.map((tab) => (tab.conversationId === convId ? { ...tab, error: (err as Error).message, thinking: false } : tab)));
    } finally {
      abortControllersRef.current.delete(convId);
    }
  };

  const handleRetry = () => {
    if (!activeTab) return;
    setTabs((prev) => prev.map((tab) => (tab.conversationId === activeTab.conversationId ? { ...tab, error: null } : tab)));
    const lastFarmer = [...activeTab.messages].reverse().find((m) => m.role === "farmer");
    if (lastFarmer) {
      sendMessage(lastFarmer.content, []);
    }
  };

  const handleRename = async (id: string, title: string) => {
    await fetch(`/api/app-control/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    await loadConversations();
    setTabs((prev) => prev.map((tab) => (tab.conversationId === id ? { ...tab } : tab)));
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/app-control/conversations/${id}`, { method: "DELETE" });
    await closeTab(tabs.findIndex((t) => t.conversationId === id));
    await loadConversations();
  };

  if (!activeTab) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-agro-stone/50 to-white p-6 text-center">
        <div className="mb-4 rounded-3xl bg-gradient-to-br from-agro-leaf to-agro-forest p-4 text-white">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
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
    );
  }

  return (
    <div className="flex h-full">
      {sidebarOpen && (
        <div className="w-64 border-e border-agro-sprout bg-white">
          <AppControlSidebar
            conversations={conversations}
            activeId={activeTab.conversationId}
            onSelect={(id) => { openTab(id); setSidebarOpen(false); }}
            onNew={() => openTab()}
            onRename={handleRename}
            onDelete={handleDelete}
            bundle={bundle}
          />
        </div>
      )}

      <div className="flex flex-1 flex-col">
        <AppControlTabs
          conversations={conversations}
          activeId={activeTab.conversationId}
          onSelect={openTab}
          onNew={() => openTab()}
          onRename={handleRename}
          onDelete={handleDelete}
          onClose={() => closeTab(activeTabIndex)}
          bundle={bundle}
        />

        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-agro-stone/50 to-white px-4 py-3">
          {activeTab.messages.map((msg) => (
            <div key={msg.id} id={`msg-${msg.id}`}>
              <ChatBubble message={msg} />
            </div>
          ))}

          {activeTab.thinking && (
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

          {activeTab.error && (
            <div className="mb-3 flex justify-start">
              <div className="rounded-2xl rounded-es-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <p>{activeTab.error}</p>
                <button type="button" onClick={handleRetry} className="mt-2 text-xs font-medium underline">
                  {bundle.chat.retry}
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <ChatComposer onSend={sendMessage} disabled={activeTab.thinking} placeholder={bundle.chat.composerHint} />
      </div>
    </div>
  );
}
