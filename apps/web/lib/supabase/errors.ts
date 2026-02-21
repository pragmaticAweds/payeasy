/**
 * @file errors.ts
 * @description Error handling utilities for Supabase operations.
 *              Provides type-safe error handling and user-friendly messages.
 */

import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Custom error class for Supabase operations.
 */
export class SupabaseError extends Error {
  code?: string
  details?: string
  hint?: string

  constructor(message: string, postgrestError?: PostgrestError) {
    super(message)
    this.name = 'SupabaseError'
    this.code = postgrestError?.code
    this.details = postgrestError?.details
    this.hint = postgrestError?.hint
  }
}

/**
 * Maps Supabase error codes to user-friendly messages.
 */
const ERROR_MESSAGES: Record<string, string> = {
  '23505': 'This record already exists.',
  '23503': 'Cannot delete this record because it is referenced by other data.',
  '23502': 'Required field is missing.',
  '22P02': 'Invalid data format.',
  '42501': 'Permission denied. You do not have access to this resource.',
  '42P01': 'Table or view does not exist.',
  PGRST116: 'No rows found matching your query.',
  PGRST204: 'The requested resource was not found.',
  PGRST301: 'Invalid request parameters.',
}

/**
 * Converts a Supabase PostgrestError to a user-friendly message.
 *
 * @param error - PostgrestError from Supabase
 * @returns User-friendly error message
 */
export function getErrorMessage(error: PostgrestError | null): string {
  if (!error) {
    return 'An unknown error occurred.'
  }

  // Check for known error codes
  if (error.code && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code]
  }

  // Fall back to the error message
  return error.message || 'An unexpected error occurred.'
}

/**
 * Type guard to check if an error is a PostgrestError.
 */
export function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error
  )
}

/**
 * Wraps a Supabase query with error handling.
 * Returns a tuple of [data, error] for easier destructuring.
 *
 * @param queryPromise - Promise from a Supabase query
 * @returns Tuple of [data | null, error | null]
 *
 * @example
 * ```ts
 * const [listings, error] = await handleSupabaseQuery(
 *   supabase.from('listings').select()
 * )
 *
 * if (error) {
 *   console.error('Failed to fetch listings:', error.message)
 *   return
 * }
 *
 * console.log(listings) // TypeScript knows listings is not null here
 * ```
 */
export async function handleSupabaseQuery<T>(
  queryPromise: Promise<{ data: T | null; error: PostgrestError | null }>
): Promise<[T, null] | [null, SupabaseError]> {
  try {
    const { data, error } = await queryPromise

    if (error) {
      return [null, new SupabaseError(getErrorMessage(error), error)]
    }

    if (data === null) {
      return [null, new SupabaseError('No data returned from query.')]
    }

    return [data, null]
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred.'
    return [null, new SupabaseError(message)]
  }
}

/**
 * Wraps a Supabase mutation with error handling.
 * Throws a SupabaseError on failure for easier use in try/catch blocks.
 *
 * @param mutationPromise - Promise from a Supabase insert/update/delete
 * @returns The data from the mutation
 * @throws SupabaseError if the mutation fails
 *
 * @example
 * ```ts
 * try {
 *   const listing = await handleSupabaseMutation(
 *     supabase.from('listings').insert(newListing).select().single()
 *   )
 *   console.log('Created listing:', listing)
 * } catch (error) {
 *   if (error instanceof SupabaseError) {
 *     console.error('Failed to create listing:', error.message)
 *   }
 * }
 * ```
 */
export async function handleSupabaseMutation<T>(
  mutationPromise: Promise<{ data: T | null; error: PostgrestError | null }>
): Promise<T> {
  const { data, error } = await mutationPromise

  if (error) {
    throw new SupabaseError(getErrorMessage(error), error)
  }

  if (data === null) {
    throw new SupabaseError('Mutation succeeded but returned no data.')
  }

  return data
}

/**
 * Logs Supabase errors with additional context for debugging.
 *
 * @param error - PostgrestError or SupabaseError
 * @param context - Additional context about where the error occurred
 */
export function logSupabaseError(
  error: PostgrestError | SupabaseError,
  context: string
): void {
  console.error(`[Supabase Error] ${context}`, {
    message: error.message,
    code: 'code' in error ? error.code : undefined,
    details: 'details' in error ? error.details : undefined,
    hint: 'hint' in error ? error.hint : undefined,
  })
}

/**
 * Helper to check if a Supabase error is a "not found" error.
 */
export function isNotFoundError(error: PostgrestError | null): boolean {
  return error?.code === 'PGRST116' || error?.code === 'PGRST204'
}

/**
 * Helper to check if a Supabase error is a permission denied error.
 */
export function isPermissionError(error: PostgrestError | null): boolean {
  return error?.code === '42501'
}

/**
 * Helper to check if a Supabase error is a duplicate key error.
 */
export function isDuplicateError(error: PostgrestError | null): boolean {
  return error?.code === '23505'
}
