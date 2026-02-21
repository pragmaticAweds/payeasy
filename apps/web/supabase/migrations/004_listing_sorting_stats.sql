-- Migration to add sorting counters to the `listings` table

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS favorite_count integer DEFAULT 0 NOT NULL;

-- Add indices to speed up ORDER BY queries
CREATE INDEX IF NOT EXISTS idx_listings_view_count ON public.listings (view_count DESC);
CREATE INDEX IF NOT EXISTS idx_listings_favorite_count ON public.listings (favorite_count DESC);
