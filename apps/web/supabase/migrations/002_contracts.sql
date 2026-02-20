-- Migration to create the contracts table to store deployed contract details

CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id text NOT NULL,
  network text NOT NULL,
  deployed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users (or public depending on needs)
CREATE POLICY "Allow public read access to contracts" ON public.contracts
  FOR SELECT USING (true);

-- Allow insert/update only for service role (admin) since deployment script uses service_role key
-- Service role bypasses RLS automatically, but we can document this assumption here.
