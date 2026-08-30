-- 0007 — Detect chat sessions and messages (specs/ai-crop-disease-detection/spec.md FR-10)

CREATE TABLE IF NOT EXISTS public.detect_chats (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  scan_id       uuid        REFERENCES public.detect_scans(id) ON DELETE SET NULL,
  title         text        NOT NULL DEFAULT 'New detection chat',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.detect_messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id         uuid        NOT NULL REFERENCES public.detect_chats(id) ON DELETE CASCADE,
  role            text        NOT NULL CHECK (role IN ('farmer', 'detect')),
  content         text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS detect_chats_account_idx
  ON public.detect_chats (account_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS detect_messages_chat_idx
  ON public.detect_messages (chat_id, created_at);
