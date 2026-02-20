-- ============================================================
-- Migration: 006_create_conversations.sql
-- Description: Conversations and messages tables
-- Run AFTER 005_create_triggers.sql
-- ============================================================

-- ============================================================
-- TABLE: conversations
-- One row per unique user pair + listing combination.
-- user1_id is always < user2_id to prevent duplicate rows —
-- so (Alice→Bob) and (Bob→Alice) map to the same row.
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Participants (always stored in ascending UUID order)
  user1_id            UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id            UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Optional: tie the conversation to a listing
  listing_id          UUID        REFERENCES listings(id) ON DELETE SET NULL,

  -- Cached preview (updated by trigger on every new message)
  last_message        TEXT,
  last_message_at     TIMESTAMPTZ,
  last_message_sender UUID        REFERENCES users(id) ON DELETE SET NULL,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Enforce user1_id < user2_id so (A,B) and (B,A) are the same row
  CONSTRAINT conversations_user_order   CHECK (user1_id < user2_id),

  -- No self-conversations
  CONSTRAINT conversations_no_self      CHECK (user1_id <> user2_id),

  -- One conversation per user-pair per listing
  CONSTRAINT conversations_unique_pair  UNIQUE (user1_id, user2_id, listing_id)
);

COMMENT ON TABLE  conversations IS 'One conversation row per unique user-pair + listing';
COMMENT ON COLUMN conversations.user1_id IS 'Always the lesser UUID — enforced by CHECK constraint';
COMMENT ON COLUMN conversations.user2_id IS 'Always the greater UUID — enforced by CHECK constraint';
COMMENT ON COLUMN conversations.last_message IS 'Truncated preview cached by trigger on message insert';

-- ============================================================
-- TABLE: messages
-- Individual messages inside a conversation.
-- Replaces the flat messages table from migration 001.
-- ============================================================

-- Drop old flat messages table (safe — conversations replaces it)
DROP TABLE IF EXISTS messages CASCADE;

CREATE TABLE IF NOT EXISTS messages (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id        UUID        NOT NULL REFERENCES users(id)         ON DELETE CASCADE,

  -- Content
  content          TEXT        NOT NULL,
  message_type     TEXT        NOT NULL DEFAULT 'text',

  -- Read receipt — NULL means unread
  read_at          TIMESTAMPTZ,

  -- Soft delete — hides from UI without losing history
  deleted_at       TIMESTAMPTZ,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Content length guard
  CONSTRAINT messages_content_length CHECK (
    char_length(content) BETWEEN 1 AND 5000
  ),

  -- Only valid message types allowed
  CONSTRAINT messages_type_valid CHECK (
    message_type IN ('text', 'image', 'payment_request', 'agreement_invite')
  )
);

COMMENT ON TABLE  messages IS 'Individual messages scoped to a conversation';
COMMENT ON COLUMN messages.read_at    IS 'Set when the receiver reads the message. NULL = unread';
COMMENT ON COLUMN messages.deleted_at IS 'Soft delete — row kept but hidden in UI';
COMMENT ON COLUMN messages.message_type IS 'text | image | payment_request | agreement_invite';