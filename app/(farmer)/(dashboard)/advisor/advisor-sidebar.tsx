"use client";

import { useState } from "react";
import type { AdvisorBundle } from "./advisor-bundle";
import ConfirmDialog from "./confirm-dialog";
import {
  CloseIcon,
  PencilIcon,
  PlusIcon,
  SproutIcon,
  XIcon,
} from "@/components/icons";

export type ConversationMeta = {
  id: string;
  title: string;
  updated_at: string;
};

type Props = {
  bundle: AdvisorBundle;
  conversations: ConversationMeta[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  open: boolean;
  onClose: () => void;
};

export default function AdvisorSidebar({
  bundle,
  conversations,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
  open,
  onClose,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleting, setDeleting] = useState<ConversationMeta | null>(null);

  function startRename(conv: ConversationMeta) {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  }

  function commitRename() {
    if (editingId && editTitle.trim()) {
      onRename(editingId, editTitle.trim());
    }
    setEditingId(null);
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 start-0 z-50 flex w-72 flex-col border-e border-agro-sprout bg-white transition-transform duration-200 lg:relative lg:inset-auto lg:z-auto lg:w-64 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-agro-sprout bg-gradient-to-br from-agro-mint via-white to-agro-stone px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-agro-leaf to-agro-forest text-white">
              <SproutIcon className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-semibold text-agro-ink">
              {bundle.sidebar.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-agro-slate hover:bg-agro-mint lg:hidden"
            aria-label={bundle.sidebar.closeSidebar}
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="px-3 py-2">
          <button
            type="button"
            onClick={() => { onNew(); onClose(); }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-agro-canopy to-agro-forest px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110"
          >
            <PlusIcon className="h-4 w-4" />
            {bundle.sidebar.newConversation}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1">
          {conversations.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-agro-cloud">
              {bundle.sidebar.noConversations}
            </p>
          ) : (
            <ul className="space-y-0.5">
              {conversations.map((conv) => (
                <li key={conv.id}>
                  {editingId === conv.id ? (
                    <div className="flex items-center gap-1 rounded-xl bg-agro-mint/40 px-2 py-1.5">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="min-w-0 flex-1 rounded bg-white px-2 py-1 text-sm text-agro-ink outline-none focus:ring-1 focus:ring-agro-canopy"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={commitRename}
                        className="shrink-0 rounded p-1 text-agro-canopy hover:bg-white"
                      >
                        <span className="text-xs font-semibold">OK</span>
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`group flex items-center gap-1 rounded-xl px-2 py-2 transition-colors ${
                        activeId === conv.id
                          ? "bg-agro-leaf/15 text-agro-ink ring-1 ring-inset ring-agro-leaf/30"
                          : "text-agro-slate hover:bg-agro-mint/40"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => { onSelect(conv.id); onClose(); }}
                        className="min-w-0 flex-1 text-start text-sm truncate"
                      >
                        {conv.title}
                      </button>
                      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => startRename(conv)}
                          className="rounded p-1 text-agro-slate hover:bg-white hover:text-agro-canopy"
                          aria-label={bundle.sidebar.rename}
                        >
                          <PencilIcon className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(conv)}
                          className="rounded p-1 text-agro-slate hover:bg-white hover:text-agro-error"
                          aria-label={bundle.sidebar.delete}
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {deleting && (
        <ConfirmDialog
          title={bundle.sidebar.deleteTitle}
          message={bundle.sidebar.deleteConfirm}
          confirmLabel={bundle.sidebar.delete}
          cancelLabel={bundle.sidebar.cancel}
          onConfirm={() => {
            onDelete(deleting.id);
            setDeleting(null);
          }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
