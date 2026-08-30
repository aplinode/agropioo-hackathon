"use client";

import { useCallback, useState } from "react";
import { ChatIcon } from "@/components/icons";
import type { DetectBundle } from "./detect-bundle";

export interface DetectChatMeta {
  id: string;
  title: string;
  scanId: string | null;
  updatedAt: string;
}

interface DetectChatHistoryProps {
  bundle: DetectBundle;
  initialChats: DetectChatMeta[];
  onSelectChat: (chat: DetectChatMeta) => void;
  activeChatId?: string | null;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function DetectChatHistory({
  bundle,
  initialChats,
  onSelectChat,
  activeChatId,
}: DetectChatHistoryProps) {
  const [chats, setChats] = useState<DetectChatMeta[]>(initialChats);

  const loadMore = useCallback(async () => {
    try {
      const res = await fetch("/api/detect/chats");
      if (!res.ok) return;
      const data: { chats: DetectChatMeta[] } = await res.json();
      setChats(data.chats ?? []);
    } catch {
      /* keep existing results on network error */
    }
  }, []);

  if (chats.length === 0) {
    return (
      <p className="mt-3 text-center text-sm text-agro-slate">
        {bundle.chat.noSessions}
      </p>
    );
  }

  return (
    <>
      <ul className="mt-3 space-y-2">
        {chats.map((chat) => (
          <li key={chat.id}>
            <button
              type="button"
              onClick={() => onSelectChat(chat)}
              className={`flex w-full items-center gap-3 rounded-2xl border border-agro-sprout bg-white p-3 text-start transition-colors hover:bg-agro-mint ${
                activeChatId === chat.id ? "border-agro-canopy bg-agro-mint/60" : ""
              }`}
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-agro-mint text-agro-canopy">
                <ChatIcon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-agro-ink">
                  {chat.title}
                </span>
                <span className="block font-mono text-[0.65rem] text-agro-slate">
                  {formatDate(chat.updatedAt)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={loadMore}
        className="mt-4 inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-agro-canopy/30 bg-white px-4 text-sm font-semibold text-agro-forest transition-colors hover:border-agro-canopy hover:bg-agro-mint"
      >
        {bundle.loadMore}
      </button>
    </>
  );
}
