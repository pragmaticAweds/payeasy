/**
 * @file database.ts
 * @description Canonical TypeScript type definitions for every database table.
 *
 * Conventions:
 *  - `*Row`    — exact 1-to-1 mapping of a PostgreSQL row (nulls explicit).
 *  - Plain interface (e.g. `User`) — domain-layer alias with optional fields
 *                                    (use after fetching & null-checking).
 *  - `*Insert` — fields required / allowed when inserting a new row.
 *  - `*Update` — Partial of the insert type used for PATCH/update operations.
 *  - `PublicUser`, `ListingCardResponse`, etc. — projected (Pick) shapes safe
 *                                                 to return in API responses.
 *  - Branded primitives enforce semantic correctness at the type level.
 *
 * @see https://www.typescriptlang.org/docs/handbook/2/types-from-types.html
 */

// ──────────────────────────────────────────────────────────────
// Branded Primitive Types
// ──────────────────────────────────────────────────────────────

/** Stellar public key string (G…, 56 characters). */
export type StellarPublicKey = string & { readonly __brand: 'StellarPublicKey' }

/** Soroban / Stellar smart-contract ID. */
export type ContractId = string & { readonly __brand: 'ContractId' }

/**
 * ISO-8601 UTC timestamp as returned by PostgreSQL / Supabase.
 * Example: "2026-02-19T12:34:56.789Z"
 */
export type ISOTimestamp = string & { readonly __brand: 'ISOTimestamp' }

// ──────────────────────────────────────────────────────────────
// Status Enums
// ──────────────────────────────────────────────────────────────

/** Status of a rental listing. */
export type ListingStatus = 'active' | 'inactive' | 'deleted'

/** Status of a Stellar payment transaction. */
export type PaymentStatus = 'pending' | 'confirmed' | 'failed'

/** Lifecycle status of a rent agreement. */
export type AgreementStatus = 'draft' | 'active' | 'completed' | 'cancelled'

// ──────────────────────────────────────────────────────────────
// User
// ──────────────────────────────────────────────────────────────

/** Exact database row shape for the `users` table. */
export interface UserRow {
  id: string
  public_key: StellarPublicKey
  username: string
  email: string | null
  avatar_url: string | null
  bio: string | null
  created_at: ISOTimestamp
  updated_at: ISOTimestamp
  images?: string[]
  landlord?: {
    username: string | null
    avatar_url: string | null
  }
}

/** Domain-layer user (optional fields instead of nulls). */
export interface User {
  id: string
  public_key: StellarPublicKey
  username: string
  email?: string
  avatar_url?: string
  bio?: string
  created_at: ISOTimestamp
  updated_at: ISOTimestamp
}

/** Fields allowed when inserting a new user row. */
export type UserInsert = Omit<UserRow, 'created_at' | 'updated_at'> & {
  id?: string
}

/** Fields allowed when updating an existing user (public_key is immutable). */
export type UserUpdate = Partial<Omit<UserInsert, 'id' | 'public_key'>>

/** Public-safe projection — never exposes email or bio to other users. */
export type PublicUser = Pick<User, 'id' | 'username' | 'avatar_url'>

// ──────────────────────────────────────────────────────────────
// Listing
// ──────────────────────────────────────────────────────────────

/** Exact database row shape for the `listings` table. */
export interface ListingRow {
  id: string
  landlord_id: string
  title: string
  description: string
  address: string
  rent_xlm: number
  bedrooms: number
  bathrooms: number
  furnished: boolean | null
  pet_friendly: boolean | null
  latitude: number | null
  longitude: number | null
  /** Soroban contract ID — populated once the landlord deploys the agreement. */
  contract_id: ContractId | null
  status: ListingStatus
  created_at: ISOTimestamp
  updated_at: ISOTimestamp
}

/** Domain-layer listing (optional fields instead of nulls). */
export interface Listing {
  id: string
  landlord_id: string
  title: string
  description: string
  address: string
  rent_xlm: number
  bedrooms: number
  bathrooms: number
  furnished?: boolean
  pet_friendly?: boolean
  latitude?: number
  longitude?: number
  contract_id?: ContractId
  status: ListingStatus
  created_at: ISOTimestamp
  updated_at: ISOTimestamp
}

/** Fields allowed when inserting a new listing row. */
export type ListingInsert = Omit<ListingRow, 'created_at' | 'updated_at'> & {
  id?: string
}

/** Fields allowed when updating an existing listing (landlord_id is immutable). */
export type ListingUpdate = Partial<Omit<ListingInsert, 'id' | 'landlord_id'>>

/** Listing joined with the landlord's public profile. */
export interface ListingWithLandlord extends Listing {
  landlord: PublicUser
}

/** Listing joined with its amenity list. */
export interface ListingWithAmenities extends Listing {
  amenities: string[]
}

/** Full listing detail with all relations — used on the detail page. */
export interface ListingDetail extends Listing {
  landlord: PublicUser
  amenities: string[]
}

// ──────────────────────────────────────────────────────────────
// ListingAmenity
// ──────────────────────────────────────────────────────────────

/** Exact database row shape for the `listing_amenities` table. */
export interface ListingAmenityRow {
  id: string
  listing_id: string
  amenity: string
}

/** Domain-layer listing amenity. */
export interface ListingAmenity {
  id: string
  listing_id: string
  amenity: string
}

/** Fields allowed when inserting a new amenity row. */
export type ListingAmenityInsert = Omit<ListingAmenityRow, 'id'> & { id?: string }

// ──────────────────────────────────────────────────────────────
// Message
// ──────────────────────────────────────────────────────────────

/**
 * Exact database row shape for the `messages` table.
 * Messages can be listing-contextual (listing_id set) or direct (recipient_id set).
 */
export interface MessageRow {
  id: string
  sender_id: string
  listing_id: string | null
  recipient_id: string | null
  content: string
  read: boolean
  created_at: ISOTimestamp
}

/** Domain-layer message (optional fields instead of nulls). */
export interface Message {
  id: string
  sender_id: string
  listing_id?: string
  recipient_id?: string
  content: string
  read: boolean
  created_at: ISOTimestamp
}

/** Fields allowed when inserting a new message row. */
export type MessageInsert = Omit<MessageRow, 'id' | 'created_at'> & {
  id?: string
}

/** Only `read` can be updated post-creation. */
export type MessageUpdate = Pick<MessageRow, 'read'>

/** Message joined with the sender's public profile. */
export interface MessageWithSender extends Message {
  sender: PublicUser
}

// ──────────────────────────────────────────────────────────────
// Conversation
// ──────────────────────────────────────────────────────────────

/** Message type enum — expanded beyond plain text. */
export type MessageType = 'text' | 'image' | 'payment_request' | 'agreement_invite'

/**
 * Exact database row shape for the `conversations` table.
 * Represents a unique conversation between two users, optionally tied to a listing.
 * user1_id < user2_id is enforced by a CHECK constraint to prevent duplicates.
 */
export interface ConversationRow {
  id: string
  /** Always the lesser UUID (enforced by CHECK constraint). */
  user1_id: string
  /** Always the greater UUID (enforced by CHECK constraint). */
  user2_id: string
  /** Optional listing context for the conversation. */
  listing_id: string | null
  /** Cached preview of the last message (truncated, updated by trigger). */
  last_message: string | null
  last_message_at: ISOTimestamp | null
  last_message_sender: string | null
  created_at: ISOTimestamp
  updated_at: ISOTimestamp
}

/** Domain-layer conversation (optional fields instead of nulls). */
export interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  listing_id?: string
  last_message?: string
  last_message_at?: ISOTimestamp
  last_message_sender?: string
  created_at: ISOTimestamp
  updated_at: ISOTimestamp
}

/** Fields allowed when inserting a new conversation row. */
export type ConversationInsert = Omit<ConversationRow, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
}

/** Fields allowed when updating a conversation (user IDs are immutable). */
export type ConversationUpdate = Partial<
  Omit<ConversationInsert, 'id' | 'user1_id' | 'user2_id'>
>

/**
 * Exact database row shape for the `messages` table (new schema).
 * Individual messages scoped to a conversation.
 */
export interface ConversationMessageRow {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: MessageType
  /** NULL means unread; set when the receiver reads the message. */
  read_at: ISOTimestamp | null
  /** Soft delete — row kept but hidden in UI. */
  deleted_at: ISOTimestamp | null
  created_at: ISOTimestamp
}

/** Domain-layer conversation message (optional fields instead of nulls). */
export interface ConversationMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: MessageType
  read_at?: ISOTimestamp
  deleted_at?: ISOTimestamp
  created_at: ISOTimestamp
}

/** Fields allowed when inserting a new conversation message. */
export type ConversationMessageInsert = Omit<
  ConversationMessageRow,
  'id' | 'created_at'
> & {
  id?: string
  message_type?: MessageType
}

/** Fields that can be updated post-creation. */
export type ConversationMessageUpdate = Partial<
  Pick<ConversationMessageRow, 'read_at' | 'deleted_at'>
>

/** Conversation enriched with participant info. */
export interface ConversationWithUsers extends Conversation {
  user1: PublicUser
  user2: PublicUser
  listing?: Pick<Listing, 'id' | 'title' | 'address'>
}

/** Conversation message joined with sender info. */
export interface ConversationMessageWithSender extends ConversationMessage {
  sender: PublicUser
}

// ──────────────────────────────────────────────────────────────
// PaymentRecord
// ──────────────────────────────────────────────────────────────

/**
 * Exact database row shape for the `payment_records` table.
 * Records an on-chain Stellar payment for a listing.
 */
export interface PaymentRecordRow {
  id: string
  listing_id: string
  tenant_id: string
  amount_xlm: number
  transaction_hash: string
  /** Stellar ledger sequence number — null until confirmed on-chain. */
  stellar_ledger: number | null
  status: PaymentStatus
  /** Billing period in YYYY-MM format, e.g. "2026-02". */
  payment_period: string
  created_at: ISOTimestamp
  confirmed_at: ISOTimestamp | null
}

/** Domain-layer payment record (optional fields instead of nulls). */
export interface PaymentRecord {
  id: string
  listing_id: string
  tenant_id: string
  amount_xlm: number
  transaction_hash: string
  stellar_ledger?: number
  status: PaymentStatus
  payment_period: string
  created_at: ISOTimestamp
  confirmed_at?: ISOTimestamp
}

/** Fields allowed when inserting a new payment record. */
export type PaymentRecordInsert = Omit<
  PaymentRecordRow,
  'id' | 'created_at'
> & {
  id?: string
  confirmed_at?: ISOTimestamp
}

/** Fields that can change after initial insert. */
export type PaymentRecordUpdate = Partial<
  Pick<PaymentRecordRow, 'status' | 'stellar_ledger' | 'confirmed_at'>
>

/** Payment enriched with tenant info for admin / landlord views. */
export interface PaymentRecordWithTenant extends PaymentRecord {
  tenant: PublicUser
}

// ──────────────────────────────────────────────────────────────
// RentAgreement
// ──────────────────────────────────────────────────────────────

/**
 * Exact database row shape for the `rent_agreements` table.
 * Bridges a Supabase listing with a deployed Soroban contract.
 */
export interface RentAgreementRow {
  id: string
  listing_id: string
  landlord_id: string
  /** Soroban contract address — null until deployed by the landlord. */
  contract_id: ContractId | null
  /** Ordered array of tenant user UUIDs stored as PostgreSQL `uuid[]`. */
  tenant_ids: string[]
  rent_xlm: number
  /** Agreement start date in YYYY-MM-DD format. */
  start_date: string
  /** Agreement end date in YYYY-MM-DD format — null for open-ended leases. */
  end_date: string | null
  status: AgreementStatus
  created_at: ISOTimestamp
  updated_at: ISOTimestamp
}

/** Domain-layer rent agreement (optional fields instead of nulls). */
export interface RentAgreement {
  id: string
  listing_id: string
  landlord_id: string
  contract_id?: ContractId
  tenant_ids: string[]
  rent_xlm: number
  start_date: string
  end_date?: string
  status: AgreementStatus
  created_at: ISOTimestamp
  updated_at: ISOTimestamp
}

/** Fields allowed when inserting a new rent agreement. */
export type RentAgreementInsert = Omit<
  RentAgreementRow,
  'created_at' | 'updated_at'
> & {
  id?: string
}

/** Fields that can be updated (listing_id and landlord_id are immutable). */
export type RentAgreementUpdate = Partial<
  Omit<RentAgreementInsert, 'id' | 'listing_id' | 'landlord_id'>
>

/** Full rent agreement with all related entities for the agreement detail view. */
export interface RentAgreementDetail extends RentAgreement {
  listing: ListingWithAmenities
  landlord: PublicUser
  tenants: PublicUser[]
}

// ──────────────────────────────────────────────────────────────
// UserFavorite
// ──────────────────────────────────────────────────────────────

/**
 * Exact database row shape for the `user_favorites` table.
 * Represents a user's bookmarked/favorited listing.
 */
export interface UserFavoriteRow {
  id: string
  user_id: string
  listing_id: string
  created_at: ISOTimestamp
}

/** Domain-layer user favorite. */
export interface UserFavorite {
  id: string
  user_id: string
  listing_id: string
  created_at: ISOTimestamp
}

/** Fields allowed when inserting a new favorite. */
export type UserFavoriteInsert = Omit<UserFavoriteRow, 'id' | 'created_at'> & {
  id?: string
}

/** Favorite joined with full listing details. */
export interface UserFavoriteWithListing extends UserFavorite {
  listing: ListingWithLandlord
}

// ──────────────────────────────────────────────────────────────
// Supabase Database Generic Interface
// ──────────────────────────────────────────────────────────────

/**
 * Typed Supabase database interface.
 *
 * Usage with the Supabase client:
 * ```ts
 * import { createClient } from '@supabase/supabase-js'
 * import type { Database } from '@/lib/types/database'
 *
 * const supabase = createClient<Database>(url, key)
 * // supabase.from('listings').select() → data is ListingRow[]
 * ```
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserRow
        Insert: UserInsert
        Update: UserUpdate
      }
      listings: {
        Row: ListingRow
        Insert: ListingInsert
        Update: ListingUpdate
      }
      listing_amenities: {
        Row: ListingAmenityRow
        Insert: ListingAmenityInsert
        Update: Partial<ListingAmenityInsert>
      }
      conversations: {
        Row: ConversationRow
        Insert: ConversationInsert
        Update: ConversationUpdate
      }
      messages: {
        Row: ConversationMessageRow
        Insert: ConversationMessageInsert
        Update: ConversationMessageUpdate
      }
      payment_records: {
        Row: PaymentRecordRow
        Insert: PaymentRecordInsert
        Update: PaymentRecordUpdate
      }
      rent_agreements: {
        Row: RentAgreementRow
        Insert: RentAgreementInsert
        Update: RentAgreementUpdate
      }
      user_favorites: {
        Row: UserFavoriteRow
        Insert: UserFavoriteInsert
        Update: never // Favorites cannot be updated, only created/deleted
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      listing_status: ListingStatus
      payment_status: PaymentStatus
      agreement_status: AgreementStatus
      message_type: MessageType
    }
  }
}
