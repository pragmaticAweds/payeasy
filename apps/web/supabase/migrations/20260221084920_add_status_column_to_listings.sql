-- Add status column to listings table

ALTER TABLE public.listings
ADD COLUMN status text NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_listings_status
  ON public.listings(status);