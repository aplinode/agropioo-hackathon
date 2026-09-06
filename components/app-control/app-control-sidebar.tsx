"use client";
import { useState } from "react";
import { PlusIcon, XIcon } from "@/components/icons";
import ConfirmDialog from "@/app/(farmer)/(dashboard)/advisor/confirm-dialog";

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
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  bundle: {
    sidebar: {
      title: string;
      newConversation: string;
      noConversations: string;
      rename: string;
      delete: string;
      deleteTitle: string;
      deleteConfirm: string;
      cancel: string;
      closeSidebar: string;
    };
  };
};

export default function AppControlSidebar({ conversations, activeId, onSelect, onNew, onRename, onDelete, bundle }: Props) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const startRename = (id: string, title: string) => {
    setRenamingId(id);
    setRenameValue(title);
  };

  const submitRename = (id: string) => {
    const trimmed = renameValue.trim();
    if (trimmed) onRename(id, trimmed);
    setRenamingId(null);
    setRenameValue("");
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-agro-sprout px-4 py-3">
        <h2 className="text-sm font-semibold text-agro-ink">{bundle.sidebar.title}</h2>
        <button
          type="button"
          onClick={onNew}
          className="rounded-lg p-1.5 text-agro-ink/70 hover:bg-agro-stone/30"
          aria-label={bundle.sidebar.newConversation}
        >
          <PlusIcon size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {conversations.length === 0 ? (
          <p className="px-2 text-xs text-agro-ink/50">{bundle.sidebar.noConversations}</p>
        ) : (
          <ul className="space-y-1">
            {conversations.map((conv) => (
              <li
                key={conv.id}
                className={`group flex items-center gap-2 rounded-lg px-2 py-2 ${
                  activeId === conv.id ? "bg-agro-leaf/15 ring-1 ring-inset ring-agro-leaf/30" : "hover:bg-agro-stone/20"
                }`}
              >
                {renamingId === conv.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => submitRename(conv.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitRename(conv.id);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className="flex-1 rounded-md bg-agro-mint/40 px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-agro-canopy"
                  />
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onSelect(conv.id)}
                      className="flex-1 truncate text-start text-sm"
                      title={conv.title}
                    >
                      {conv.title}
                    </button>
                    <div className="hidden gap-0.5 group-hover:flex">
                      <button
                        type="button"
                        onClick={() => startRename(conv.id, conv.title)}
                        className="rounded p-1 text-agro-ink/50 hover:text-agro-ink"
                        aria-label={bundle.sidebar.rename}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(conv.id)}
                        className="rounded p-1 text-agro-ink/50 hover:text-agro-error"
                        aria-label={bundle.sidebar.delete}
                      >
                        <XIcon size={14} />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {deleteId && (
        <ConfirmDialog
          title={bundle.sidebar.deleteTitle}
          message={bundle.sidebar.deleteConfirm}
          confirmLabel={bundle.sidebar.delete}
          cancelLabel={bundle.sidebar.cancel}
          onConfirm={() => {
            onDelete(deleteId);
            setDeleteId(null);
          }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </>
  );
}
