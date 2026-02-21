-- USERS
CREATE TABLE IF NOT EXISTS public.users (
  id uuid not null primary key, -- UUID from auth.users
  email text,
  wallet_address text null,
  first_name text null,
  last_name text null
);
comment on table public.users is 'Profile data for each user.';
comment on column public.users.id is 'References the internal Supabase Auth user.';
