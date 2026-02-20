-- ============================================================
-- Migration: 20240101000004_rls_policies.sql
-- Description: Row Level Security policies for all tables
-- Run this FOURTH in Supabase SQL Editor
--
-- auth.uid() = the UUID of the currently logged-in user
-- service_role key bypasses RLS entirely (server-side only)
-- ============================================================

-- ============================================================
-- USERS
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Anyone can read public profiles
CREATE POLICY "users_select_public"
  ON users FOR SELECT
  USING (true);

-- Users can only create their own profile
CREATE POLICY "users_insert_own"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- Users can only update their own profile
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING    (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- No client-side deletes (admin / service role only)

-- ============================================================
-- LISTINGS
-- ============================================================
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Anyone can read active listings; landlords can see their own inactive ones
CREATE POLICY "listings_select_public"
  ON listings FOR SELECT
  USING (status = 'active' OR landlord_id = auth.uid());

-- Authenticated users can create listings (must be the landlord)
CREATE POLICY "listings_insert_own"
  ON listings FOR INSERT
  WITH CHECK (landlord_id = auth.uid());

-- Landlords can update their own listings
CREATE POLICY "listings_update_own"
  ON listings FOR UPDATE
  USING    (landlord_id = auth.uid())
  WITH CHECK (landlord_id = auth.uid());

-- Landlords can delete their own listings
CREATE POLICY "listings_delete_own"
  ON listings FOR DELETE
  USING (landlord_id = auth.uid());

-- ============================================================
-- AMENITIES
-- ============================================================
ALTER TABLE amenities ENABLE ROW LEVEL SECURITY;

-- Public read (anyone can see available amenities)
CREATE POLICY "amenities_select_all"
  ON amenities FOR SELECT
  USING (true);

-- Write via service role only (managed by admin)

-- ============================================================
-- LISTING AMENITIES
-- ============================================================
ALTER TABLE listing_amenities ENABLE ROW LEVEL SECURITY;

-- Anyone can see which amenities a listing has
CREATE POLICY "listing_amenities_select_all"
  ON listing_amenities FOR SELECT
  USING (true);

-- Only the landlord of the listing can add amenities
CREATE POLICY "listing_amenities_insert_own"
  ON listing_amenities FOR INSERT
  WITH CHECK (
    listing_id IN (
      SELECT id FROM listings WHERE landlord_id = auth.uid()
    )
  );

-- Only the landlord can remove amenities
CREATE POLICY "listing_amenities_delete_own"
  ON listing_amenities FOR DELETE
  USING (
    listing_id IN (
      SELECT id FROM listings WHERE landlord_id = auth.uid()
    )
  );

-- ============================================================
-- LISTING IMAGES
-- ============================================================
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view images
CREATE POLICY "listing_images_select_all"
  ON listing_images FOR SELECT
  USING (true);

-- Only the landlord can upload images for their listing
CREATE POLICY "listing_images_insert_own"
  ON listing_images FOR INSERT
  WITH CHECK (
    listing_id IN (
      SELECT id FROM listings WHERE landlord_id = auth.uid()
    )
  );

-- Only the landlord can update image metadata (caption, sort order, cover)
CREATE POLICY "listing_images_update_own"
  ON listing_images FOR UPDATE
  USING (
    listing_id IN (
      SELECT id FROM listings WHERE landlord_id = auth.uid()
    )
  );

-- Only the landlord can delete images
CREATE POLICY "listing_images_delete_own"
  ON listing_images FOR DELETE
  USING (
    listing_id IN (
      SELECT id FROM listings WHERE landlord_id = auth.uid()
    )
  );

-- ============================================================
-- MESSAGES
-- ============================================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can only read messages they sent or received
CREATE POLICY "messages_select_participant"
  ON messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Authenticated users can send messages (sender must be self)
CREATE POLICY "messages_insert_own"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Only receiver can mark messages as read
CREATE POLICY "messages_update_read"
  ON messages FOR UPDATE
  USING    (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());

-- Sender can delete their own messages
CREATE POLICY "messages_delete_own"
  ON messages FOR DELETE
  USING (sender_id = auth.uid());

-- ============================================================
-- PAYMENT RECORDS
-- ============================================================
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

-- Payer can see their payments; landlord can see payments on their listings
CREATE POLICY "payments_select_participant"
  ON payment_records FOR SELECT
  USING (
    user_id = auth.uid()
    OR listing_id IN (
      SELECT id FROM listings WHERE landlord_id = auth.uid()
    )
  );

-- Only the payer can create a payment record
CREATE POLICY "payments_insert_own"
  ON payment_records FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- No client UPDATE — status changes must go through service role (webhook)

-- ============================================================
-- RENT AGREEMENTS
-- ============================================================
ALTER TABLE rent_agreements ENABLE ROW LEVEL SECURITY;

-- Tenant and landlord of the listing can view agreements
CREATE POLICY "agreements_select_participant"
  ON rent_agreements FOR SELECT
  USING (
    tenant_id = auth.uid()
    OR listing_id IN (
      SELECT id FROM listings WHERE landlord_id = auth.uid()
    )
  );

-- Only the tenant can initiate an agreement
CREATE POLICY "agreements_insert_tenant"
  ON rent_agreements FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

-- Both tenant and landlord can update (accept, terminate, etc.)
CREATE POLICY "agreements_update_participant"
  ON rent_agreements FOR UPDATE
  USING (
    tenant_id = auth.uid()
    OR listing_id IN (
      SELECT id FROM listings WHERE landlord_id = auth.uid()
    )
  );

-- ============================================================
-- GRANTS — give authenticated role baseline access
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON users             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON listings          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON listing_images    TO authenticated;
GRANT SELECT, INSERT, DELETE         ON listing_amenities TO authenticated;
GRANT SELECT                         ON amenities         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON messages          TO authenticated;
GRANT SELECT, INSERT                 ON payment_records   TO authenticated;
GRANT SELECT, INSERT, UPDATE         ON rent_agreements   TO authenticated;