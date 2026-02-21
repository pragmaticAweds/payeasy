create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete cascade not null,
  url text not null,
  thumbnail_url text not null,
  order_index integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Note: In a real project we'd also insert into storage.buckets securely.
-- Assuming 'listing-images' bucket is created manually or via migrations.
insert into storage.buckets (id, name, public) values ('listing-images', 'listing-images', true)
on conflict do nothing;

create policy "Public listing images are viewable by everyone." on storage.objects for select using ( bucket_id = 'listing-images' );
create policy "Users can upload their own listing images." on storage.objects for insert with check ( bucket_id = 'listing-images' );
create policy "Users can update their own listing images." on storage.objects for update using ( bucket_id = 'listing-images' );
create policy "Users can delete their own listing images." on storage.objects for delete using ( bucket_id = 'listing-images' );
