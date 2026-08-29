-- Migration 0004: Conversation summaries for advisor memory

ALTER TABLE advisor_conversations
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS summary_updated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_conv_summary
  ON advisor_conversations(account_id, summary_updated_at DESC)
  WHERE summary IS NOT NULL;
