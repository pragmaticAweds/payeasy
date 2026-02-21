/**
 * @file api.ts
 * @description Helper types for all API request/response shapes.
 *
 * Conventions:
 *  - `ApiResponse<T>`       — standard success/error envelope for every endpoint.
 *  - `PaginatedResponse<T>` — wrapper for list endpoints with pagination metadata.
 *  - `*Params`              — query-string parameter shapes for GET endpoints.
 *  - `*Response`            — projected (Pick/Omit) shapes safe to return from API
 *                             routes (avoid leaking internal fields).
 *
 * Import the database types from `./database` rather than duplicating them here.
 */

import type {
  Listing,
  ListingWithLandlord,
  Message,
  MessageWithSender,
  PaymentRecord,
  User,
  PublicUser,
  Conversation,
  ConversationWithUsers,
  ConversationMessage,
  ConversationMessageWithSender,
  UserFavorite,
  UserFavoriteWithListing,
} from './database'

// ──────────────────────────────────────────────────────────────
// Generic API Envelope
// ──────────────────────────────────────────────────────────────

/** Successful API response carrying strongly-typed data. */
export interface ApiSuccessResponse<T> {
  data: T
  error: null
}

/** Error API response — data is always null when error is set. */
export interface ApiErrorResponse {
  data: null
  error: {
    message: string
    /** Machine-readable error code, e.g. "LISTING_NOT_FOUND". */
    code?: string
    /** Additional context (validation errors, DB details, etc.). */
    details?: unknown
  }
}

/**
 * Discriminated union for every API route response.
 *
 * Usage:
 * ```ts
 * const res: ApiResponse<Listing> = await fetchListing(id)
 * if (res.error) { console.error(res.error.message); return }
 * console.log(res.data.title) // data is Listing here
 * ```
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

// ──────────────────────────────────────────────────────────────
// Pagination
// ──────────────────────────────────────────────────────────────

/** Metadata included with every paginated list response. */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

/** Standard paginated list response. */
export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationMeta
}

// ──────────────────────────────────────────────────────────────
// Listings
// ──────────────────────────────────────────────────────────────

/** Query-string parameters accepted by GET /api/listings/search. */
export interface ListingSearchParams {
  minPrice?: number
  maxPrice?: number
  /** City / address text or "lat,lng" coordinate pair. */
  location?: string
  /** Bounding radius around `location`, e.g. "5km" or "500m". */
  radius?: string
  /** Bounding box for map view: "west,south,east,north" (e.g. "-122.5,37.7,-122.3,37.8") */
  bbox?: string
  bedrooms?: number
  bathrooms?: number
  furnished?: boolean
  petFriendly?: boolean
  /** Comma-separated amenity slugs or an array. */
  amenities?: string[]
  /** Full-text search query across title and description. */
  search?: string

  sortBy?: 'price' | 'created_at' | 'bedrooms' | 'bathrooms'
  order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

/**
 * Response shape for GET /api/listings/search.
 * Top-level fields are kept for backwards compatibility while
 * the richer `PaginatedResponse` structure is also available.
 */
export interface ListingSearchResult {
  listings: ListingWithLandlord[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Minimal listing shape used in card/grid views.
 * Intentionally omits large text fields (description) to reduce payload.
 */
export type ListingCardResponse = Pick<
  Listing,
  | 'id'
  | 'title'
  | 'address'
  | 'rent_xlm'
  | 'bedrooms'
  | 'bathrooms'
  | 'furnished'
  | 'pet_friendly'
  | 'status'
  | 'created_at'
> & {
  landlord: PublicUser
  amenities: string[]
}

/** Full listing shape returned on the listing detail page. */
export type ListingDetailResponse = Listing & {
  landlord: PublicUser
  amenities: string[]
}

/** Request body for POST /api/listings. */
export type CreateListingBody = Omit<
  Listing,
  'id' | 'landlord_id' | 'status' | 'created_at' | 'updated_at'
>

/** Request body for PATCH /api/listings/:id. */
export type UpdateListingBody = Partial<CreateListingBody>

// ──────────────────────────────────────────────────────────────
// Messages
// ──────────────────────────────────────────────────────────────

/** A single listing's message thread returned by GET /api/messages/:listingId. */
export interface MessageThreadResponse {
  listing_id: string
  messages: MessageWithSender[]
  total: number
}

/** Request body for POST /api/messages. */
export type SendMessageBody = Pick<
  Message,
  'content' | 'listing_id' | 'recipient_id'
>

// ──────────────────────────────────────────────────────────────
// Payments
// ──────────────────────────────────────────────────────────────

/**
 * Condensed payment info included in listing or tenant summaries.
 * Excludes internal DB fields not needed by the client.
 */
export type PaymentSummary = Pick<
  PaymentRecord,
  | 'id'
  | 'amount_xlm'
  | 'status'
  | 'payment_period'
  | 'transaction_hash'
  | 'created_at'
  | 'confirmed_at'
>

/** Response shape for GET /api/payments?listingId=…  */
export interface ListingPaymentsResponse {
  listing_id: string
  payments: PaymentSummary[]
  total_paid_xlm: number
}

// ──────────────────────────────────────────────────────────────
// Authentication & User
// ──────────────────────────────────────────────────────────────

/**
 * Minimal user info returned in the auth token / session response.
 * Never includes email in the public response shape.
 */
export type AuthUserResponse = Pick<
  User,
  'id' | 'public_key' | 'username' | 'avatar_url'
>

/** Full profile returned by GET /api/users/:id (own profile, includes email). */
export type UserProfileResponse = Omit<User, 'updated_at'>

/** Public profile returned when viewing another user's info. */
export type PublicUserProfileResponse = PublicUser & {
  bio?: string
}

/** Request body for POST /api/users (registration). */
export type RegisterUserBody = Pick<
  User,
  'public_key' | 'username'
> & {
  email?: string
}

/** Request body for PATCH /api/users/:id. */
export type UpdateUserBody = Partial<
  Pick<User, 'username' | 'email' | 'avatar_url' | 'bio'>
>

// ──────────────────────────────────────────────────────────────
// Conversations
// ──────────────────────────────────────────────────────────────

/** Response shape for GET /api/conversations — list of user's conversations. */
export interface ConversationListResponse {
  conversations: ConversationWithUsers[]
  total: number
}

/** Response shape for GET /api/conversations/:id — single conversation with messages. */
export interface ConversationDetailResponse {
  conversation: ConversationWithUsers
  messages: ConversationMessageWithSender[]
  total_messages: number
}

/** Request body for POST /api/conversations — start a new conversation. */
export type CreateConversationBody = Pick<
  Conversation,
  'user1_id' | 'user2_id'
> & {
  listing_id?: string
  initial_message?: string
}

/** Request body for POST /api/conversations/:id/messages — send a message. */
export type SendConversationMessageBody = Pick<
  ConversationMessage,
  'content' | 'message_type'
>

/** Minimal conversation preview for inbox/list views. */
export type ConversationPreview = Pick<
  Conversation,
  'id' | 'last_message' | 'last_message_at' | 'created_at'
> & {
  other_user: PublicUser
  listing?: Pick<Listing, 'id' | 'title'>
  unread_count: number
}

// ──────────────────────────────────────────────────────────────
// Favorites
// ──────────────────────────────────────────────────────────────

/** Response shape for GET /api/users/me/favorites — user's favorite listings. */
export interface UserFavoritesResponse {
  favorites: UserFavoriteWithListing[]
  total: number
}

/** Response shape for POST /api/listings/:id/favorite — toggle favorite status. */
export interface FavoriteToggleResponse {
  favorited: boolean
  listing_id: string
}

/** Minimal favorite info for listing cards (shows if user favorited it). */
export type FavoriteStatus = {
  is_favorited: boolean
  favorite_count: number
}
