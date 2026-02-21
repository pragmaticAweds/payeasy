-- LISTINGS
CREATE TABLE IF NOT EXISTS public.listings (
  id uuid not null primary key,
    user_id uuid not null references public.users(id) on delete cascade,
    title text not null,
    description text,
    price numeric not null,
    location text,
    category text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
