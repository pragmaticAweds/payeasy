-- ============================================================
-- Migration: 007_conversation_indexes.sql
-- Description: Indexes for conversations and messages
-- Run AFTER 006_create_conversations.sql
-- ============================================================

-- -------------------------------------------------------
-- CONVERSATIONS
-- -------------------------------------------------------

-- Inbox page: all conversations for user1
CREATE INDEX IF NOT EXISTS idx_conversations_user1
  ON conversations(user1_id, updated_at DESC);

-- Inbox page: all conversations for user2
CREATE INDEX IF NOT EXISTS idx_conversations_user2
  ON conversations(user2_id, updated_at DESC);

-- Lookup by user pair (used when starting a new conversation)
CREATE INDEX IF NOT EXISTS idx_conversations_users
  ON conversations(user1_id, user2_id);

-- Filter conversations by listing
CREATE INDEX IF NOT EXISTS idx_conversations_listing
  ON conversations(listing_id);

-- Sort inbox by most recent message
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at
  ON conversations(last_message_at DESC NULLS LAST);

-- -------------------------------------------------------
-- MESSAGES
-- -------------------------------------------------------

-- Load chat thread (all messages in a conversation, oldest first)
CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON messages(conversation_id, created_at ASC)
  WHERE deleted_at IS NULL;

-- Unread badge count (only unread, non-deleted messages)
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON messages(conversation_id, read_at)
  WHERE read_at IS NULL AND deleted_at IS NULL;

-- All messages sent by a specific user
CREATE INDEX IF NOT EXISTS idx_messages_sender
  ON messages(sender_id, created_at DESC);

-- Active messages only (excludes soft-deleted rows)
CREATE INDEX IF NOT EXISTS idx_messages_active
  ON messages(conversation_id)
  WHERE deleted_at IS NULL;