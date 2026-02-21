/**
 * @file validation.ts
 * @description Zod schemas for runtime validation of all database operations
 *              and API inputs. Types derived via `z.infer<>` serve as the single
 *              source of truth for both compile-time and runtime safety.
 *
 * Conventions:
 *  - `*InsertSchema` — validation for new-record creation payloads.
 *  - `*UpdateSchema` — validation for partial update payloads.
 *  - `*Input`        — `z.infer<>` derived TypeScript type.
 *
 * Usage:
 * ```ts
 * import { listingInsertSchema } from '@/lib/types/validation'
 *
 * const result = listingInsertSchema.safeParse(req.body)
 * if (!result.success) {
 *   return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
 * }
 * // result.data is fully typed as ListingInsertInput
 * ```
 *
 * @see https://zod.dev
 */

import { z } from 'zod'

// ──────────────────────────────────────────────────────────────
// Primitive / Shared Schemas
// ──────────────────────────────────────────────────────────────

/** Validates a Stellar public key (starts with "G", exactly 56 base32 chars). */
export const stellarPublicKeySchema = z
  .string()
  .regex(
    /^G[A-Z2-7]{55}$/,
    'Must be a valid Stellar public key (56 characters, starts with G)',
  )

/** Validates an ISO-8601 UTC timestamp string. */
export const isoTimestampSchema = z.string().datetime({ offset: true })

/** Validates a UUID v4 string. */
export const uuidSchema = z.string().uuid('Must be a valid UUID')

/**
 * Validates a billing period in YYYY-MM format.
 * Example: "2026-02"
 */
export const paymentPeriodSchema = z
  .string()
  .regex(
    /^\d{4}-(0[1-9]|1[0-2])$/,
    'Payment period must be in YYYY-MM format (e.g. "2026-02")',
  )

/**
 * Validates a calendar date string in YYYY-MM-DD format.
 * Example: "2026-02-19"
 */
export const isoDateSchema = z
  .string()
  .regex(
    /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
    'Date must be in YYYY-MM-DD format (e.g. "2026-02-19")',
  )

/**
 * Validates a radius string accepted by the search API.
 * Accepts: "5km", "500m", "2.5km"
 */
export const radiusSchema = z
  .string()
  .regex(
    /^\d+(?:\.\d+)?\s*(km|m)?$/i,
    'Radius must be a number followed by "km" or "m" (e.g. "5km", "500m")',
  )

// ──────────────────────────────────────────────────────────────
// User Schemas
// ──────────────────────────────────────────────────────────────

export const userInsertSchema = z.object({
  id: uuidSchema.optional(),
  public_key: stellarPublicKeySchema,
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username may only contain letters, numbers, underscores, and hyphens',
    ),
  email: z.string().email('Must be a valid email address').optional().nullable(),
  avatar_url: z.string().url('Avatar URL must be a valid URL').optional().nullable(),
  bio: z
    .string()
    .max(500, 'Bio cannot exceed 500 characters')
    .optional()
    .nullable(),
})

export const userUpdateSchema = userInsertSchema
  .omit({ id: true, public_key: true })
  .partial()

// ──────────────────────────────────────────────────────────────
// Listing Schemas
// ──────────────────────────────────────────────────────────────

export const listingInsertSchema = z.object({
  id: uuidSchema.optional(),
  landlord_id: uuidSchema,
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(5000, 'Description cannot exceed 5000 characters'),
  address: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .max(255, 'Address cannot exceed 255 characters'),
  rent_xlm: z
    .number()
    .positive('Rent must be a positive number')
    .finite('Rent must be a finite number'),
  bedrooms: z.number().int('Bedrooms must be a whole number').min(0).max(20),
  bathrooms: z
    .number()
    .min(0, 'Bathrooms cannot be negative')
    .max(20, 'Bathrooms value is unrealistic'),
  furnished: z.boolean().optional().nullable(),
  pet_friendly: z.boolean().optional().nullable(),
  latitude: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .optional()
    .nullable(),
  longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .optional()
    .nullable(),
  contract_id: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'deleted']).default('active'),
})

export const listingUpdateSchema = listingInsertSchema
  .omit({ id: true, landlord_id: true })
  .partial()

// ──────────────────────────────────────────────────────────────
// ListingAmenity Schemas
// ──────────────────────────────────────────────────────────────

export const listingAmenityInsertSchema = z.object({
  id: uuidSchema.optional(),
  listing_id: uuidSchema,
  amenity: z
    .string()
    .min(1, 'Amenity name cannot be empty')
    .max(50, 'Amenity name cannot exceed 50 characters'),
})

// ──────────────────────────────────────────────────────────────
// Message Schemas
// ──────────────────────────────────────────────────────────────

export const messageInsertSchema = z
  .object({
    id: uuidSchema.optional(),
    sender_id: uuidSchema,
    listing_id: uuidSchema.optional().nullable(),
    recipient_id: uuidSchema.optional().nullable(),
    content: z
      .string()
      .min(1, 'Message cannot be empty')
      .max(10_000, 'Message cannot exceed 10 000 characters'),
    read: z.boolean().default(false),
  })
  .refine(
    (data) => data.listing_id != null || data.recipient_id != null,
    { message: 'A message must target either a listing or a recipient' },
  )

export const messageUpdateSchema = z.object({
  read: z.boolean(),
})

// ──────────────────────────────────────────────────────────────
// PaymentRecord Schemas
// ──────────────────────────────────────────────────────────────

export const paymentRecordInsertSchema = z.object({
  id: uuidSchema.optional(),
  listing_id: uuidSchema,
  tenant_id: uuidSchema,
  amount_xlm: z
    .number()
    .positive('Payment amount must be positive')
    .finite('Payment amount must be finite'),
  transaction_hash: z
    .string()
    .min(1, 'Transaction hash is required')
    .max(256, 'Transaction hash is too long'),
  stellar_ledger: z
    .number()
    .int('Ledger must be a whole number')
    .positive('Ledger must be positive')
    .optional()
    .nullable(),
  status: z.enum(['pending', 'confirmed', 'failed']).default('pending'),
  payment_period: paymentPeriodSchema,
  confirmed_at: isoTimestampSchema.optional().nullable(),
})

export const paymentRecordUpdateSchema = paymentRecordInsertSchema
  .pick({ status: true, stellar_ledger: true, confirmed_at: true })
  .partial()

// ──────────────────────────────────────────────────────────────
// RentAgreement Schemas
// ──────────────────────────────────────────────────────────────

const rentAgreementBaseSchema = z.object({
  id: uuidSchema.optional(),
  listing_id: uuidSchema,
  landlord_id: uuidSchema,
  contract_id: z.string().optional().nullable(),
  tenant_ids: z
    .array(uuidSchema)
    .min(1, 'At least one tenant is required')
    .max(20, 'Cannot have more than 20 tenants'),
  rent_xlm: z.number().positive('Rent must be a positive number').finite(),
  start_date: isoDateSchema,
  end_date: isoDateSchema.optional().nullable(),
  status: z
    .enum(['draft', 'active', 'completed', 'cancelled'])
    .default('draft'),
})

export const rentAgreementInsertSchema = rentAgreementBaseSchema
  .refine(
    (data) =>
      data.end_date == null ||
      new Date(data.end_date) > new Date(data.start_date),
    { message: 'End date must be after start date', path: ['end_date'] },
  )

export const rentAgreementUpdateSchema = rentAgreementBaseSchema
  .omit({ id: true, listing_id: true, landlord_id: true })
  .partial()
  .refine(
    (data) =>
      !data.end_date ||
      !data.start_date ||
      new Date(data.end_date) > new Date(data.start_date),
    { message: 'End date must be after start date', path: ['end_date'] },
  )

// ──────────────────────────────────────────────────────────────
// Conversation Schemas
// ──────────────────────────────────────────────────────────────

const conversationBaseSchema = z.object({
  id: uuidSchema.optional(),
  user1_id: uuidSchema,
  user2_id: uuidSchema,
  listing_id: uuidSchema.optional().nullable(),
  last_message: z.string().optional().nullable(),
  last_message_at: isoTimestampSchema.optional().nullable(),
  last_message_sender: uuidSchema.optional().nullable(),
})

export const conversationInsertSchema = conversationBaseSchema
  .refine((data) => data.user1_id !== data.user2_id, {
    message: 'Users cannot have a conversation with themselves',
    path: ['user2_id'],
  })
  .refine((data) => data.user1_id < data.user2_id, {
    message: 'user1_id must be less than user2_id (enforce canonical ordering)',
    path: ['user1_id'],
  })

export const conversationUpdateSchema = conversationBaseSchema
  .omit({ id: true, user1_id: true, user2_id: true })
  .partial()

// ──────────────────────────────────────────────────────────────
// Conversation Message Schemas
// ──────────────────────────────────────────────────────────────

export const messageTypeSchema = z.enum([
  'text',
  'image',
  'payment_request',
  'agreement_invite',
])

export const conversationMessageInsertSchema = z.object({
  id: uuidSchema.optional(),
  conversation_id: uuidSchema,
  sender_id: uuidSchema,
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message cannot exceed 5000 characters'),
  message_type: messageTypeSchema.default('text'),
  read_at: isoTimestampSchema.optional().nullable(),
  deleted_at: isoTimestampSchema.optional().nullable(),
})

export const conversationMessageUpdateSchema = z.object({
  read_at: isoTimestampSchema.optional().nullable(),
  deleted_at: isoTimestampSchema.optional().nullable(),
})

// ──────────────────────────────────────────────────────────────
// User Favorite Schemas
// ──────────────────────────────────────────────────────────────

export const userFavoriteInsertSchema = z.object({
  id: uuidSchema.optional(),
  user_id: uuidSchema,
  listing_id: uuidSchema,
})

// ──────────────────────────────────────────────────────────────
// Listing Search Params Schema
// ──────────────────────────────────────────────────────────────

/**
 * Validates and coerces query-string parameters for GET /api/listings/search.
 * All numeric values are coerced from strings since they arrive as query params.
 */
export const listingSearchParamsSchema = z.object({
  minPrice: z.coerce.number().nonnegative('Min price cannot be negative').optional(),
  maxPrice: z.coerce.number().positive('Max price must be positive').optional(),
  location: z.string().max(200).optional(),
  radius: radiusSchema.optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  bathrooms: z.coerce.number().min(0).optional(),
  furnished: z.coerce.boolean().optional(),
  petFriendly: z.coerce.boolean().optional(),
  amenities: z
    .union([
      z.string().transform((s) => s.split(',').map((a) => a.trim())),
      z.array(z.string()),
    ])
    .optional(),
  search: z.string().max(200, 'Search query cannot exceed 200 characters').optional(),
  sortBy: z.enum(['price', 'created_at', 'bedrooms', 'bathrooms']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

// ──────────────────────────────────────────────────────────────
// z.infer Derived Types — single source of truth for input shapes
// ──────────────────────────────────────────────────────────────

/** Validated input type for creating a user (from Zod schema). */
export type UserInsertInput = z.infer<typeof userInsertSchema>

/** Validated input type for updating a user (from Zod schema). */
export type UserUpdateInput = z.infer<typeof userUpdateSchema>

/** Validated input type for creating a listing (from Zod schema). */
export type ListingInsertInput = z.infer<typeof listingInsertSchema>

/** Validated input type for updating a listing (from Zod schema). */
export type ListingUpdateInput = z.infer<typeof listingUpdateSchema>

/** Validated input type for adding a listing amenity (from Zod schema). */
export type ListingAmenityInsertInput = z.infer<typeof listingAmenityInsertSchema>

/** Validated input type for creating a message (from Zod schema). */
export type MessageInsertInput = z.infer<typeof messageInsertSchema>

/** Validated input type for updating a message (from Zod schema). */
export type MessageUpdateInput = z.infer<typeof messageUpdateSchema>

/** Validated input type for recording a payment (from Zod schema). */
export type PaymentRecordInsertInput = z.infer<typeof paymentRecordInsertSchema>

/** Validated input type for updating a payment record (from Zod schema). */
export type PaymentRecordUpdateInput = z.infer<typeof paymentRecordUpdateSchema>

/** Validated input type for creating a rent agreement (from Zod schema). */
export type RentAgreementInsertInput = z.infer<typeof rentAgreementInsertSchema>

/** Validated input type for updating a rent agreement (from Zod schema). */
export type RentAgreementUpdateInput = z.infer<typeof rentAgreementUpdateSchema>

/** Validated input type for creating a conversation (from Zod schema). */
export type ConversationInsertInput = z.infer<typeof conversationInsertSchema>

/** Validated input type for updating a conversation (from Zod schema). */
export type ConversationUpdateInput = z.infer<typeof conversationUpdateSchema>

/** Validated input type for creating a conversation message (from Zod schema). */
export type ConversationMessageInsertInput = z.infer<
  typeof conversationMessageInsertSchema
>

/** Validated input type for updating a conversation message (from Zod schema). */
export type ConversationMessageUpdateInput = z.infer<
  typeof conversationMessageUpdateSchema
>

/** Validated input type for creating a user favorite (from Zod schema). */
export type UserFavoriteInsertInput = z.infer<typeof userFavoriteInsertSchema>

/** Validated input type for listing search query parameters (from Zod schema). */
export type ListingSearchParamsInput = z.infer<typeof listingSearchParamsSchema>
