-- ============================================================
-- Migration: 20240101000003_create_indexes.sql
-- Description: Performance indexes for all tables
-- Run this THIRD in Supabase SQL Editor
-- ============================================================

-- -------------------------------------------------------
-- USERS
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_public_key
  ON users(public_key);

CREATE INDEX IF NOT EXISTS idx_users_username
  ON users(lower(username));

-- -------------------------------------------------------
-- LISTINGS — core
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_listings_landlord_id
  ON listings(landlord_id);

CREATE INDEX IF NOT EXISTS idx_listings_status
  ON listings(status);

-- Partial: active listings only (powers the homepage feed)
CREATE INDEX IF NOT EXISTS idx_active_listings
  ON listings(landlord_id, created_at DESC)
  WHERE status = 'active';

-- -------------------------------------------------------
-- LISTINGS — search filters (all partial on active)
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_listings_city
  ON listings(lower(city))
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_listings_rent_xlm
  ON listings(rent_xlm)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_listings_bedrooms
  ON listings(bedrooms)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_listings_bathrooms
  ON listings(bathrooms)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_listings_property_type
  ON listings(property_type)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_listings_furnished
  ON listings(furnished)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_listings_pet_friendly
  ON listings(pet_friendly)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_listings_move_in_date
  ON listings(move_in_date)
  WHERE status = 'active';

-- Composite: most common combined filter (city + beds + price)
CREATE INDEX IF NOT EXISTS idx_listings_search_composite
  ON listings(status, city, bedrooms, rent_xlm);

-- -------------------------------------------------------
-- LISTINGS — full-text search (GIN)
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_listings_fts
  ON listings
  USING GIN (to_tsvector('english',
    coalesce(title,       '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(address,     '') || ' ' ||
    coalesce(city,        '')
  ));

-- -------------------------------------------------------
-- LISTINGS — spatial index (PostGIS)
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_listings_location
  ON listings USING GIST(location);

-- -------------------------------------------------------
-- LISTING IMAGES
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id
  ON listing_images(listing_id, sort_order);

-- Enforce one cover image per listing
CREATE UNIQUE INDEX IF NOT EXISTS idx_listing_images_one_cover
  ON listing_images(listing_id)
  WHERE is_cover = TRUE;

-- -------------------------------------------------------
-- LISTING AMENITIES
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_listing_amenities_listing_id
  ON listing_amenities(listing_id);

CREATE INDEX IF NOT EXISTS idx_listing_amenities_amenity_id
  ON listing_amenities(amenity_id);

-- -------------------------------------------------------
-- MESSAGES
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id
  ON messages(receiver_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id
  ON messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_messages_listing_id
  ON messages(listing_id);

-- Composite: thread view (both participants + listing + time)
CREATE INDEX IF NOT EXISTS idx_messages_thread
  ON messages(receiver_id, sender_id, listing_id, created_at DESC);

-- Partial: unread badge count
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON messages(receiver_id, is_read)
  WHERE is_read = FALSE;

-- -------------------------------------------------------
-- PAYMENT RECORDS
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_payment_records_user_id
  ON payment_records(user_id);

CREATE INDEX IF NOT EXISTS idx_payment_records_listing_id
  ON payment_records(listing_id);

CREATE INDEX IF NOT EXISTS idx_payment_records_tx_hash
  ON payment_records(transaction_hash);

-- Partial: pending/failed payments only (for webhook processing)
CREATE INDEX IF NOT EXISTS idx_payment_records_status
  ON payment_records(status)
  WHERE status IN ('pending', 'failed');

-- -------------------------------------------------------
-- RENT AGREEMENTS
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_rent_agreements_listing_id
  ON rent_agreements(listing_id);

CREATE INDEX IF NOT EXISTS idx_rent_agreements_tenant_id
  ON rent_agreements(tenant_id);

CREATE INDEX IF NOT EXISTS idx_rent_agreements_contract_id
  ON rent_agreements(contract_id);

-- Partial: active agreements only
CREATE INDEX IF NOT EXISTS idx_rent_agreements_active
  ON rent_agreements(status)
  WHERE status = 'active';