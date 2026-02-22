-- Create the features table for Feature Flags
CREATE TABLE IF NOT EXISTS public.features (
    flag_key VARCHAR(255) PRIMARY KEY,
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    rollout_percentage INTEGER NOT NULL DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    target_segments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security) if needed in Supabase
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;

-- Allow public read access to features via the Anon key (for Next.js fetching if needed)
CREATE POLICY "Enable read access for all users" ON public.features FOR SELECT USING (true);

-- Allow Admins to insert, update, or delete configurations
CREATE POLICY "Enable all access for admins" ON public.features FOR ALL USING (auth.role() = 'service_role');
