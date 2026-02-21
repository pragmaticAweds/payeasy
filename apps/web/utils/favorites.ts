import { createClient } from '@/lib/supabase/server'
import type { FavoritedListing } from '@/lib/types/favorites'

/**
 * Lightweight query: returns only the listing IDs a user has favorited.
 */
export async function getUserFavoriteIds(userId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_favorites')
    .select('listing_id')
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  return (data ?? []).map((row: { listing_id: string }) => row.listing_id)
}

/**
 * Full query: returns favorites joined with listing details, newest first.
 */
export async function getUserFavorites(userId: string): Promise<FavoritedListing[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_favorites')
    .select('*, listings(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data as FavoritedListing[]
}
