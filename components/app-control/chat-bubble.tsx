"use client";
import { textDirection } from "@/lib/i18n/logic";

type ChatMessage = {
  id: string;
  role: "farmer" | "agent" | "system";
  content: string;
  attachments?: Array<{ type: string; url: string; name: string }>;
  created_at?: string;
};

type Props = {
  message: ChatMessage;
  isStreaming?: boolean;
  streamingText?: string;
  dir?: "ltr" | "rtl";
};

export default function ChatBubble({ message, isStreaming, streamingText, dir }: Props) {
  const isFarmer = message.role === "farmer";
  const text = isStreaming && streamingText !== undefined ? streamingText : message.content;
  const direction = dir ?? textDirection(text);
  const isLong = text.length > 300;

  return (
    <div className={`flex ${isFarmer ? "justify-end" : "justify-start"} mb-3`}>
      <div
        dir={direction}
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isFarmer
            ? "rounded-ee-md bg-gradient-to-br from-agro-canopy to-agro-forest text-white"
            : "rounded-es-md border border-agro-sprout bg-white"
        }`}
      >
        {message.role === "system" && (
          <div className="mb-1 text-xs font-medium text-agro-ink/60">{message.content}</div>
        )}

        {message.attachments && message.attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {message.attachments.map((att, i) => (
              <a
                key={i}
                href={att.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-agro-sprout bg-agro-stone/30 px-2 py-1 text-xs text-agro-ink"
              >
                <span>📎</span>
                <span className="max-w-[120px] truncate">{att.name}</span>
              </a>
            ))}
          </div>
        )}

        <div className={isLong && !isStreaming ? "line-clamp-4" : ""}>
          {text || <span className="text-agro-ink/40">…</span>}
        </div>

        {isLong && !isStreaming && (
          <button
            type="button"
            className="mt-1 text-xs font-medium text-agro-canopy underline-offset-2 hover:underline"
            onClick={() => {
              const el = document.getElementById(`msg-${message.id}`);
              el?.classList.toggle("line-clamp-4");
            }}
          >
            Show more
          </button>
        )}

        {isStreaming && (
          <span className="ml-1 inline-block h-2 w-2 animate-pulse rounded-full bg-agro-canopy" />
        )}
      </div>
    </div>
  );
}
