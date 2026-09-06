"use client";
import { useRef, useState } from "react";
import { SendIcon, PlusIcon } from "@/components/icons";

type Props = {
  onSend: (text: string, attachments: Array<{ type: string; url: string; name: string; size: number }>) => void;
  disabled?: boolean;
  placeholder?: string;
};

export default function ChatComposer({ onSend, disabled, placeholder }: Props) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Array<{ type: string; url: string; name: string; size: number }>>([]);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    setError(null);
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        setError(`"${file.name}" is too large (max 10 MB)`);
        continue;
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError(`"${file.name}" has an unsupported type`);
        continue;
      }
      const url = URL.createObjectURL(file);
      setAttachments((prev) => [...prev, { type: file.type, url, name: file.name, size: file.size }]);
    }
  };

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;
    onSend(trimmed, attachments);
    setText("");
    setAttachments([]);
    setError(null);
  };

  return (
    <div className="border-t border-agro-sprout bg-white/95 backdrop-blur">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-agro-sprout/50 px-3 py-2">
          {attachments.map((att, i) => (
            <div key={i} className="flex items-center gap-1.5 rounded-lg border border-agro-sprout bg-agro-stone/30 px-2 py-1 text-xs">
              <span className="max-w-[100px] truncate">{att.name}</span>
              <button
                type="button"
                className="text-agro-ink/60 hover:text-agro-error"
                onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                aria-label="Remove attachment"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <div className="border-b border-agro-sprout/50 px-3 py-1.5 text-xs text-agro-error">{error}</div>}

      <div className="flex items-end gap-2 px-3 py-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          type="button"
          className="rounded-xl p-2 text-agro-ink/60 hover:bg-agro-stone/30"
          onClick={() => fileRef.current?.click()}
          aria-label="Attach file"
          disabled={disabled}
        >
          <PlusIcon size={20} />
        </button>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder ?? "Type a command or question…"}
          disabled={disabled}
          rows={1}
          className="max-h-32 flex-1 resize-none rounded-xl border border-agro-sprout bg-white px-3 py-2 text-sm outline-none focus:border-agro-canopy focus:ring-1 focus:ring-agro-canopy disabled:opacity-50"
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled || (!text.trim() && attachments.length === 0)}
          className="rounded-xl bg-gradient-to-br from-agro-canopy to-agro-forest p-2 text-white hover:from-agro-forest hover:to-agro-canopy disabled:opacity-40"
          aria-label="Send message"
        >
          <SendIcon size={20} />
        </button>
      </div>
    </div>
  );
}
