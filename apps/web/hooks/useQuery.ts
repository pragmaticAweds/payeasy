/**
 * @file useQuery.ts
 * @description React hook for Supabase queries with loading and error states.
 *
 * Usage:
 * ```tsx
 * 'use client'
 *
 * import { useQuery } from '@/hooks/useQuery'
 *
 * export function ListingsPage() {
 *   const { data: listings, loading, error, refetch } = useQuery(
 *     (supabase) => supabase.from('listings').select('*, landlord:users(*)').eq('status', 'active')
 *   )
 *
 *   if (loading) return <div>Loading...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *
 *   return <div>{listings.map(listing => <ListingCard key={listing.id} listing={listing} />)}</div>
 * }
 * ```
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import { useSupabase } from './useSupabase'

interface UseQueryOptions {
  /** Whether to fetch data immediately on mount (default: true) */
  enabled?: boolean
  /** Dependencies array to trigger refetch when changed */
  deps?: React.DependencyList
}

interface UseQueryReturn<T> {
  /** Query result data (null if not loaded or error occurred) */
  data: T | null
  /** Whether the query is currently loading */
  loading: boolean
  /** Error object if query failed */
  error: Error | null
  /** Manually trigger a refetch */
  refetch: () => Promise<void>
}

/**
 * Hook for executing Supabase queries with automatic loading and error states.
 *
 * @param queryFn - Function that takes supabase client and returns a query promise
 * @param options - Query options (enabled, deps)
 * @returns Query state and refetch function
 */
export function useQuery<T>(
  queryFn: (
    supabase: SupabaseClient<Database>
  ) => Promise<{ data: T | null; error: any }>,
  options: UseQueryOptions = {}
): UseQueryReturn<T> {
  const { enabled = true, deps = [] } = options
  const supabase = useSupabase()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<Error | null>(null)

  const executeQuery = useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      const result = await queryFn(supabase)

      if (result.error) {
        throw new Error(result.error.message || 'Query failed')
      }

      setData(result.data)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Unknown error')
      setError(errorObj)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [supabase, queryFn, enabled])

  useEffect(() => {
    executeQuery()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executeQuery, ...deps])

  return {
    data,
    loading,
    error,
    refetch: executeQuery,
  }
}
