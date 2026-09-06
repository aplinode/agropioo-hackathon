"use client";
import { XIcon, PlusIcon } from "@/components/icons";

type ConversationMeta = {
  id: string;
  title: string;
  updated_at: string;
};

type Props = {
  conversations: ConversationMeta[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

export default function AppControlTabs({ conversations, activeId, onSelect, onNew, onDelete, onClose }: Props) {
  return (
    <div className="flex items-center gap-1 border-b border-agro-sprout bg-white/80 px-2 py-1.5 backdrop-blur">
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-1.5 text-agro-ink/60 hover:bg-agro-stone/30"
        aria-label="Close app control"
      >
        <XIcon size={18} />
      </button>

      <div className="flex flex-1 items-center gap-1 overflow-x-auto">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
              activeId === conv.id
                ? "bg-agro-leaf/15 text-agro-forest ring-1 ring-inset ring-agro-leaf/30"
                : "text-agro-ink/70 hover:bg-agro-stone/20"
            }`}
          >
            <span className="max-w-[120px] truncate">{conv.title}</span>
            {conversations.length > 1 && (
              <span
                className="rounded-full p-0.5 text-agro-ink/40 hover:text-agro-error"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conv.id);
                }}
              >
                <XIcon size={12} />
              </span>
            )}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onNew}
        className="rounded-lg p-1.5 text-agro-ink/60 hover:bg-agro-stone/30"
        aria-label="New tab"
      >
        <PlusIcon size={18} />
      </button>
    </div>
  );
}
