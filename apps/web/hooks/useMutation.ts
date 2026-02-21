/**
 * @file useMutation.ts
 * @description React hook for Supabase mutations (insert, update, delete) with loading and error states.
 *
 * Usage:
 * ```tsx
 * 'use client'
 *
 * import { useMutation } from '@/hooks/useMutation'
 *
 * export function CreateListingForm() {
 *   const { mutate: createListing, loading, error } = useMutation(
 *     (supabase, listing: ListingInsert) =>
 *       supabase.from('listings').insert(listing).select().single()
 *   )
 *
 *   const handleSubmit = async (listing: ListingInsert) => {
 *     const result = await createListing(listing)
 *     if (result) {
 *       console.log('Created:', result)
 *     }
 *   }
 *
 *   return <form onSubmit={handleSubmit}>...</form>
 * }
 * ```
 */

'use client'

import { useState, useCallback } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import { useSupabase } from './useSupabase'

interface UseMutationOptions<TData> {
  /** Callback when mutation succeeds */
  onSuccess?: (data: TData) => void
  /** Callback when mutation fails */
  onError?: (error: Error) => void
  /** Callback when mutation completes (success or error) */
  onSettled?: () => void
}

interface UseMutationReturn<TData, TVariables> {
  /** Execute the mutation with given variables */
  mutate: (variables: TVariables) => Promise<TData | null>
  /** Mutation result data (null if not executed or error occurred) */
  data: TData | null
  /** Whether the mutation is currently executing */
  loading: boolean
  /** Error object if mutation failed */
  error: Error | null
  /** Reset mutation state */
  reset: () => void
}

/**
 * Hook for executing Supabase mutations (insert, update, delete) with automatic state management.
 *
 * @param mutationFn - Function that takes supabase client and variables, returns a mutation promise
 * @param options - Mutation options (callbacks)
 * @returns Mutation state and mutate function
 */
export function useMutation<TData, TVariables = void>(
  mutationFn: (
    supabase: SupabaseClient<Database>,
    variables: TVariables
  ) => Promise<{ data: TData | null; error: any }>,
  options: UseMutationOptions<TData> = {}
): UseMutationReturn<TData, TVariables> {
  const { onSuccess, onError, onSettled } = options
  const supabase = useSupabase()
  const [data, setData] = useState<TData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData | null> => {
      setLoading(true)
      setError(null)

      try {
        const result = await mutationFn(supabase, variables)

        if (result.error) {
          throw new Error(result.error.message || 'Mutation failed')
        }

        setData(result.data)
        onSuccess?.(result.data!)
        return result.data
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Unknown error')
        setError(errorObj)
        setData(null)
        onError?.(errorObj)
        return null
      } finally {
        setLoading(false)
        onSettled?.()
      }
    },
    [supabase, mutationFn, onSuccess, onError, onSettled]
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    mutate,
    data,
    loading,
    error,
    reset,
  }
}
