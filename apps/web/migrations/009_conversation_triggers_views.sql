-- ============================================================
-- Migration: 009_conversation_triggers_views.sql
-- Description: Triggers, views, and RPC helper functions
-- Run AFTER 008_conversation_rls.sql
-- ============================================================

-- ============================================================
-- TRIGGER: auto-update conversations.updated_at
-- (reuses trigger_set_updated_at from 005_create_triggers.sql)
-- ============================================================
CREATE TRIGGER set_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TRIGGER: cache last message preview on conversations
-- Fires after every INSERT into messages
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_update_conversation_preview()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE conversations
  SET
    -- Truncate to 100 chars for inbox preview
    last_message        = LEFT(NEW.content, 100),
    last_message_at     = NEW.created_at,
    last_message_sender = NEW.sender_id,
    updated_at          = NOW()
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER update_conversation_preview
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION trigger_update_conversation_preview();

-- ============================================================
-- RPC: get_or_create_conversation
-- Handles user1_id < user2_id ordering automatically.
-- Call this from your API instead of raw INSERT.
--
-- Usage from Postman / Next.js:
--   POST /rest/v1/rpc/get_or_create_conversation
--   { "user_a": "<uuid>", "user_b": "<uuid>", "p_listing": "<uuid>" }
-- ============================================================
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  user_a    UUID,
  user_b    UUID,
  p_listing UUID DEFAULT NULL
)
RETURNS conversations LANGUAGE plpgsql AS $$
DECLARE
  lo    UUID;
  hi    UUID;
  conv  conversations;
BEGIN
  -- Sort so lo < hi regardless of argument order
  IF user_a < user_b THEN
    lo := user_a; hi := user_b;
  ELSE
    lo := user_b; hi := user_a;
  END IF;

  -- Try existing conversation first
  SELECT * INTO conv
  FROM   conversations
  WHERE  user1_id   = lo
    AND  user2_id   = hi
    AND  (
      listing_id = p_listing
      OR (listing_id IS NULL AND p_listing IS NULL)
    );

  -- Create if not found
  IF NOT FOUND THEN
    INSERT INTO conversations (user1_id, user2_id, listing_id)
    VALUES (lo, hi, p_listing)
    RETURNING * INTO conv;
  END IF;

  RETURN conv;
END;
$$;

-- ============================================================
-- RPC: mark_conversation_read
-- Marks all unread messages in a conversation as read
-- for the calling user.
--
-- Usage: POST /rest/v1/rpc/mark_conversation_read
--   { "p_conversation_id": "<uuid>" }
-- ============================================================
CREATE OR REPLACE FUNCTION mark_conversation_read(p_conversation_id UUID)
RETURNS void LANGUAGE sql AS $$
  UPDATE messages
  SET    read_at = NOW()
  WHERE  conversation_id = p_conversation_id
    AND  sender_id      <> auth.uid()   -- only mark others' messages
    AND  read_at         IS NULL
    AND  deleted_at      IS NULL;
$$;

-- ============================================================
-- RPC: get_unread_count
-- Returns total unread message count across all conversations.
-- Powers the notification badge in the UI.
--
-- Usage: POST /rest/v1/rpc/get_unread_count
--   (no body needed)
-- ============================================================
CREATE OR REPLACE FUNCTION get_unread_count()
RETURNS INTEGER LANGUAGE sql STABLE AS $$
  SELECT COUNT(*)::INTEGER
  FROM   messages  m
  JOIN   conversations c ON c.id = m.conversation_id
  WHERE  (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    AND  m.sender_id  <> auth.uid()
    AND  m.read_at     IS NULL
    AND  m.deleted_at  IS NULL;
$$;

-- ============================================================
-- VIEW: inbox
-- One row per conversation for the current user.
-- Includes other user's profile, listing info, and unread count.
--
-- Usage: GET /rest/v1/inbox
-- ============================================================
CREATE OR REPLACE VIEW inbox AS
SELECT
  c.id                AS conversation_id,
  c.listing_id,
  c.last_message,
  c.last_message_at,
  c.last_message_sender,
  c.created_at,
  c.updated_at,

  -- The other participant
  CASE
    WHEN c.user1_id = auth.uid() THEN c.user2_id
    ELSE c.user1_id
  END                 AS other_user_id,

  other.username      AS other_username,
  other.avatar_url    AS other_avatar_url,
  other.public_key    AS other_public_key,

  -- Listing snapshot
  l.title             AS listing_title,
  l.city              AS listing_city,
  l.rent_xlm          AS listing_rent_xlm,

  -- Unread messages sent by the other person
  (
    SELECT COUNT(*)
    FROM   messages m
    WHERE  m.conversation_id = c.id
      AND  m.sender_id       <> auth.uid()
      AND  m.read_at          IS NULL
      AND  m.deleted_at       IS NULL
  )                   AS unread_count

FROM conversations c

JOIN users other ON other.id = CASE
  WHEN c.user1_id = auth.uid() THEN c.user2_id
  ELSE c.user1_id
END

LEFT JOIN listings l ON l.id = c.listing_id

WHERE c.user1_id = auth.uid()
   OR c.user2_id = auth.uid()

ORDER BY c.last_message_at DESC NULLS LAST;

COMMENT ON VIEW inbox IS
  'Inbox per user. Filter by conversation_id for a single thread. Includes unread count.';

-- ============================================================
-- VIEW: conversation_thread
-- All messages for a conversation, oldest first.
-- Filter by conversation_id when querying.
--
-- Usage: GET /rest/v1/conversation_thread?conversation_id=eq.<uuid>
-- ============================================================
CREATE OR REPLACE VIEW conversation_thread AS
SELECT
  m.id,
  m.conversation_id,
  m.sender_id,
  m.content,
  m.message_type,
  m.read_at,
  m.created_at,

  -- True when the calling user is the sender
  (m.sender_id = auth.uid()) AS is_mine,

  -- Sender profile
  u.username                  AS sender_username,
  u.avatar_url                AS sender_avatar_url

FROM  messages m
JOIN  users    u ON u.id = m.sender_id

WHERE m.deleted_at IS NULL
  AND m.conversation_id IN (
    SELECT id FROM conversations
    WHERE  user1_id = auth.uid()
       OR  user2_id = auth.uid()
  )

ORDER BY m.created_at ASC;

COMMENT ON VIEW conversation_thread IS
  'Chat thread view. Always filter by conversation_id. Excludes soft-deleted messages.';