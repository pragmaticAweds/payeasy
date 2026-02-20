-- ============================================================
-- Migration: 008_conversation_rls.sql
-- Description: Row Level Security for conversations + messages
-- Run AFTER 007_conversation_indexes.sql
-- ============================================================

-- ============================================================
-- CONVERSATIONS
-- ============================================================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Users can only see conversations they are part of
CREATE POLICY "Users can only see their conversations"
  ON conversations FOR SELECT
  USING (
    user1_id = auth.uid() OR user2_id = auth.uid()
  );

-- Users can only create a conversation they belong to
CREATE POLICY "Users can create their own conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    user1_id = auth.uid() OR user2_id = auth.uid()
  );

-- Participants can update (trigger updates last_message cache)
CREATE POLICY "Participants can update conversations"
  ON conversations FOR UPDATE
  USING (
    user1_id = auth.uid() OR user2_id = auth.uid()
  );

-- No hard deletes from the client (admin / service role only)

-- ============================================================
-- MESSAGES
-- ============================================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can only read messages from their own conversations
CREATE POLICY "Users can only see their messages"
  ON messages FOR SELECT
  USING (
    deleted_at IS NULL
    AND conversation_id IN (
      SELECT id FROM conversations
      WHERE user1_id = auth.uid()
         OR user2_id = auth.uid()
    )
  );

-- Only the sender can insert a message into their conversation
CREATE POLICY "Users can only send their own messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT id FROM conversations
      WHERE user1_id = auth.uid()
         OR user2_id = auth.uid()
    )
  );

-- Participants can update:
--   receiver  → sets read_at (mark as read)
--   sender    → sets deleted_at (soft delete)
CREATE POLICY "Participants can update messages"
  ON messages FOR UPDATE
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE user1_id = auth.uid()
         OR user2_id = auth.uid()
    )
  );

-- ============================================================
-- GRANTS
-- ============================================================
GRANT SELECT, INSERT, UPDATE ON conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON messages      TO authenticated;