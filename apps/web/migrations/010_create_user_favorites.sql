-- ============================================================
-- Migration: 010_create_user_favorites.sql
-- Description: User favorites / bookmarks for listings
-- ============================================================

CREATE TABLE IF NOT EXISTS user_favorites (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, listing_id)
);

-- Fast lookup: "all favorites for a user, newest first"
CREATE INDEX idx_user_favorites_user_created
  ON user_favorites (user_id, created_at DESC);

-- Fast lookup: "how many people favorited this listing"
CREATE INDEX idx_user_favorites_listing
  ON user_favorites (listing_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Users can only see their own favorites
CREATE POLICY "user_favorites_select_own"
  ON user_favorites FOR SELECT
  USING (user_id = auth.uid());

-- Users can only add favorites for themselves
CREATE POLICY "user_favorites_insert_own"
  ON user_favorites FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can only remove their own favorites
CREATE POLICY "user_favorites_delete_own"
  ON user_favorites FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- GRANTS
-- ============================================================
GRANT SELECT, INSERT, DELETE ON user_favorites TO authenticated;
