-- ============================================================
-- Migration: 20240101000005_create_triggers.sql
-- Description: Triggers for auto-timestamps, location sync,
--              listing availability, and agreement enforcement
-- Run this FIFTH in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- FUNCTION: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply to users
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Apply to listings
CREATE TRIGGER set_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Apply to rent_agreements
CREATE TRIGGER set_rent_agreements_updated_at
  BEFORE UPDATE ON rent_agreements
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- FUNCTION: auto-populate PostGIS location from lat/lng
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_listing_location()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location = ST_SetSRID(
      ST_MakePoint(NEW.longitude, NEW.latitude),
      4326
    )::GEOGRAPHY;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_listing_location
  BEFORE INSERT OR UPDATE OF latitude, longitude ON listings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_listing_location();

-- ============================================================
-- FUNCTION: sync listing availability from agreement status
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_listing_availability()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'active' THEN
    -- Mark listing as rented when agreement becomes active
    UPDATE listings SET status = 'rented' WHERE id = NEW.listing_id;
  ELSIF NEW.status IN ('expired', 'terminated') THEN
    -- Re-open listing when agreement ends
    UPDATE listings SET status = 'active' WHERE id = NEW.listing_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_listing_availability
  AFTER INSERT OR UPDATE OF status ON rent_agreements
  FOR EACH ROW EXECUTE FUNCTION trigger_listing_availability();

-- ============================================================
-- FUNCTION: prevent duplicate active agreements per listing
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_check_duplicate_agreement()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'active' AND EXISTS (
    SELECT 1 FROM rent_agreements
    WHERE listing_id = NEW.listing_id
      AND status = 'active'
      AND id <> NEW.id
  ) THEN
    RAISE EXCEPTION
      'Listing % already has an active rent agreement', NEW.listing_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_single_active_agreement
  BEFORE INSERT OR UPDATE OF status ON rent_agreements
  FOR EACH ROW EXECUTE FUNCTION trigger_check_duplicate_agreement();

-- ============================================================
-- FUNCTION: auto-increment view_count (call from API)
-- ============================================================
CREATE OR REPLACE FUNCTION increment_listing_views(listing_uuid UUID)
RETURNS void LANGUAGE sql AS $$
  UPDATE listings SET view_count = view_count + 1 WHERE id = listing_uuid;
$$;

-- ============================================================
-- RPC FUNCTION: radius search (used from Next.js / Postman)
-- ============================================================
CREATE OR REPLACE FUNCTION listings_within_radius(
  lat       FLOAT,
  lng       FLOAT,
  radius_km FLOAT
)
RETURNS SETOF listings
LANGUAGE sql STABLE AS $$
  SELECT * FROM listings
  WHERE status = 'active'
    AND location IS NOT NULL
    AND ST_DWithin(
      location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::GEOGRAPHY,
      radius_km * 1000   -- convert km → meters
    )
  ORDER BY
    location <-> ST_SetSRID(ST_MakePoint(lng, lat), 4326)::GEOGRAPHY;
$$;