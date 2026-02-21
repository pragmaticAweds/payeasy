-- Migration to track recently viewed listings per user

CREATE TABLE IF NOT EXISTS public.user_view_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid, -- nullable for anonymous users tracking locally/optionally globally if cookie-based
  listing_id uuid NOT NULL, -- references the assumed listings table ID
  viewed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indices for fast retrieval of latest views and distinct constraints
CREATE INDEX IF NOT EXISTS idx_user_view_history_user_id ON public.user_view_history (user_id);
CREATE INDEX IF NOT EXISTS idx_user_view_history_listing_id ON public.user_view_history (listing_id);
CREATE INDEX IF NOT EXISTS idx_user_view_history_viewed_at ON public.user_view_history (viewed_at DESC);

-- Set up RLS
ALTER TABLE public.user_view_history ENABLE ROW LEVEL SECURITY;

-- Users can only read and write their own views
CREATE POLICY "Users can insert their own view history" ON public.user_view_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own view history" ON public.user_view_history
  FOR SELECT USING (auth.uid() = user_id);

-- Optional: Allow anon insertions if we ever wish to store anonymous views globally via some anon-token.
-- For now, we handle anon strictly in localStorage, so no anon policy is needed.
