import type { Listing } from './supabase'

/** Row from the user_favorites table */
export type UserFavorite = {
  id: string
  user_id: string
  listing_id: string
  created_at: string
}

/** API response when toggling a favorite */
export type FavoriteToggleResponse = {
  favorited: boolean
  listing_id: string
}

/** A favorite joined with listing details (for the favorites page) */
export type FavoritedListing = UserFavorite & {
  listings: Listing
}
