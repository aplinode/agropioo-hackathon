CREATE TABLE IF NOT EXISTS app_control_conversations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       text        NOT NULL DEFAULT 'New conversation',
  language    text        NOT NULL DEFAULT 'en',
  summary     text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_control_conv_account_updated
  ON app_control_conversations(account_id, updated_at DESC);

ALTER TABLE app_control_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_control_conv_select_own"
  ON app_control_conversations FOR SELECT USING (true);

CREATE POLICY "app_control_conv_insert_own"
  ON app_control_conversations FOR INSERT WITH CHECK (true);

CREATE POLICY "app_control_conv_update_own"
  ON app_control_conversations FOR UPDATE USING (true);

CREATE POLICY "app_control_conv_delete_own"
  ON app_control_conversations FOR DELETE USING (true);

CREATE TABLE IF NOT EXISTS app_control_messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        NOT NULL REFERENCES app_control_conversations(id) ON DELETE CASCADE,
  role            text        NOT NULL CHECK (role IN ('farmer', 'agent', 'system')),
  content         text        NOT NULL,
  attachments     jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_control_msg_conv_created
  ON app_control_messages(conversation_id, created_at);

ALTER TABLE app_control_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_control_msg_select"
  ON app_control_messages FOR SELECT USING (true);

CREATE POLICY "app_control_msg_insert"
  ON app_control_messages FOR INSERT WITH CHECK (true);
