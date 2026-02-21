-- Add username to users table

ALTER TABLE public.users
ADD COLUMN username text UNIQUE NOT NULL DEFAULT 'user_' || gen_random_uuid()::text;

CREATE INDEX IF NOT EXISTS idx_users_username
  ON public.users(username);